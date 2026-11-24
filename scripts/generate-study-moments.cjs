// node --expose-gc scripts/generate-study-moments.cjs [--check] [--report path]
// Sample the live model factories without a GPU. See docs/performance/specimen-study.md.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { pathToFileURL } = require("node:url");
const { createHash } = require("node:crypto");
const assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "..");
const requireHere = Module.createRequire(path.join(repo, "package.json"));
const THREE = requireHere("three");
const { build } = requireHere("esbuild");
const percentages = [12, 25, 38, 50, 62, 75, 88];
const hash = (data) => createHash("sha256").update(data).digest("hex");
const span = (a, b, t) => a + ((b - a) * t) / 100;
const sourcePath = (relative) => path.join(repo, relative);
const tablePath = sourcePath("src/processes/studyMoments.json");

async function sources() {
  const { extensionEntries } = await import(
    pathToFileURL(sourcePath("src/processes/extensions.js"))
  );
  const files = [
    "./phageProcess.js",
    "./photosynthesisProcess.js",
    "./secretionProcess.js",
    "./transcriptionProcess.js",
    ...extensionEntries.map((e) => e.module),
  ];
  const contents =
    files
      .map((f, i) => `import d${i} from './src/processes/${f.slice(2)}'`)
      .join("\n") +
    "\n" +
    `export const definitions=[${files.map((_, i) => "d" + i)}];\n` +
    `export {homeProcesses} from './src/home/catalog.js'; export {processesByRoot} from './src/processes/catalog.js';\n` +
    `export {restoreProcessSession} from './src/exploration/processSession.js'; export {disposeScene} from './src/processes/disposeScene.js'; export {refreshFramingTransforms} from './src/processes/sceneBounds.js';`;
  // Hash the exact bytes read by esbuild, including local working changes.
  const snapshots = new Map();
  const captureInputs = {
    name: "record-sampling-inputs",
    setup(builder) {
      builder.onLoad({ filter: /\.(js|json)$/ }, ({ path: file }) => {
        const bytes = fs.readFileSync(file);
        snapshots.set(path.relative(repo, file), hash(bytes));
        return {
          contents: bytes,
          loader: file.endsWith(".json") ? "json" : "js",
          resolveDir: path.dirname(file),
        };
      });
    },
  };
  const result = await build({
    stdin: { contents, resolveDir: repo },
    absWorkingDir: repo,
    bundle: true,
    packages: "external",
    platform: "node",
    format: "cjs",
    metafile: true,
    write: false,
    logLevel: "silent",
    plugins: [captureInputs],
  });
  const lib = new Module(sourcePath("stage-frame-runtime.cjs"));
  lib.filename = sourcePath("stage-frame-runtime.cjs");
  lib.paths = Module._nodeModulePaths(repo);
  lib._compile(result.outputFiles[0].text, lib.filename);
  const inputs = Object.keys(result.metafile.inputs)
    .filter((f) => !f.startsWith("<"))
    .sort();
  const digest = createHash("sha256").update(contents);
  for (const f of inputs) {
    assert(snapshots.has(f), f);
    digest.update(f).update("\0").update(snapshots.get(f)).update("\0");
  }
  return {
    ...lib.exports,
    inputCount: inputs.length,
    sourceHash: digest.digest("hex"),
  };
}

const v = new THREE.Vector3(),
  transform = new THREE.Matrix4(),
  instanceColor = new THREE.Color();
const samples = [0, 0.25, 0.5, 0.75, 1];
function specimenFrame(model, state, subject, scale) {
  model.update(state, subject);
  model.group.updateWorldMatrix(true, true);
  const labels = new Map(),
    geometries = new Map();
  model.labels.forEach((l, i) => {
    if (l.active === false || l.annotationKind === "context") return;
    assert(
      l.position?.length === 3 && l.position.every(Number.isFinite),
      "Active physical label lacks a finite position",
    );
    labels.set(i, {
      word: `${l.text.zh}\u0000${l.text.en}`,
      point: l.position.map((x) => x / scale),
    });
  });
  function sampleObject(object, slot) {
    if (!(object.isMesh || object.isLine || object.isPoints)) return;
    const geometry = object.geometry,
      pos = geometry?.attributes.position;
    if (!pos?.count || (object.isInstancedMesh && !object.count)) return;
    const materials = (
      Array.isArray(object.material) ? object.material : [object.material]
    ).filter((m) => m?.visible && !(m.transparent && m.opacity === 0));
    if (!materials.length) return;
    const available = geometry.index?.count ?? pos.count;
    const start = Math.max(0, geometry.drawRange.start),
      count = Math.min(geometry.drawRange.count, available - start);
    if (count < 1) return;
    const values = [];
    // Sample five rendered indices, including the span ends. For instanced draws
    // also spread the five samples across active instances. Preserve draw ranges.
    for (const fraction of samples) {
      const offset = start + Math.floor((count - 1) * fraction),
        index = geometry.index ? geometry.index.getX(offset) : offset;
      if (object.getVertexPosition) object.getVertexPosition(index, v);
      else v.fromBufferAttribute(pos, index);
      if (object.isInstancedMesh) {
        const i = Math.floor((object.count - 1) * fraction);
        object.getMatrixAt(i, transform);
        v.applyMatrix4(transform);
        if (object.instanceColor) {
          object.getColorAt(i, instanceColor);
          values.push(instanceColor.r, instanceColor.g, instanceColor.b);
        }
      }
      v.applyMatrix4(object.matrixWorld);
      values.push(v.x / scale, v.y / scale, v.z / scale);
    }
    const appearance = [0, 0, 0, 0, 0, 0, 0];
    for (const m of materials) {
      [
        m.opacity ?? 1,
        m.color?.r ?? 0,
        m.color?.g ?? 0,
        m.color?.b ?? 0,
        m.emissive?.r ?? 0,
        m.emissive?.g ?? 0,
        m.emissive?.b ?? 0,
      ].forEach((x, i) => (appearance[i] += x / materials.length));
    }
    values.push(
      ...appearance,
      start / available,
      count / available,
      object.isInstancedMesh ? Math.log1p(object.count) / 10 : 0,
    );
    assert(values.every(Number.isFinite), "Non-finite sampled render feature");
    geometries.set(slot, values);
  }
  // Sibling indices keep hidden branches from renumbering visible samples. A
  // mesh re-created in the same slot is compared by its actual rendered data.
  function visit(object, slot) {
    if (!object.visible) return;
    sampleObject(object, slot);
    object.children.forEach((child, i) => visit(child, slot + "/" + i));
  }
  visit(model.group, "root");
  return { labels, geometries };
}

function separates(a, b) {
  if (a.length !== b.length) return 1;
  let biggest = 0;
  for (let i = 0; i < a.length; i++)
    biggest = Math.max(biggest, Math.abs(a[i] - b[i]));
  return Math.min(1, biggest);
}
function channelDistance(a, b, labels) {
  // Average the four strongest changes so stationary background meshes cannot
  // hide a single moving subject, while one changing marker cannot dominate.
  const strongest = [0, 0, 0, 0];
  function add(value) {
    if (value <= strongest[3]) return;
    let i = 3;
    while (i > 0 && value > strongest[i - 1]) {
      strongest[i] = strongest[i - 1];
      i--;
    }
    strongest[i] = value;
  }
  for (const [id, left] of a) {
    const right = b.get(id);
    if (!right) {
      add(1);
      continue;
    }
    add(
      labels
        ? Math.max(
            left.word === right.word ? 0 : 1,
            separates(left.point, right.point),
          )
        : separates(left, right),
    );
  }
  for (const id of b.keys()) if (!a.has(id)) add(1);
  return strongest.reduce((n, v) => n + v, 0) / 4;
}
function representative(frames) {
  const n = frames.length,
    costs = Array(n).fill(0);
  const max = [0, 0],
    pairs = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const a = channelDistance(frames[i].labels, frames[j].labels, true);
      const g = channelDistance(
        frames[i].geometries,
        frames[j].geometries,
        false,
      );
      pairs.push([i, j, a, g]);
      max[0] = Math.max(max[0], a);
      max[1] = Math.max(max[1], g);
    }
  // A distance under this threshold is numerical noise relative to camera scale.
  const live = max.map((value) => value > 1e-8);
  if (!live.some(Boolean)) return { pct: 50, evidence: "unchanged" };
  for (const [i, j, a, g] of pairs) {
    const d = (live[0] ? (2 * a) / max[0] : 0) + (live[1] ? g / max[1] : 0);
    costs[i] += d;
    costs[j] += d;
  }
  const min = Math.min(...costs);
  const pick = percentages
    .map((pct, i) => ({ pct, cost: costs[i] }))
    .filter((v) => v.cost <= min + 1e-7)
    .sort(
      (a, b) => Math.abs(a.pct - 50) - Math.abs(b.pct - 50) || a.pct - b.pct,
    )[0];
  return {
    pct: pick.pct,
    evidence: live[0] ? (live[1] ? "both" : "labels") : "geometry",
  };
}
function measure(def, root, subject, lib) {
  const model = def.create({ rootId: root });
  const stages = def.stages.map((s) => s.at);
  assert(
    stages[0] === 0 &&
      stages.every(
        (s, i) =>
          Number.isFinite(s) && s >= 0 && s < 1 && (!i || s > stages[i - 1]),
      ),
  );
  const scale = Math.max(
    new THREE.Vector3()
      .fromArray(model.camera.position)
      .distanceTo(new THREE.Vector3().fromArray(model.camera.target)),
    1e-6,
  );
  const entries = [];
  try {
    // The player initializes stateful meshes with its complete chronological plan.
    const warmup = [
      ...new Set([...Array.from({ length: 9 }, (_, i) => i / 8), ...stages]),
    ].sort((a, b) => a - b);
    const variants = [subject];
    for (const overrides of def.framingParameters ?? []) {
      const next = { ...subject, ...overrides };
      if (
        !variants.some((v) =>
          Object.entries(next).every(([k, val]) => v[k] === val),
        )
      )
        variants.push(next);
    }
    for (const params of variants)
      for (const t of warmup) {
        model.update(t, params);
        lib.refreshFramingTransforms(model.group);
      }
    model.update(0, subject);
    for (const [i, start] of stages.entries()) {
      const end = stages[i + 1] ?? 1;
      const times = percentages.map((pct) => span(start, end, pct));
      assert(times.every((t) => t >= start && t < end && t + 1e-5 < end));
      const result = representative(
        times.map((t) => specimenFrame(model, t, subject, scale)),
      );
      assert(percentages.includes(result.pct));
      if (i === stages.length - 1) {
        specimenFrame(model, 1, subject, scale);
        entries.push({
          pct: 100,
          evidence: "endpoint",
          intervalSignal: result.evidence,
        });
      } else entries.push(result);
    }
  } finally {
    lib.disposeScene(model.group, model.materials ?? []);
  }
  return entries;
}

(async () => {
  const lib = await sources();
  const byId = new Map(lib.definitions.map((d) => [d.id, d]));
  const data = { version: 1, unit: "stagePercent", processes: {} };
  const routes = [];
  const bins = {},
    signals = {};
  const valid = Object.entries(lib.processesByRoot).flatMap(([root, ids]) =>
    ids.map((id) => `${id}@${root}`),
  );
  for (const home of [...lib.homeProcesses].sort((a, b) =>
    a.id.localeCompare(b.id, "en"),
  )) {
    const base = byId.get(home.id),
      roots = Object.keys(lib.processesByRoot).filter((root) =>
        lib.processesByRoot[root].includes(home.id),
      );
    assert(roots.includes(home.rootId));
    const rows = {};
    for (const root of [
      home.rootId,
      ...roots.filter((r) => r !== home.rootId),
    ]) {
      const def = { ...base, ...base.contexts?.[root] },
        params = lib.restoreProcessSession(def).parameters;
      const measured = measure(def, root, params, lib),
        pct = measured.map((v) => v.pct);
      for (const item of measured) {
        bins[item.pct] = (bins[item.pct] ?? 0) + 1;
        signals[item.evidence] = (signals[item.evidence] ?? 0) + 1;
      }
      rows[root] = pct;
      routes.push({
        id: home.id,
        root,
        defaultParametersHash: hash(JSON.stringify(params)).slice(0, 12),
        bounds: def.stages.map((s) => s.at),
        stagePercent: pct,
        evidence: measured.map((v) => v.evidence),
        lastIntervalSignal: measured.at(-1).intervalSignal,
      });
      global.gc?.();
    }
    const baseline = rows[home.rootId],
      overrides = Object.fromEntries(
        Object.entries(rows).filter(
          ([r, v]) =>
            r !== home.rootId && JSON.stringify(v) !== JSON.stringify(baseline),
        ),
      );
    data.processes[home.id] = Object.keys(overrides).length
      ? { default: baseline, roots: overrides }
      : { default: baseline };
  }
  assert.deepEqual(
    routes.map((r) => `${r.id}@${r.root}`).sort(),
    [...valid].sort(),
  );
  assert.deepEqual(Object.keys(data.processes).sort(), [...byId.keys()].sort());
  for (const r of routes) {
    const row = data.processes[r.id];
    assert.deepEqual(row.roots?.[r.root] ?? row.default, r.stagePercent);
    assert.equal(r.stagePercent.length, r.bounds.length);
    assert.equal(r.stagePercent.at(-1), 100);
    r.stagePercent.forEach((p, i) => {
      const t = p === 100 ? 1 : span(r.bounds[i], r.bounds[i + 1], p);
      assert(r.bounds.findLastIndex((s) => s <= t + 1e-5) === i);
      if (r.evidence[i] === "unchanged") assert.equal(p, 50);
    });
  }
  const text =
    '{\n  "version": 1,\n  "unit": "stagePercent",\n  "processes": {\n' +
    Object.entries(data.processes)
      .map(
        ([id, row]) => "    " + JSON.stringify(id) + ": " + JSON.stringify(row),
      )
      .join(",\n") +
    "\n  }\n}\n";
  const summary = {
    node: process.version,
    three: THREE.REVISION,
    sourceFiles: lib.inputCount,
    sourceSHA256: lib.sourceHash,
    generatorSHA256: hash(fs.readFileSync(__filename)),
    tableSHA256: hash(text),
    processes: byId.size,
    routes: routes.length,
    stageChecks: routes.reduce((s, r) => s + r.bounds.length, 0),
    candidatePoseChecks: routes.reduce(
      (s, r) => s + r.bounds.length * percentages.length + 1,
      0,
    ),
    overrides: Object.values(data.processes).reduce(
      (n, row) => n + Object.keys(row.roots ?? {}).length,
      0,
    ),
    relativePercentHistogram: bins,
    evidenceHistogram: signals,
  };
  const report = {
    summary,
    candidates: percentages,
    method:
      "Medoid of seven symmetric internal samples. Physical active label-set/text differences and camera-scaled 3D displacement use weight 2. Material-visible, sparse rendered vertex/instance, appearance and draw-span features use weight 1. Channels normalized inside each stage. Equal costs prefer the midpoint. Last stage uses actual t=1. Active visibility is a model property independent of viewport occlusion.",
    routes,
  };
  if (process.argv.includes("--check")) {
    assert.equal(
      fs.readFileSync(tablePath, "utf8"),
      text,
      "Stage moments differ from model geometry",
    );
  } else {
    fs.writeFileSync(tablePath, text);
  }
  const reportFlag = process.argv.indexOf("--report");
  if (reportFlag >= 0)
    fs.writeFileSync(
      process.argv[reportFlag + 1],
      JSON.stringify(report, null, 2) + "\n",
    );
  console.log(JSON.stringify(summary));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
