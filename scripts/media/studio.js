import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createCellLoader } from "../../src/scene/cellLoader.js";
import { createDetailLoader } from "../../src/scene/detailLoader.js";
import { makePresentation } from "../../src/scene/presentation.js";
import { createPresentationAppearance } from "../../src/scene/presentationAppearance.js";
import { processLoaders } from "../../src/processes/loaders.js";
import { visibleProcessBounds } from "../../src/processes/sceneBounds.js";

// Each edition has its own editorial copy; neither relies on translated subtitles.
const shots = [
  {
    id: "01-cell",
    node: "cell",
    seconds: 6,
    color: "#688e85",
    zh: {
      kicker: "生物图景",
      title: ["看见微观。", "理解生命。"],
      subtitle: "从结构，走进生命的过程。",
      detail: "交互式三维生物学",
    },
    en: {
      kicker: "BIOSCAPE",
      title: ["A closer look", "at life."],
      subtitle: "Explore the structures and processes of life.",
      detail: "Interactive biology in three dimensions.",
    },
  },
  {
    id: "02-plant",
    node: "plant",
    seconds: 5,
    color: "#799166",
    zh: {
      kicker: "由整体，进入内部",
      title: ["一层层深入。", "一个个看清。"],
      subtitle: "植物细胞",
      detail: "中央液泡与周缘细胞器",
    },
    en: {
      kicker: "FROM THE WHOLE, TO WITHIN",
      title: ["Look inside.", "Go deeper."],
      subtitle: "The plant cell",
      detail: "A central vacuole. Organelles at its edges.",
    },
  },
  {
    id: "03-bacterium",
    node: "bacterium",
    seconds: 3,
    color: "#6c9998",
    zh: {
      kicker: "微观世界",
      title: ["细菌。"],
      subtitle: "另一种细胞结构。",
      detail: "以革兰阴性杆菌为例",
    },
    en: {
      kicker: "MICROSCOPIC WORLDS",
      title: ["Bacteria."],
      subtitle: "Another way to be a cell.",
      detail: "A Gram-negative rod, revealed.",
    },
  },
  {
    id: "04-yeast",
    node: "yeast",
    seconds: 3,
    color: "#a18b99",
    zh: {
      kicker: "微观世界",
      title: ["真菌。"],
      subtitle: "从酵母，看见真核微生物。",
      detail: "细胞壁、细胞核与内部区室",
    },
    en: {
      kicker: "MICROSCOPIC WORLDS",
      title: ["Fungi."],
      subtitle: "The inner world of yeast.",
      detail: "A cell wall, a nucleus, and living compartments.",
    },
  },
  {
    id: "05-paramecium",
    node: "paramecium",
    seconds: 3,
    color: "#8a94ae",
    zh: {
      kicker: "微观世界",
      title: ["草履虫。"],
      subtitle: "一个细胞，也能分工协作。",
      detail: "纤毛、细胞核与食物泡",
    },
    en: {
      kicker: "MICROSCOPIC WORLDS",
      title: ["Paramecium."],
      subtitle: "A single cell. Many coordinated functions.",
      detail: "Cilia, nuclei, and food vacuoles.",
    },
  },
  {
    id: "06-phage",
    node: "phage",
    seconds: 4,
    color: "#879eb1",
    zh: {
      kicker: "也不止于细胞",
      title: ["换个尺度，", "继续探索。"],
      subtitle: "T₂ 噬菌体",
      detail: "没有细胞结构的病毒",
    },
    en: {
      kicker: "BEYOND THE CELL",
      title: ["Another scale.", "Another world."],
      subtitle: "The T₂ bacteriophage",
      detail: "A virus without a cellular structure.",
    },
  },
  {
    id: "07-mitochondria",
    node: "mitochondria",
    seconds: 6,
    explode: true,
    color: "#b59972",
    zh: {
      kicker: "看清结构之间的联系",
      title: ["旋转。剖视。", "拆解。"],
      subtitle: "线粒体",
      detail: "从双层膜，深入内部的嵴",
    },
    en: {
      kicker: "SEE HOW THE PIECES FIT",
      title: ["Turn it.", "Open it up."],
      subtitle: "Inside the mitochondrion",
      detail: "From its membranes to the folds within.",
    },
  },
  {
    id: "08-transcription",
    process: "transcription",
    root: "cell",
    seconds: 7,
    color: "#709796",
    zh: {
      kicker: "生物学过程 · 转录",
      title: ["让生命的过程，变得可见。"],
      subtitle: "RNA 聚合酶读取 DNA 模板，合成新的 RNA。",
    },
    en: {
      kicker: "BIOLOGICAL PROCESSES · TRANSCRIPTION",
      title: ["Watch genetic information unfold."],
      subtitle:
        "RNA polymerase reads the DNA template and builds a new RNA strand.",
    },
  },
  {
    id: "09-photosynthesis",
    process: "photosynthesis",
    root: "plant",
    seconds: 6,
    color: "#829b64",
    zh: {
      kicker: "生物学过程 · 光合作用",
      title: ["从光能，到生命的化学。"],
      subtitle: "在类囊体膜与基质之间，连接光反应和卡尔文循环。",
    },
    en: {
      kicker: "BIOLOGICAL PROCESSES · PHOTOSYNTHESIS",
      title: ["From light to living chemistry."],
      subtitle:
        "Connect the light reactions in thylakoid membranes with the Calvin cycle in the stroma.",
    },
  },
  {
    id: "10-translation",
    process: "translation",
    root: "cell",
    seconds: 6,
    color: "#9a879e",
    zh: {
      kicker: "生物学过程 · 核糖体翻译",
      title: ["从遗传信息，到蛋白质。"],
      subtitle: "以实验结构为参照，逐步观察肽链的延长。",
    },
    en: {
      kicker: "BIOLOGICAL PROCESSES · TRANSLATION",
      title: ["From genetic information to protein."],
      subtitle:
        "An experimental structure beside a closer view of a growing peptide chain.",
    },
  },
  {
    id: "11-finale",
    node: "cell",
    seconds: 5,
    color: "#688e85",
    finale: true,
    zh: {
      kicker: "探索 BIOSCAPE",
      title: ["生命的细节，", "值得看清。"],
      subtitle: "由你，继续探索。",
      detail: "Kun Qian 创作",
    },
    en: {
      kicker: "EXPLORE BIOSCAPE",
      title: ["The detail", "of life."],
      subtitle: "Yours to explore.",
      detail: "Created by Kun Qian",
    },
  },
];
const languages = ["en", "zh"];
const canvas = document.querySelector("#film");
const ctx = canvas.getContext("2d", { alpha: false });
const status = document.querySelector("#status");
const select = document.querySelector("#shot");
const language = document.querySelector("#language");
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
function renderModel(data, time) {
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
  return { p, wide, w, h };
}
function fitText(content, x, y, size, width, color, weight = 400) {
  ctx.font = font(size, weight);
  const adjusted = Math.min(
    size,
    (size * width) / Math.max(1, ctx.measureText(content).width),
  );
  text(content, x, y, adjusted, color, weight);
}
function compose(data, frame, lang) {
  const { shot } = data;
  const { p, wide, w, h } = frame;
  const copy = shot[lang];
  ctx.fillStyle = "#f5f5f7";
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.drawImage(renderer.domElement, wide ? 100 : 620, wide ? 245 : 40, w, h);
  text("BioScape", 90, 75, 30, "#253039", 650);
  if (lang === "zh") text("生物图景", 242, 74, 17, "#828b91");
  text("KUN QIAN", 1690, 72, 15, "#7f8991", 500);
  ctx.strokeStyle = "#d9dde1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, 105);
  ctx.lineTo(1830, 105);
  ctx.stroke();
  if (wide) {
    text(copy.kicker, 90, 154, 15, shot.color, 550);
    fitText(copy.title[0], 90, 218, 48, 1700, "#253039", 600);
    fitText(copy.subtitle, 90, 1032, 23, 1660, "#63717a");
  } else {
    // Keep the opening frame readable in GitHub's native video poster.
    ctx.globalAlpha = shot.id === "01-cell" ? 1 : smooth(p * 5);
    fitText(copy.kicker, 95, 325, 17, 500, shot.color, 600);
    copy.title.forEach((line, i) =>
      fitText(
        line,
        90,
        424 + i * 100,
        lang === "en" ? 68 : 76,
        510,
        "#253039",
        600,
      ),
    );
    const end = 424 + (copy.title.length - 1) * 100;
    fitText(copy.subtitle, 95, end + 72, 24, 490, "#63717a");
    ctx.fillStyle = shot.color;
    ctx.fillRect(95, end + 117, 42, 3);
    fitText(copy.detail, 95, end + 171, 21, 490, "#73808a");
    if (shot.finale)
      text("sldyns.github.io/bioscape", 95, end + 233, 27, "#253039", 500);
    ctx.globalAlpha = 1;
    text(
      lang === "zh"
        ? "教学示意 · 非真实比例"
        : "Educational visualizations · not to scale",
      95,
      1035,
      16,
      "#8c959c",
    );
  }
}
function render(data, time) {
  compose(data, renderModel(data, time), language.value);
}
async function save(name, body) {
  const r = await fetch(`/__media/${name}`, { method: "POST", body });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function still(data) {
  const frame = renderModel(data, data.shot.seconds * 0.46);
  for (const lang of languages) {
    compose(data, frame, lang);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    await save(`${data.shot.id}-${lang}.png`, blob);
  }
  const modelBlob = await new Promise((r) =>
    renderer.domElement.toBlob(r, "image/png"),
  );
  await save(`${data.shot.id}-model.png`, modelBlob);
  compose(data, frame, language.value);
}
async function record(shot) {
  const data = await loadShot(shot);
  active = data;
  await still(data);
  const frames = Math.round(shot.seconds * 30);
  for (let i = 0; i < frames; i++) {
    // Share one full-detail 3D render between the two language compositions.
    const frame = renderModel(data, i / 30);
    for (const lang of languages) {
      compose(data, frame, lang);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.98),
      );
      await save(
        `${shot.id}-${lang}-frame-${String(i).padStart(5, "0")}.jpg`,
        blob,
      );
    }
    status.textContent = `Rendering both editions: ${shot.id} · ${i + 1} / ${frames}`;
  }
  await save(
    `${shot.id}.json`,
    JSON.stringify({
      id: shot.id,
      frames,
      fps: 30,
      width: 1920,
      height: 1080,
      languages,
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
language.onchange = () => render(active, active.shot.seconds * 0.46);
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
