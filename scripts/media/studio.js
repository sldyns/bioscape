import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createCellLoader } from "../../src/scene/cellLoader.js";
import { createDetailLoader } from "../../src/scene/detailLoader.js";
import { makePresentation } from "../../src/scene/presentation.js";
import { createPresentationAppearance } from "../../src/scene/presentationAppearance.js";
import { processLoaders } from "../../src/processes/loaders.js";
import { visibleProcessBounds } from "../../src/processes/sceneBounds.js";

const shots = [
  {
    id: "01-cell",
    node: "cell",
    seconds: 6,
    kicker: "BIOSCAPE / 生物图景",
    zh: ["看见微观。", "理解生命。"],
    en: "A closer look at life.",
    detail: "交互式三维结构与生物学过程",
    color: "#688e85",
  },
  {
    id: "02-plant",
    node: "plant",
    seconds: 5,
    kicker: "01 / STRUCTURES",
    zh: ["一层层深入。", "一个个看清。"],
    en: "From the cell to its inner world.",
    detail: "植物细胞 · 中央液泡与周缘细胞器",
    color: "#799166",
  },
  {
    id: "03-bacterium",
    node: "bacterium",
    seconds: 3,
    kicker: "SIX POINTS OF VIEW",
    zh: ["细菌。"],
    en: "Bacterium",
    detail: "革兰阴性杆菌的教学示意",
    color: "#6c9998",
  },
  {
    id: "04-yeast",
    node: "yeast",
    seconds: 3,
    kicker: "SIX POINTS OF VIEW",
    zh: ["真菌。"],
    en: "Yeast",
    detail: "以酵母为代表，观察真核微生物",
    color: "#a18b99",
  },
  {
    id: "05-paramecium",
    node: "paramecium",
    seconds: 3,
    kicker: "SIX POINTS OF VIEW",
    zh: ["草履虫。"],
    en: "Paramecium",
    detail: "纤毛、核与细胞内的功能分工",
    color: "#8a94ae",
  },
  {
    id: "06-phage",
    node: "phage",
    seconds: 4,
    kicker: "BEYOND THE CELL",
    zh: ["也不止于", "细胞。"],
    en: "Life, viewed at another scale.",
    detail: "T₂ 噬菌体 · 无细胞结构的病毒",
    color: "#879eb1",
  },
  {
    id: "07-mitochondria",
    node: "mitochondria",
    seconds: 6,
    explode: true,
    kicker: "02 / LOOK INSIDE",
    zh: ["旋转。剖视。", "拆解。"],
    en: "Understand how the pieces fit.",
    detail: "线粒体 · 由整体进入内部结构",
    color: "#b59972",
  },
  {
    id: "08-transcription",
    process: "transcription",
    root: "cell",
    seconds: 7,
    kicker: "03 / BIOLOGICAL PROCESSES",
    zh: ["让生命的过程，变得可见。"],
    en: "Transcription · follow the making of RNA.",
    detail: "转录 · RNA 聚合酶读取模板并合成 RNA",
    color: "#709796",
  },
  {
    id: "09-photosynthesis",
    process: "photosynthesis",
    root: "plant",
    seconds: 6,
    kicker: "FOLLOW THE TRANSFORMATION",
    zh: ["从光能，到生命的化学。"],
    en: "Photosynthesis · connect structure and function.",
    detail: "光合作用 · 光反应与卡尔文循环的联系",
    color: "#829b64",
  },
  {
    id: "10-translation",
    process: "translation",
    root: "cell",
    seconds: 6,
    kicker: "ZOOM IN ON THE MECHANISM",
    zh: ["从遗传信息，到蛋白质。"],
    en: "Translation · one step at a time.",
    detail: "核糖体翻译 · 实验结构与放大机制示意",
    color: "#9a879e",
  },
  {
    id: "11-finale",
    node: "cell",
    seconds: 5,
    kicker: "EXPLORE BIOSCAPE",
    zh: ["生命的细节，", "值得看清。"],
    en: "Explore. Uncover. Understand.",
    detail: "84 个生物学过程 · 六类入口 · 中英双语",
    color: "#688e85",
    finale: true,
  },
];
const canvas = document.querySelector("#film");
const ctx = canvas.getContext("2d", { alpha: false });
const status = document.querySelector("#status");
const select = document.querySelector("select");
for (const shot of shots) select.add(new Option(shot.id, shot.id));
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(1);
renderer.setClearColor("#f5f5f7");
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
const pmrem = new THREE.PMREMGenerator(renderer),
  room = new RoomEnvironment();
const environment = pmrem.fromScene(room, 0.04);
room.dispose();
pmrem.dispose();
const detailLoader = createDetailLoader();
const cellLoader = createCellLoader();
const cache = new Map();
let active,
  busy = false;
const smooth = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
const font = (size, weight = 400) =>
  `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif`;
function text(content, x, y, size, color = "#1d2930", weight = 400) {
  ctx.fillStyle = color;
  ctx.font = font(size, weight);
  ctx.fillText(content, x, y);
}
async function loadShot(shot) {
  if (cache.has(shot.id)) return cache.get(shot.id);
  status.textContent = `Preparing ${shot.id}…`;
  let model, view, definition;
  if (shot.process) {
    definition = (await processLoaders[shot.process]()).default;
    definition = { ...definition, ...definition.contexts?.[shot.root] };
    model = definition.create({ rootId: shot.root });
    const parameters = Object.fromEntries(
      (definition.controls ?? []).map((c) => [c.id, c.default]),
    );
    model.parameters = parameters;
    model.update(0, parameters);
  } else {
    const cell = await cellLoader.promise;
    const special =
      shot.node === "cell" ? null : await detailLoader.load(shot.node);
    view = makePresentation(cell, shot.node, special);
    model = { group: view.root };
    model.appearance = createPresentationAppearance(view.root);
    model.appearance("cut", null, 1);
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f5f5f7");
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.45;
  scene.add(new THREE.HemisphereLight("#ffffff", "#a0a6b2", 0.85));
  const key = new THREE.DirectionalLight("#fffaf5", 2.3);
  key.position.set(-5, 5, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight("#e2e9ff", 0.65);
  fill.position.set(4, 1, -3);
  scene.add(fill);
  scene.add(model.group);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const bounds = new THREE.Box3();
  if (shot.process) {
    for (let i = 0; i <= 10; i++) {
      model.update(i / 10, model.parameters);
      bounds.union(visibleProcessBounds(model.group));
    }
    model.update(0, model.parameters);
  } else bounds.setFromObject(model.group);
  const target = shot.process
    ? new THREE.Vector3().fromArray(model.camera.target)
    : new THREE.Vector3(0, 0, 0);
  const initial = shot.process
    ? new THREE.Vector3().fromArray(model.camera.position).sub(target)
    : new THREE.Vector3(0.3, 0.25, 10);
  const data = { shot, model, view, scene, camera, bounds, target, initial };
  cache.set(shot.id, data);
  return data;
}
function render(data, time) {
  const { shot, model, view, scene, camera, target, initial, bounds } = data;
  const p = Math.min(1, Math.max(0, time / shot.seconds));
  const wide = Boolean(shot.process);
  const w = wide ? 1720 : 1300,
    h = wide ? 750 : 990;
  if (renderer.domElement.width !== w || renderer.domElement.height !== h)
    renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (shot.process) model.update(0.08 + 0.82 * p, model.parameters);
  if (view) {
    const amount = shot.explode ? 0.9 * smooth((p - 0.12) / 0.68) : 0;
    for (const part of view.parts)
      part.position
        .copy(part.userData.home)
        .addScaledVector(part.userData.offset, amount);
    model.appearance(
      shot.explode && amount > 0.01 ? "explode" : "cut",
      null,
      1,
    );
  }
  const angle = wide ? 0.028 * Math.sin(p * Math.PI) : 0.13 - 0.26 * p;
  const direction = initial
    .clone()
    .normalize()
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  camera.position.copy(target).add(direction);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0),
    up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1),
    back = direction;
  let distance = 0;
  const tan = Math.tan(Math.PI / 10);
  const fitBounds = shot.explode
    ? new THREE.Box3().setFromObject(model.group)
    : bounds;
  for (const x of [fitBounds.min.x, fitBounds.max.x])
    for (const y of [fitBounds.min.y, fitBounds.max.y])
      for (const z of [fitBounds.min.z, fitBounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(target);
        distance = Math.max(
          distance,
          corner.dot(back) +
            1.16 *
              Math.max(
                Math.abs(corner.dot(right)) / (tan * camera.aspect),
                Math.abs(corner.dot(up)) / tan,
              ),
        );
      }
  camera.position
    .copy(target)
    .addScaledVector(direction, distance * (1.035 - 0.035 * smooth(p)));
  camera.lookAt(target);
  renderer.render(scene, camera);
  ctx.fillStyle = "#f5f5f7";
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.drawImage(renderer.domElement, wide ? 100 : 620, wide ? 245 : 40, w, h);
  text("BioScape", 90, 75, 30, "#253039", 650);
  text("生物图景", 242, 74, 17, "#828b91");
  text("KUN QIAN", 1690, 72, 15, "#7f8991", 500);
  ctx.strokeStyle = "#d9dde1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, 105);
  ctx.lineTo(1830, 105);
  ctx.stroke();
  if (wide) {
    text(shot.kicker, 90, 154, 15, shot.color, 550);
    text(shot.zh[0], 90, 218, 48, "#253039", 600);
    text(shot.en, 90, 1020, 23, "#63717a");
    text(shot.detail, 90, 1056, 16, "#7e8992");
  } else {
    const fade = smooth(p * 5);
    ctx.globalAlpha = fade;
    text(shot.kicker, 95, 325, 17, shot.color, 600);
    shot.zh.forEach((line, i) =>
      text(line, 90, 424 + i * 100, 76, "#253039", 600),
    );
    const end = 424 + (shot.zh.length - 1) * 100;
    text(shot.en, 95, end + 72, 24, "#63717a");
    ctx.fillStyle = shot.color;
    ctx.fillRect(95, end + 117, 42, 3);
    text(shot.detail, 95, end + 171, 21, "#73808a");
    if (shot.finale) {
      text("sldyns.github.io/bioscape", 95, end + 233, 27, "#253039", 500);
      text("Created by Kun Qian", 95, end + 280, 19, "#73808a");
    }
    ctx.globalAlpha = 1;
  }
  if (!wide) {
    text("交互式教学示意 · 非真实比例", 95, 1016, 16, "#8c959c");
    text("INTERACTIVE BIOLOGY, IN THREE DIMENSIONS", 95, 1047, 12, "#8c959c");
  }
  text(
    `${String(shots.indexOf(shot) + 1).padStart(2, "0")} / ${shots.length}`,
    1750,
    1035,
    18,
    "#8c959c",
  );
}
async function save(name, body) {
  const r = await fetch(`/__media/${name}`, { method: "POST", body });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function still(data) {
  render(data, data.shot.seconds * 0.46);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  await save(`${data.shot.id}.png`, blob);
  const modelBlob = await new Promise((r) =>
    renderer.domElement.toBlob(r, "image/png"),
  );
  await save(`${data.shot.id}-model.png`, modelBlob);
}
async function record(shot) {
  const data = await loadShot(shot);
  active = data;
  await still(data);
  const frames = Math.round(shot.seconds * 30);
  for (let i = 0; i < frames; i++) {
    const started = performance.now();
    render(data, i / 30);
    const rendered = performance.now();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.98),
    );
    await save(`${shot.id}-frame-${String(i).padStart(5, "0")}.jpg`, blob);
    status.textContent = `Rendering ${shot.id}: ${i + 1} / ${frames} · draw ${Math.round(rendered - started)} ms · total ${Math.round(performance.now() - started)} ms`;
  }
  await save(
    `${shot.id}.json`,
    JSON.stringify({
      id: shot.id,
      frames,
      fps: 30,
      width: 1920,
      height: 1080,
      source: shot.node ?? shot.process,
    }),
  );
  status.textContent = `Saved ${shot.id} · ${frames} frames`;
  // Each shot is an independent source render; release completed GPU buffers.
  const geometries = new Set(),
    materials = new Set();
  data.model.group.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  cache.delete(shot.id);
}
async function action(fn) {
  if (busy) return;
  busy = true;
  document
    .querySelectorAll("button,select")
    .forEach((e) => (e.disabled = true));
  try {
    await fn();
  } catch (e) {
    status.textContent = e.stack;
    console.error(e);
  } finally {
    busy = false;
    document
      .querySelectorAll("button,select")
      .forEach((e) => (e.disabled = false));
  }
}
select.onchange = () =>
  action(async () => {
    active = await loadShot(shots.find((s) => s.id === select.value));
    render(active, active.shot.seconds * 0.46);
    status.textContent = `Ready: ${active.shot.id}`;
  });
document.querySelector("#still").onclick = () =>
  action(async () => {
    await still(active);
    status.textContent = `Still saved: ${active.shot.id}`;
  });
document.querySelector("#record").onclick = () =>
  action(() => record(active.shot));
document.querySelector("#all").onclick = () =>
  action(async () => {
    for (const shot of shots.slice(
      shots.findIndex((s) => s.id === select.value),
    )) {
      select.value = shot.id;
      await record(shot);
    }
    status.textContent = "All remaining clips exported successfully.";
  });
await action(async () => {
  active = await loadShot(shots[0]);
  render(active, 2.5);
  status.textContent = "Ready: 01-cell";
});
