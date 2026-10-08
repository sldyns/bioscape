import {
  BackSide,
  DoubleSide,
  FrontSide,
  GLBufferAttribute,
  Matrix4,
  Material,
  Vector3,
} from "three";

// Omit only triangles the fixed-function face culler would reject. Original
// geometry, winding, pass order, shadows and raycasting remain unchanged.
const CLUSTER_INDICES = 24;
const MAX_GPU_BYTES = 192 * 1024 * 1024;
const UPLOAD_INDICES = 256 * 1024;

export function buildFacingBounds(geometry, startCluster, endCluster, bounds) {
  const indices = geometry.index.array,
    p = geometry.attributes.position;
  const normals = new Float64Array(24);
  for (let k = startCluster; k < endCluster; k++) {
    let x0 = Infinity,
      y0 = Infinity,
      z0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity,
      z1 = -Infinity;
    let nx = 0,
      ny = 0,
      nz = 0,
      count = 0;
    const end = Math.min((k + 1) * CLUSTER_INDICES, indices.length);
    for (let j = k * CLUSTER_INDICES; j < end; j += 3) {
      const a = indices[j],
        b = indices[j + 1],
        c = indices[j + 2];
      const ax = p.getX(a),
        ay = p.getY(a),
        az = p.getZ(a);
      const bx = p.getX(b),
        by = p.getY(b),
        bz = p.getZ(b);
      const cx = p.getX(c),
        cy = p.getY(c),
        cz = p.getZ(c);
      x0 = Math.min(x0, ax, bx, cx);
      x1 = Math.max(x1, ax, bx, cx);
      y0 = Math.min(y0, ay, by, cy);
      y1 = Math.max(y1, ay, by, cy);
      z0 = Math.min(z0, az, bz, cz);
      z1 = Math.max(z1, az, bz, cz);
      const ux = bx - ax,
        uy = by - ay,
        uz = bz - az,
        vx = cx - ax,
        vy = cy - ay,
        vz = cz - az;
      let x = uy * vz - uz * vy,
        y = uz * vx - ux * vz,
        z = ux * vy - uy * vx;
      const length = Math.hypot(x, y, z);
      if (length) {
        x /= length;
        y /= length;
        z /= length;
      }
      normals[count++] = x;
      normals[count++] = y;
      normals[count++] = z;
      nx += x;
      ny += y;
      nz += z;
    }
    const length = Math.hypot(nx, ny, nz);
    if (length) {
      nx /= length;
      ny /= length;
      nz /= length;
    }
    let delta = 0;
    for (let i = 0; i < count; i += 3)
      delta = Math.max(
        delta,
        Math.hypot(normals[i] - nx, normals[i + 1] - ny, normals[i + 2] - nz),
      );
    bounds.set(
      [
        (x0 + x1) / 2,
        (y0 + y1) / 2,
        (z0 + z1) / 2,
        Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2,
        nx,
        ny,
        nz,
        delta + 1e-10,
      ],
      k * 8,
    );
  }
}

// Each triangle normal n lies within delta of axis a; each vertex lies within
// R of the cluster center. Thus n.(eye-vertex) is bounded by a.(eye-center)
// plus/minus delta*|eye-center| + R + cameraRadius. Uncertain clusters retain
// both passes. The extra margin also keeps near-edge triangles conservative.
export function classifyFacingCluster(bounds, cluster, eye, radius) {
  const q = cluster * 8,
    x = eye.x - bounds[q],
    y = eye.y - bounds[q + 1],
    z = eye.z - bounds[q + 2];
  const dot = x * bounds[q + 4] + y * bounds[q + 5] + z * bounds[q + 6];
  const r = bounds[q + 3] + radius + 1e-6;
  const error2 = (x * x + y * y + z * z) * bounds[q + 7] ** 2;
  if (dot > r && (dot - r) ** 2 > error2) return 2;
  if (dot < -r && (dot + r) ** 2 > error2) return 1;
  return 3;
}

function eligible(mesh) {
  const g = mesh.geometry,
    m = mesh.material;
  return (
    mesh.isMesh &&
    !mesh.isInstancedMesh &&
    !mesh.isSkinnedMesh &&
    mesh.userData.hitId?.startsWith("para") &&
    g?.index?.count >= 120000 &&
    (g.index.array instanceof Uint16Array ||
      g.index.array instanceof Uint32Array) &&
    g.attributes.position?.array instanceof Float32Array &&
    !g.attributes.position.isInterleavedBufferAttribute &&
    !Object.keys(g.morphAttributes).length &&
    !g.groups.length &&
    g.drawRange.start === 0 &&
    g.drawRange.count === Infinity &&
    !Array.isArray(m) &&
    m.transparent &&
    !m.forceSinglePass &&
    m.side === DoubleSide &&
    !m.wireframe &&
    !m.displacementMap &&
    m.onBeforeCompile === Material.prototype.onBeforeCompile
  );
}

// Preparation is cooperative (2 ms of arithmetic and at most 1 MiB uploaded per
// rendered frame). A fast camera move uses full original indices until ready.
export function createFacingCull(renderer) {
  const gl = renderer.getContext(),
    direct = renderer.renderBufferDirect;
  const records = new Map(),
    inverse = new Matrix4();
  let activeRecords = [],
    job = null,
    scratch = null,
    gpuBytes = 0,
    disposed = false;
  function currentEye(record, camera) {
    return record.eye
      .setFromMatrixPosition(camera.matrixWorld)
      .applyMatrix4(inverse.copy(record.mesh.matrixWorld).invert());
  }
  function unchanged(r) {
    return (
      r.mesh.geometry === r.geometry &&
      r.geometry.index === r.index &&
      r.geometry.attributes.position === r.position &&
      r.index.version === r.indexVersion &&
      r.position.version === r.positionVersion
    );
  }
  function release(r) {
    if (r.disposed) return;
    r.disposed = true;
    if (job?.record === r) job = null;
    for (const attribute of r.gpu) gl.deleteBuffer(attribute.buffer);
    gpuBytes -= r.gpu.length * r.capacity * 4;
    r.gpu.length = 0;
    r.geometry.removeEventListener("dispose", r.onDispose);
    records.delete(r.mesh);
    r.bounds = null;
  }
  function allocate(r) {
    const previous = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
    try {
      for (let i = 0; i < 2; i++) {
        const buffer = gl.createBuffer();
        if (!buffer) throw Error("Index buffer unavailable");
        // WebGL2 requires the first binding to establish an element buffer.
        const attribute = new GLBufferAttribute(
          buffer,
          gl.UNSIGNED_INT,
          1,
          4,
          r.capacity,
        );
        r.gpu.push(attribute);
        gpuBytes += r.capacity * 4;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.capacity * 4, gl.DYNAMIC_DRAW);
        if (
          gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) !==
          r.capacity * 4
        )
          throw Error("Index buffer allocation failed");
      }
    } finally {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previous);
    }
  }
  function startJob(r, camera) {
    const eye = currentEye(r, camera).clone();
    job = {
      record: r,
      eye,
      radius: eye.length() * 0.12,
      cursor: 0,
      back: 0,
      front: 0,
      flags: new Uint8Array(r.clusters),
      stage: r.built < r.clusters ? "bounds" : "classify",
    };
  }
  function chunk() {
    const j = job,
      r = j.record,
      index = r.index.array;
    const end = Math.min(j.cursor + 512, r.clusters);
    if (j.stage === "bounds") {
      const to = Math.min(r.built + 128, r.clusters);
      buildFacingBounds(r.geometry, r.built, to, r.bounds);
      r.built = to;
      if (to === r.clusters) {
        j.stage = "classify";
        j.cursor = 0;
      }
    } else if (j.stage === "classify") {
      for (let k = j.cursor; k < end; k++) {
        const flags = classifyFacingCluster(r.bounds, k, j.eye, j.radius);
        j.flags[k] = flags;
        const count = Math.min(
          CLUSTER_INDICES,
          index.length - k * CLUSTER_INDICES,
        );
        if (flags & 1) j.back += count;
        if (flags & 2) j.front += count;
      }
      j.cursor = end;
      if (end === r.clusters) {
        if (j.back + j.front > r.capacity) {
          // Highly folded clusters can exceed the bounded cache: full draw.
          r.active = { eye: j.eye, radius: j.radius, fallback: true };
          job = null;
          return;
        }
        if (!scratch || scratch.length < r.capacity)
          scratch = new Uint32Array(r.capacity);
        j.stage = "copy";
        j.cursor = 0;
        j.backCursor = 0;
        j.frontCursor = j.back;
      }
    } else if (j.stage === "copy") {
      for (let k = j.cursor; k < end; k++) {
        const start = k * CLUSTER_INDICES,
          stop = Math.min(start + CLUSTER_INDICES, index.length);
        const flags = j.flags[k];
        if (flags & 1) {
          scratch.set(index.subarray(start, stop), j.backCursor);
          j.backCursor += stop - start;
        }
        if (flags & 2) {
          scratch.set(index.subarray(start, stop), j.frontCursor);
          j.frontCursor += stop - start;
        }
      }
      j.cursor = end;
      if (end === r.clusters) {
        j.stage = "upload";
        j.cursor = 0;
        j.ring = 1 - (r.active?.ring ?? 0);
      }
    }
  }
  function step(camera) {
    if (disposed || !camera.isPerspectiveCamera || gl.isContextLost()) return;
    if (job && (job.record.disposed || !unchanged(job.record))) job = null;
    if (!job) {
      const candidates = activeRecords.filter(
        (r) => !r.disposed && r.mesh.visible && unchanged(r),
      );
      const r =
        candidates.find(
          (r) =>
            !r.active ||
            currentEye(r, camera).distanceToSquared(r.active.eye) >
              r.active.radius ** 2,
        ) ||
        candidates.find(
          (r) =>
            currentEye(r, camera).distanceToSquared(r.active.eye) >
            (r.active.radius * 0.4) ** 2,
        );
      if (r) startJob(r, camera);
    }
    if (!job) return;
    const r = job.record;
    try {
      const deadline = performance.now() + 2;
      while (job && job.stage !== "upload" && performance.now() < deadline)
        chunk();
      if (!job || job.stage !== "upload") return;
      if (!r.gpu.length) {
        allocate(r);
        return;
      }
      const j = job,
        total = j.back + j.front,
        count = Math.min(UPLOAD_INDICES, total - j.cursor);
      const previous = gl.getParameter(gl.COPY_WRITE_BUFFER_BINDING);
      try {
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, r.gpu[j.ring].buffer);
        if (count)
          gl.bufferSubData(
            gl.COPY_WRITE_BUFFER,
            j.cursor * 4,
            scratch,
            j.cursor,
            count,
          );
      } finally {
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, previous);
      }
      j.cursor += count;
      if (j.cursor === total) {
        r.active = {
          eye: j.eye,
          radius: j.radius,
          ring: j.ring,
          back: j.back,
          front: j.front,
        };
        job = null;
      }
    } catch {
      // Resource pressure or unsupported GPU state must preserve the full model.
      release(r);
    }
  }
  const wrapped = function (camera, scene, geometry, material, object, group) {
    const r = records.get(object),
      a = r?.active;
    if (
      !a ||
      a.fallback ||
      !unchanged(r) ||
      material !== object.material ||
      !camera.isPerspectiveCamera ||
      group !== null ||
      material.wireframe ||
      (material.side !== BackSide && material.side !== FrontSide) ||
      !material.transparent ||
      material.forceSinglePass ||
      material.displacementMap ||
      material.onBeforeCompile !== Material.prototype.onBeforeCompile ||
      geometry.drawRange.start !== 0 ||
      geometry.drawRange.count !== Infinity ||
      currentEye(r, camera).distanceToSquared(a.eye) > a.radius ** 2
    ) {
      return direct.call(
        renderer,
        camera,
        scene,
        geometry,
        material,
        object,
        group,
      );
    }
    const index = geometry.index,
      range = geometry.drawRange;
    geometry.index = r.gpu[a.ring];
    geometry.drawRange =
      material.side === BackSide
        ? { start: 0, count: a.back }
        : { start: a.back, count: a.front };
    try {
      return direct.call(
        renderer,
        camera,
        scene,
        geometry,
        material,
        object,
        group,
      );
    } finally {
      geometry.index = index;
      geometry.drawRange = range;
    }
  };
  renderer.renderBufferDirect = wrapped;
  return {
    setRoot(root, id) {
      job = null;
      activeRecords = [];
      if (disposed || id !== "paramecium") return;
      root.traverse((mesh) => {
        if (!eligible(mesh)) return;
        let r = records.get(mesh);
        if (!r) {
          const geometry = mesh.geometry,
            index = geometry.index,
            position = geometry.attributes.position;
          const capacity = Math.ceil((index.count * 1.5) / 3) * 3;
          // Include pending records when reserving the fixed GPU budget.
          const reserved = [...records.values()].reduce(
            (sum, item) => sum + item.capacity * 8,
            0,
          );
          if (reserved + capacity * 8 > MAX_GPU_BYTES) return;
          const clusters = Math.ceil(index.count / CLUSTER_INDICES);
          r = {
            mesh,
            geometry,
            index,
            position,
            indexVersion: index.version,
            positionVersion: position.version,
            capacity,
            clusters,
            bounds: new Float64Array(clusters * 8),
            built: 0,
            eye: new Vector3(),
            gpu: [],
            active: null,
            disposed: false,
          };
          r.onDispose = () => release(r);
          geometry.addEventListener("dispose", r.onDispose);
          records.set(mesh, r);
        }
        activeRecords.push(r);
      });
    },
    step,
    dispose() {
      if (disposed) return;
      disposed = true;
      job = null;
      activeRecords = [];
      scratch = null;
      for (const r of [...records.values()]) release(r);
      if (renderer.renderBufferDirect === wrapped)
        renderer.renderBufferDirect = direct;
    },
    stats: () => ({
      records: records.size,
      gpuBytes,
      scratchBytes: scratch?.byteLength || 0,
      pending: !!job,
      prepared: [...records.values()].filter((r) => r.active).length,
      fallback: [...records.values()].filter((r) => r.active?.fallback).length,
    }),
  };
}
