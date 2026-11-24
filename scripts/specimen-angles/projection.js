import * as THREE from "three";
import { children } from "./src/hierarchy.js";
import { rootIds } from "./src/catalog/cellTypes.js";
import { buildCell } from "./src/scene/buildCell.js";
import { disposeCell } from "./src/scene/cellTransfer.js";
import { loadDetailModel } from "./src/scene/loadDetailModel.js";
import { makePresentation } from "./src/scene/presentation.js";
import { createPresentationAppearance } from "./src/scene/presentationAppearance.js";
import { isStructureLabelVisible } from "./src/scene/structureLabelModes.js";
import {
  specimenDirection,
  initialStructureMode,
  turnedView,
} from "./src/scene/specimenViews.js";
import { explodedFitDistance } from "./src/scene/viewFraming.js";
import {
  createSpecimenEnvironment,
  lightSpecimen,
} from "./src/scene/specimenLighting.js";

const rad = Math.PI / 180;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const round = (n) => Math.round(n * 100000) / 100000;
const average = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const quantile = (a, fraction) => a[Math.floor((a.length - 1) * fraction)] ?? 0;
const gray = new THREE.Color(1, 1, 1);
const yawChoices = [-135, -90, -45, 40, 85, 135];
const pitchChoices = [-62, -36, 36, 62];
const candidates = yawChoices
  .flatMap((y) => pitchChoices.map((p) => [y, p]))
  .concat([
    [-90, -22],
    [-90, 22],
    [0, -62],
    [0, 62],
  ]);
const headings = [[0, 0], [90, 0], [180, 0], [-90, 0], ...candidates];
const directions = Array.from({ length: 24 }, (_, i) => [
  Math.cos((i * Math.PI) / 12),
  Math.sin((i * Math.PI) / 12),
]);
const voxelSide = 16;
const roots = new Set(rootIds);
let renderer,
  target,
  scene,
  base,
  cache,
  proofRenderer,
  proofEnv,
  proofLights,
  W,
  H;

// The display colors are collapsed to seven anonymous classes. RGB stores the
// actual position of the foremost native triangle in world-space specimen axes.
// The class is written to the alpha channel without blending or color transforms.
const vs = `
  uniform vec3 baseColor;
  varying vec3 worldPos;
  varying vec3 pixelColor;
  void main(){
    vec4 local=vec4(position,1.);
    pixelColor=baseColor;
    #if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
      pixelColor*=color.rgb;
    #endif
    #ifdef USE_INSTANCING
      local=instanceMatrix*local;
    #endif
    #ifdef USE_INSTANCING_COLOR
      pixelColor*=instanceColor.rgb;
    #endif
    vec4 world=modelMatrix*local;
    worldPos=world.xyz;
    gl_Position=projectionMatrix*viewMatrix*world;
  }`;
const fs = `
  uniform float positionRadius;
  uniform float classCodes[7];
  varying vec3 worldPos;
  varying vec3 pixelColor;
  void main(){
    vec3 c=pixelColor;
    float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b));
    int k=0;
    if(hi-lo>max(.001,.16*hi)){
      if(c.r>=c.g && c.r>=c.b) k=c.g>=c.b?1:2;
      else if(c.g>=c.b) k=c.r>=c.b?3:4;
      else k=c.r>=c.g?5:6;
    }
    gl_FragColor=vec4(.5+.5*worldPos/positionRadius,classCodes[k]/255.);
  }`;

function init(width) {
  if (!Number.isInteger(width) || width < 8 || width > 2048 || width % 8)
    throw Error("Use a width from 8 to 2048 divisible by 8.");
  const ids = Object.keys(children),
    reachable = new Set();
  function visit(id) {
    if (reachable.has(id)) return;
    if (!Array.isArray(children[id]))
      throw Error("Missing structure in public hierarchy: " + id);
    reachable.add(id);
    children[id].forEach(visit);
  }
  rootIds.forEach(visit);
  if (ids.some((id) => !reachable.has(id)))
    throw Error("Public hierarchy contains unreachable specimens.");
  W = width;
  H = (width * 5) / 8;
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  renderer.setSize(4, 4, false);
  renderer.setClearColor(0, 0);
  target = new THREE.WebGLRenderTarget(W, H, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
  });
  scene = new THREE.Scene();
  base = buildCell();
  return {
    ids,
    choices: candidates,
    size: [W, H],
    device: renderer.getContext().getParameter(renderer.getContext().RENDERER),
  };
}

function orbit(dir, [dy, dp]) {
  const v = turnedView(
    { direction: dir, target: [0, 0, 0], zoom: 1 },
    dy * rad,
    dp * rad,
  );
  return new THREE.Vector3().fromArray(v.direction).normalize();
}

function cameraFor(direction) {
  const camera = new THREE.PerspectiveCamera(36, 1.6, 0.05, 100);
  camera.position.copy(direction);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const axes = [0, 1, 2].map((i) =>
    new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, i),
  );
  const distance = explodedFitDistance(cache.view.parts, 0, 1.6, 36, axes);
  camera.position.multiplyScalar(Math.max(4, distance));
  camera.updateMatrixWorld();
  return camera;
}

async function prepare(id) {
  release();
  const detail = await loadDetailModel(id);
  const view = makePresentation(
    roots.has(id) && id !== "cell" ? null : base,
    id,
    detail,
  );
  const mode = initialStructureMode(id);
  createPresentationAppearance(view.root)(mode, null, 1);
  view.root.updateMatrixWorld(true);
  const b = new THREE.Box3();
  for (const p of view.parts) b.union(p.userData.frameBounds);
  const radius =
    Math.max(
      ...b.min.toArray().map(Math.abs),
      ...b.max.toArray().map(Math.abs),
    ) * 1.002;
  if (!Number.isFinite(radius) || radius <= 0)
    throw Error("Invalid specimen bounds " + id);
  const partByNode = new Map();
  const anchors = [];
  const seen = new Set();
  for (const [index, p] of view.parts.entries()) {
    p.traverse((o) => partByNode.set(o, index));
    if (
      p.userData.hitId === id ||
      seen.has(p.userData.hitId) ||
      !isStructureLabelVisible(p.userData, mode)
    )
      continue;
    seen.add(p.userData.hitId);
    anchors.push(p.userData.labelAnchor.clone().applyMatrix4(p.matrixWorld));
  }
  for (const landmark of view.landmarks)
    if (isStructureLabelVisible(landmark, mode))
      anchors.push(
        landmark.position.clone().applyMatrix4(view.root.matrixWorld),
      );
  if (anchors.some((p) => p.toArray().some((x) => !Number.isFinite(x))))
    throw Error("Invalid labelled position " + id);
  const palette = new Map(),
    alpha = [0],
    records = [],
    originals = [],
    geometry = new Set(),
    bands = new Set();
  let instances = 0;
  view.root.traverseVisible((o) => {
    if (!o.isMesh) return;
    if (
      o.isSkinnedMesh ||
      o.isBatchedMesh ||
      o.morphTargetInfluences?.some((x) => x !== 0)
    )
      throw Error("Unsupported active vertex transform " + id);
    function replace(original) {
      const a = original.transparent ? clamp(original.opacity) : 1;
      const enabled = original.visible && a >= 0.02;
      const band = Math.round(a * 10);
      const codes = Array.from({ length: 7 }, (_, color) => {
        const key = [partByNode.get(o) ?? 0, band, color].join("/");
        if (!palette.has(key)) {
          palette.set(key, palette.size + 1);
          alpha.push(a);
        }
        return palette.get(key);
      });
      if (palette.size > 255)
        throw Error("Surface component palette exceeds byte range " + id);
      const m = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        uniforms: {
          positionRadius: { value: radius },
          baseColor: { value: original.color ?? gray },
          classCodes: { value: codes },
        },
        side: original.side,
        vertexColors: !!original.vertexColors,
        depthTest: true,
        depthWrite: true,
        blending: THREE.NoBlending,
        toneMapped: false,
        wireframe: !!original.wireframe,
      });
      m.visible = enabled;
      if (enabled) bands.add(a >= 0.62 ? "dense" : "translucent");
      records.push({ material: m, alpha: a, enabled });
      return m;
    }
    originals.push([o, o.material]);
    geometry.add(o.geometry);
    if (o.isInstancedMesh) instances += o.count;
    o.material = Array.isArray(o.material)
      ? o.material.map(replace)
      : replace(o.material);
  });
  scene.add(view.root);
  cache = {
    id,
    view,
    mode,
    radius,
    alpha,
    records,
    originals,
    geometry,
    anchors,
    instances,
    bands,
    dir: specimenDirection(id),
    partAnchors: seen.size,
  };
}

function release() {
  if (!cache) return;
  scene.remove(cache.view.root);
  for (const r of cache.records) r.material.dispose();
  for (const [o, m] of cache.originals) {
    o.material = m;
    if (o.isInstancedMesh) o.dispose();
  }
  for (const g of cache.geometry) g.dispose();
  renderer.renderLists.dispose();
  cache = null;
}

function read(camera, t, upperOnly) {
  for (const r of cache.records)
    r.material.visible = r.enabled && (!upperOnly || r.alpha >= 0.62);
  renderer.setRenderTarget(t);
  renderer.clear();
  renderer.render(scene, camera);
  const bytes = new Uint8Array(t.width * t.height * 4);
  renderer.readRenderTargetPixels(t, 0, 0, t.width, t.height, bytes);
  return bytes;
}

function nearLayers(camera, t) {
  const outer = read(camera, t, false);
  const mixed = cache.bands.size === 2;
  return [outer, mixed ? read(camera, t, true) : null];
}

function depth(world, i, direction) {
  return (
    (world[i] / 127.5 - 1) * direction.x +
    (world[i + 1] / 127.5 - 1) * direction.y +
    (world[i + 2] / 127.5 - 1) * direction.z
  );
}

function voxelAt(p, i) {
  return (
    (p[i] >> 4) +
    (p[i + 1] >> 4) * voxelSide +
    (p[i + 2] >> 4) * voxelSide * voxelSide
  );
}

function hullArea(points) {
  if (points.length < 3) return 0;
  const byX = Array.from(points).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  function half(a) {
    const chain = [];
    for (const p of a) {
      while (chain.length >= 2 && cross(chain.at(-2), chain.at(-1), p) <= 0)
        chain.pop();
      chain.push(p);
    }
    return chain;
  }
  const hull = half(byX).slice(0, -1).concat(half(byX.reverse()).slice(0, -1));
  return (
    Math.abs(
      hull.reduce((s, p, i) => {
        const q = hull[(i + 1) % hull.length];
        return s + p[0] * q[1] - p[1] * q[0];
      }, 0),
    ) / 2
  );
}

function analyzePair(camera, direction, outer, inside) {
  const bins = new Float32Array(4096),
    composition = new Float32Array(cache.alpha.length);
  const frontDepth = new Float32Array(W * H).fill(-Infinity);
  const frontAlpha = new Float32Array(W * H);
  const points = [],
    edge = [],
    rowDepth = [];
  let mass = 0,
    sumX = 0,
    sumY = 0,
    rim = 0,
    minX = W,
    minY = H,
    maxX = -1,
    maxY = -1;
  function add(p, i, w) {
    if (w <= 0) return;
    composition[p[i + 3]] += w;
    bins[voxelAt(p, i)] += w;
    mass += w;
  }
  for (let y = 0; y < H; y++) {
    let left = W,
      right = -1;
    for (let x = 0; x < W; x++) {
      const cell = y * W + x,
        i = cell * 4,
        code = outer[i + 3];
      if (!code) continue;
      const a = cache.alpha[code],
        outerDepth = depth(outer, i, direction);
      const innerCode = inside?.[i + 3] ?? 0;
      const distinct = !!innerCode && a < 0.62;
      // Complementary passes keep both a translucent exterior and the first
      // denser surface behind it. Equal/coincident foreground is counted once.
      const wa = distinct ? a : Math.max(a, 0.16);
      add(outer, i, wa);
      if (distinct) add(inside, i, (1 - a) * cache.alpha[innerCode]);
      const d = distinct
        ? wa * outerDepth + (1 - wa) * depth(inside, i, direction)
        : outerDepth;
      frontDepth[cell] = outerDepth;
      frontAlpha[cell] = a;
      if (wa < 0.1 && !distinct) continue;
      points.push([x, y, d]);
      sumX += x;
      sumY += y;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) rim++;
      if (x < left) left = x;
      if (x > right) right = x;
      rowDepth.push(d);
    }
    if (right >= left) {
      edge.push(
        [left - 0.5, y - 0.5],
        [left - 0.5, y + 0.5],
        [right + 0.5, y - 0.5],
        [right + 0.5, y + 0.5],
      );
      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      minY = Math.min(minY, y);
      maxY = y;
    }
  }
  if (!points.length || !Number.isFinite(mass) || !mass)
    throw Error("Blank projection " + cache.id);
  for (let i = 0; i < bins.length; i++) bins[i] /= mass;
  for (let i = 0; i < composition.length; i++) composition[i] /= mass;
  const cx = sumX / points.length,
    cy = sumY / points.length,
    support = directions.map(() => 0);
  let xx = 0,
    yy = 0,
    xy = 0,
    maxR2 = 0;
  for (const [x, y] of points) {
    const u = x - cx,
      v = y - cy;
    xx += u * u;
    yy += v * v;
    xy += u * v;
    maxR2 = Math.max(maxR2, u * u + v * v);
  }
  for (const [x, y] of edge)
    for (let k = 0; k < directions.length; k++)
      support[k] = Math.max(
        support[k],
        (x - cx) * directions[k][0] + (y - cy) * directions[k][1],
      );
  const scale = Math.max(...support);
  for (let i = 0; i < support.length; i++) support[i] /= scale;
  const discriminant = Math.hypot(xx - yy, 2 * xy);
  const aspect = Math.sqrt(
    Math.max(
      0,
      (xx + yy - discriminant) / Math.max(1e-6, xx + yy + discriminant),
    ),
  );
  const fill = clamp(points.length / Math.max(1, hullArea(edge)));
  const rings = [0, 0, 0, 0],
    counts = [0, 0, 0, 0];
  for (const [x, y, d] of points) {
    const s = clamp(
      Math.floor((4 * Math.hypot(x - cx, y - cy)) / Math.sqrt(maxR2 || 1)),
      0,
      3,
    );
    rings[s] += d;
    counts[s]++;
  }
  rowDepth.sort((a, b) => a - b);
  const medianDepth = quantile(rowDepth, 0.5);
  for (let k = 0; k < 4; k++)
    rings[k] = counts[k] ? rings[k] / counts[k] - medianDepth : 0;
  const spans = [
    quantile(rowDepth, 0.9) - quantile(rowDepth, 0.1),
    medianDepth,
  ];
  const apparent = [];
  const visibility = [];
  for (const point of cache.anchors) {
    const ndc = point.clone().project(camera);
    const px = (ndc.x * 0.5 + 0.5) * W - 0.5,
      py = (ndc.y * 0.5 + 0.5) * H - 0.5;
    const i =
      clamp(Math.round(py), 0, H - 1) * W + clamp(Math.round(px), 0, W - 1);
    const d = point.dot(direction) / cache.radius;
    const occlusion = frontDepth[i] - d;
    const remaining = 1 - clamp((occlusion - 0.055) / 0.35) * frontAlpha[i];
    apparent.push([px, py, d]);
    visibility.push(remaining);
  }
  const pairs = [],
    nearest = apparent.map(() => Infinity);
  for (let i = 0; i < apparent.length; i++)
    for (let j = i + 1; j < apparent.length; j++) {
      const spatial = cache.anchors[i].distanceTo(cache.anchors[j]);
      if (spatial < 0.01 * cache.radius) continue;
      const [a, b] = [apparent[i], apparent[j]];
      const spacing = Math.hypot(a[0] - b[0], a[1] - b[1]);
      nearest[i] = Math.min(nearest[i], spacing);
      nearest[j] = Math.min(nearest[j], spacing);
      pairs.push([
        clamp(spacing / (H * 0.19)),
        clamp(((a[2] - b[2]) * cache.radius) / spatial, -1, 1),
      ]);
    }
  const separated = nearest
    .filter(Number.isFinite)
    .map((x) => clamp(x / (H * 0.14)))
    .sort((a, b) => a - b);
  return {
    bins,
    composition,
    support,
    aspect,
    fill,
    rings,
    spans,
    direction,
    visibility,
    pairs,
    rim,
    spacing: separated.length
      ? (average(separated) + quantile(separated, 0.15)) * 0.5
      : 0,
    painted: points.length,
    reach: Math.max((maxX - minX + 1) / W, (maxY - minY + 1) / H),
  };
}

function silhouette(a, b) {
  let delta = Infinity;
  const n = a.support.length;
  // A roll or mirror alone is not an additional silhouette.
  for (const sign of [1, -1])
    for (let offset = 0; offset < n; offset++) {
      let loss = 0;
      for (let i = 0; i < n; i++)
        loss += Math.abs(a.support[i] - b.support[(i * sign + offset + n) % n]);
      delta = Math.min(delta, loss / n);
    }
  const ring = average(a.rings.map((x, i) => Math.abs(x - b.rings[i])));
  return clamp(
    0.29 * Math.abs(a.aspect - b.aspect) +
      0.24 * Math.abs(a.fill - b.fill) +
      0.21 * clamp(3 * delta) +
      0.15 * clamp(2 * ring) +
      0.11 *
        clamp(
          Math.abs(a.spans[0] - b.spans[0]) +
            0.35 * Math.abs(a.spans[1] - b.spans[1]),
        ),
  );
}

function score(a, ref) {
  const shape = Math.min(...ref.map((b) => silhouette(a, b)));
  let newSurface = 0,
    newComponent = 0;
  for (let i = 0; i < a.bins.length; i++)
    newSurface += Math.max(
      0,
      a.bins[i] - Math.max(ref[0].bins[i], ref[1].bins[i], ref[2].bins[i]),
    );
  for (let i = 0; i < a.composition.length; i++)
    newComponent += Math.max(
      0,
      a.composition[i] -
        Math.max(
          ref[0].composition[i],
          ref[1].composition[i],
          ref[2].composition[i],
        ),
    );
  const composition = Math.min(
    ...ref.map(
      (b) =>
        a.composition.reduce(
          (s, x, i) => s + Math.abs(x - b.composition[i]),
          0,
        ) * 0.5,
    ),
  );
  const visibleGain = average(
    a.visibility.map((x, i) =>
      Math.max(0, x - Math.max(...ref.map((b) => b.visibility[i]))),
    ),
  );
  const pairGain = average(
    a.pairs.map(([sep, z], i) => {
      const previous = ref.map((b) => b.pairs[i]);
      const spacing = Math.max(0, sep - Math.max(...previous.map((p) => p[0])));
      const depth = Math.max(
        0,
        z - Math.max(...previous.map((p) => p[1])),
        Math.min(...previous.map((p) => p[1])) - z,
      );
      return 0.5 * spacing + 0.5 * depth;
    }),
  );
  const constellation = a.pairs.length
    ? Math.min(
        ...ref.map((b) =>
          average(
            a.pairs.map(
              ([sep, z], i) =>
                0.55 * Math.abs(sep - b.pairs[i][0]) +
                (0.45 * Math.abs(z - b.pairs[i][1])) / 2,
            ),
          ),
        ),
      )
    : 0;
  const signature = clamp(
    2.7 * shape + 1.7 * composition + 1.4 * constellation,
  );
  // Reduced identity weight for unmarked, rotationally symmetric surfaces.
  const angle =
    Math.min(...ref.map((b) => a.direction.angleTo(b.direction))) / rad;
  const quality =
    0.6 * clamp(a.aspect / 0.22) + 0.4 * clamp(a.painted / (W * H * 0.11));
  const components = {
    newSurface,
    shape,
    composition,
    newComponent,
    visibleGain,
    pairGain,
    constellation,
    spacing: a.spacing,
    angle,
    quality,
    solidCoverage: a.painted / (W * H),
    edgePixels: a.rim,
  };
  const total =
    0.31 * newSurface * (0.28 + 0.72 * signature) +
    0.3 * shape +
    0.19 * composition +
    0.11 * newComponent +
    0.13 * visibleGain +
    0.11 * pairGain +
    0.105 * constellation +
    0.035 * a.spacing +
    0.035 * quality +
    0.018 * clamp(angle / 75);
  return { total, components };
}

async function analyze(id) {
  await prepare(id);
  const frames = headings.map((delta) => {
    const direction = orbit(cache.dir, delta),
      camera = cameraFor(direction);
    return analyzePair(camera, direction, ...nearLayers(camera, target));
  });
  const ref = frames.slice(0, 3);
  const bestReach = Math.max(
    ...frames.slice(4).map((f) => f.reach),
    ...ref.map((f) => f.reach),
  );
  const reachFloor = Math.min(
    0.69 * bestReach,
    Math.max(...frames.slice(4).map((f) => f.reach)),
  );
  const all = frames.slice(3).map((f, i) => {
    const result = score(f, ref);
    // On long specimens, a foreshortened end may occupy only a small corner of
    // its sheet tile. Keep an oblique orientation with a substantial readable
    // span. A thin side profile is welcome when its long edge remains legible.
    const legible = f.reach + 1e-12 >= reachFloor;
    if (!legible) result.total -= 1;
    Object.assign(result.components, {
      reach: f.reach,
      relativeReach: f.reach / bestReach,
      legible: Number(legible),
    });
    return { delta: headings[i + 3], ...result };
  });
  const byScore = all.slice(1).sort((a, b) => b.total - a.total);
  const row = byScore[0],
    legacy = all[0];
  const metrics = Object.fromEntries(
    Object.entries(row.components).map(([k, v]) => [k, round(v)]),
  );
  if (!Number.isFinite(row.total) || !row.delta[1])
    throw Error("Invalid selection " + id);
  return {
    id,
    delta: row.delta,
    mode: cache.mode,
    baseline: cache.dir.map(round),
    pitch: round(
      Math.asin(frames[headings.indexOf(row.delta)].direction.y) / rad,
    ),
    visibleMeshes: cache.originals.length,
    instances: cache.instances,
    anchors: cache.anchors.length,
    partAnchors: cache.partAnchors,
    alpha: cache.bands.size === 2,
    score: round(row.total),
    oldScore: round(legacy.total),
    spread: round(row.total - byScore.at(-1).total),
    margin: round(row.total - byScore[1].total),
    metrics,
    maxEdgeSamples: Math.max(...frames.map((f) => f.rim)),
    minFramePixels: Math.min(...frames.map((f) => f.painted)),
    ranked: byScore.map((o) => [...o.delta, round(o.total)]),
  };
}

async function review(id, fourth) {
  await prepare(id);
  for (const [o, m] of cache.originals) o.material = m;
  if (!proofRenderer) {
    proofRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    proofRenderer.setSize(576, 360, false);
    proofRenderer.shadowMap.enabled = true;
    proofRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    proofRenderer.setClearColor(0xf5f5f7, 0);
    proofEnv = createSpecimenEnvironment(proofRenderer);
    scene.environment = proofEnv.texture;
    proofLights = lightSpecimen(proofRenderer, scene, () => {});
    const { key } = proofLights;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
    });
    key.shadow.normalBias = 0.027;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 3;
  }
  let sheet = document.querySelector("#proof");
  if (!sheet) {
    sheet = document.createElement("canvas");
    sheet.id = "proof";
    sheet.width = 1152;
    sheet.height = 720;
    sheet.style.display = "block";
    document.body.style.margin = "0";
    document.body.append(sheet);
  }
  const ctx = sheet.getContext("2d");
  ctx.fillStyle = "#eeeae1";
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  [headings[0], headings[1], headings[2], fourth].forEach((delta, i) => {
    const direction = orbit(cache.dir, delta);
    proofRenderer.render(scene, cameraFor(direction));
    ctx.drawImage(
      proofRenderer.domElement,
      576 * (i % 2),
      360 * Math.floor(i / 2),
    );
  });
  return [sheet.width, sheet.height];
}
function finish() {
  release();
  disposeCell(base);
  target.dispose();
  renderer.dispose();
  proofLights?.dispose();
  proofEnv?.dispose();
  proofRenderer?.dispose();
}
window.angleAtlas = { init, analyze, review, finish };
