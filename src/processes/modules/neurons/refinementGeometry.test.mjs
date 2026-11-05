import assert from "node:assert/strict";
import test from "node:test";
import { Group, Matrix4, Triangle, Vector3 } from "three";
import actionPotential from "./actionPotentialProcess.js";
import muscle from "./muscleProcess.js";
import synapse from "./synapseProcess.js";
import ciliaryMotion from "./ciliaryMotionProcess.js";

test("updates preserve scientific state object identity", () => {
  for (const process of [actionPotential, muscle, synapse, ciliaryMotion]) {
    const scene = process.create();
    const state = scene.group.userData;
    for (const p of [0.7, 0.2, 0.7, NaN, 1]) {
      scene.update(p);
      assert.equal(scene.group.userData, state, process.id);
    }
  }
});

test("axon captions distinguish resting, open, inactivated and recovered channels", () => {
  const scene = actionPotential.create();
  const detail = scene.group.getObjectByName(
    "stationary selected membrane region enlarged",
  );
  const channels = detail.children.filter(
    (child) => child.name === "four-domain transmembrane pore",
  );
  assert.equal(channels.length, 2);
  const gates = channels.map((channel) => {
    const meshes = channel.children.filter((child) => child.isMesh);
    assert.equal(meshes.length, 1, "identify the actual pore closure");
    return meshes[0];
  });
  const ions = detail.children.filter(
    (child) => child.geometry?.type === "SphereGeometry",
  );
  assert.equal(ions.length, 6);
  // These interior observations include the short Na/K overlap and the later
  // Na-inactivated/K-closed interval; they do not infer state from a caption.
  const observations = [
    [0, "关闭", "closed", false, false],
    [0.48, "开放内流", "open, influx", true, false],
    [0.505, "开放内流", "open, influx", true, true],
    [0.55, "失活", "inactivated", false, true],
    [0.62, "失活", "inactivated", false, false],
    [0.7, "关闭，恢复可激活", "closed, excitable again", false, false],
    [1, "关闭，恢复可激活", "closed, excitable again", false, false],
  ];
  for (const stimulus of ["on", "off"])
    for (const [progress, zh, en, sodiumOpen, potassiumOpen] of observations) {
      scene.update(progress, { stimulus });
      const active = stimulus === "on";
      assert.deepEqual(scene.labels[1].text, {
        zh: `Na⁺ 通道 · ${active ? zh : "关闭"}`,
        en: `Na⁺ channel · ${active ? en : "closed"}`,
      });
      assert.deepEqual(scene.labels[2].text, {
        zh: `K⁺ 通道 · ${active && potassiumOpen ? "开放外流" : "关闭"}`,
        en: `K⁺ channel · ${active && potassiumOpen ? "open, efflux" : "closed"}`,
      });
      for (const [index, open] of [sodiumOpen, potassiumOpen].entries()) {
        assert.equal(gates[index].visible, !(active && open));
        assert.equal(
          ions.some(
            (ion) => ion.visible && ion.position.x < 0 === (index === 0),
          ),
          active && open,
          "caption agrees with actual pore closure and displayed local ions",
        );
      }
    }
});

test("blocked presynaptic calcium retains the docked fusion machinery", () => {
  const scene = synapse.create();
  const machinery = scene.group.getObjectByName(
    "primed vesicle fusion machinery",
  );
  assert.ok(machinery);
  assert.equal(machinery.children.length, 10);
  const contents = machinery.children.map((child) => child.uuid);
  const pore = scene.group.children.find((child) =>
    child.children.some((mesh) => mesh.name === "AMPA cation gate"),
  );
  assert.ok(pore, "inspect a real postsynaptic gate");
  const docked = scene.group.getObjectByName("docked vesicle cutaway");
  const fusedShell = scene.group.getObjectByName("fused vesicle cutaway");
  assert.ok(docked && fusedShell);
  for (const progress of [0, 0.14, 0.38, 0.64, 0.66, 0.8, 1, 0.2, 1]) {
    scene.update(progress, { calcium: "blocked" });
    assert.equal(machinery.visible, true);
    assert.deepEqual(
      machinery.children.map((child) => child.uuid),
      contents,
    );
    assert.ok(machinery.children.every((child) => child.visible));
    assert.equal(scene.group.userData.fusionPoreOpen, false);
    assert.equal(docked.visible, true);
    assert.equal(fusedShell.visible, false);
    assert.equal(pore.getObjectByName("AMPA cation gate").visible, true);
    assert.deepEqual(scene.labels[2].text, {
      zh: "已停靠囊泡 · 未融合",
      en: "Docked vesicle · not fused",
    });
  }
  for (const [progress, retained, fused] of [
    [0.2, true, false],
    [0.4, true, true],
    [0.7, false, true],
    [1, false, true],
    [0, true, false],
  ]) {
    scene.update(progress, { calcium: "available" });
    assert.equal(machinery.visible, retained);
    assert.equal(scene.group.userData.fusionPoreOpen, fused);
    assert.equal(docked.visible, !fused);
    assert.equal(fusedShell.visible, fused);
    assert.deepEqual(scene.labels[2].text, {
      zh: fused ? "融合孔 · 连通细胞外" : "已停靠囊泡 · 未融合",
      en: fused
        ? "Fusion pore · open to extracellular space"
        : "Docked vesicle · not fused",
    });
  }
});

test("enlarged membrane leaves camera-facing channel halves exposed", () => {
  const scene = actionPotential.create();
  const detail = scene.group.getObjectByName(
    "stationary selected membrane region enlarged",
  );
  const lipids = detail.children[0];
  const matrix = new Matrix4(),
    position = new Vector3();
  let count = 0;
  lipids.traverse((mesh) => {
    if (!mesh.isInstancedMesh) return;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      assert.ok(position.z <= 1e-6);
      count++;
    }
  });
  assert.ok(count > 100);
});

test("SR cutaway exposes a continuous lumen with finite wall thickness", () => {
  const scene = muscle.create();
  const outer = scene.group.getObjectByName("SR cutaway outer membrane");
  const inner = scene.group.getObjectByName("SR exposed luminal membrane");
  assert.ok(outer && inner);
  assert.equal(outer.geometry.parameters.openEnded, true);
  assert.equal(inner.geometry.parameters.openEnded, true);
  assert.ok(
    outer.geometry.parameters.radiusTop > inner.geometry.parameters.radiusTop,
  );
  assert.equal(
    outer.geometry.parameters.height,
    inner.geometry.parameters.height,
  );
  assert.ok(outer.geometry.parameters.thetaLength < Math.PI * 2);
  assert.ok(scene.group.getObjectByName("SR open lumen rim"));
});

function displayedSurfaceDistance(mesh, position) {
  const vertices = mesh.geometry.attributes.position,
    indices = mesh.geometry.index,
    start = mesh.geometry.drawRange.start,
    end = Math.min(indices.count, start + mesh.geometry.drawRange.count),
    target = new Vector3().fromArray(position),
    triangle = new Triangle(),
    closest = new Vector3();
  mesh.updateWorldMatrix(true, false);
  let distance = Infinity;
  for (let i = start; i + 2 < end; i += 3) {
    for (const [offset, point] of [
      [0, triangle.a],
      [1, triangle.b],
      [2, triangle.c],
    ])
      point
        .fromBufferAttribute(vertices, indices.getX(i + offset))
        .applyMatrix4(mesh.matrixWorld);
    triangle.closestPointToPoint(target, closest);
    distance = Math.min(distance, target.distanceTo(closest));
  }
  return distance;
}

test("SR leader meets the displayed membrane across calcium states and parent poses", () => {
  for (const rootId of ["cell", "muscleFibre"]) {
    const scene = muscle.create({ rootId }),
      sr = scene.group.getObjectByName("sarcoplasmic reticulum calcium store"),
      wall = scene.group.getObjectByName("SR cutaway outer membrane"),
      geometry = wall.geometry,
      positions = geometry.attributes.position.array,
      indices = geometry.index.array,
      labelPosition = scene.labels[1].position,
      parent = new Group();
    parent.position.set(0.7, -0.3, 0.2);
    parent.rotation.set(0.17, -0.23, 0.09);
    parent.scale.set(1.13, 0.87, 1.06);
    parent.add(scene.group);
    scene.group.position.set(-0.18, 0.12, -0.07);
    scene.group.scale.set(0.93, 1.08, 0.96);
    sr.position.add(new Vector3(0.12, -0.08, 0.09));
    sr.rotation.set(0.08, -0.12, 0.03);
    wall.rotation.y = 0.14;
    wall.scale.set(1.05, 0.97, 1.09);
    const progress = [
        0, 0.149999, 0.15, 0.27, 0.309999, 0.31, 0.429999, 0.43, 0.57, 0.61,
        0.62, 0.649999, 0.65, 0.675, 0.72, 0.8, 0.829999, 0.83, 0.85, 0.94, 1,
      ],
      repeated = new Map();
    for (const calcium of ["released", "low", "released"])
      for (const p of [...progress, ...progress.toReversed(), ...progress]) {
        scene.group.rotation.set(0.06 * p, 0.13 * p, -0.04 * p);
        scene.update(p, { calcium });
        parent.updateMatrixWorld(true);
        assert.equal(scene.labels[1].position, labelPosition);
        assert.equal(wall.geometry, geometry);
        assert.equal(geometry.attributes.position.array, positions);
        assert.equal(geometry.index.array, indices);
        assert.notEqual(scene.labels[1].active, false);
        for (let object = wall; object; object = object.parent)
          assert(object.visible);
        const distance = displayedSurfaceDistance(
          wall,
          scene.labels[1].position,
        );
        assert(
          distance < 1e-7,
          `SR leader detached at ${rootId}/${calcium}/${p}: ${distance}`,
        );
        const key = `${calcium}:${p}`;
        if (repeated.has(key))
          assert.deepEqual(labelPosition, repeated.get(key));
        else repeated.set(key, [...labelPosition]);
      }
  }
});
