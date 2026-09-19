import fs from "node:fs";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { fileURLToPath } from "node:url";
import { extensionEntries } from "../src/processes/extensions.js";
const root = fileURLToPath(new URL("../", import.meta.url)),
  issues = [],
  summary = [];
const counts = {
  processes: extensionEntries.length,
  rootCases: 0,
  controlCombinations: 0,
  progressChecks: 0,
};
const perRoot = {};
const error = (id, s) => issues.push(`${id}: ${s}`);
function snap(model) {
  const h = createHash("sha256");
  model.group.traverse((o) => {
    h.update(
      JSON.stringify([
        o.visible,
        o.position.toArray(),
        o.quaternion.toArray(),
        o.scale.toArray(),
        o.material?.opacity,
        o.material?.color?.getHex(),
      ]),
    );
    if (o.geometry)
      for (const a of Object.values(o.geometry.attributes))
        h.update(
          Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength),
        );
    if (o.instanceMatrix) h.update(Buffer.from(o.instanceMatrix.array.buffer));
  });
  return h.digest("hex");
}
const seen = new Set();
for (const e of extensionEntries) {
  try {
    if (seen.has(e.id)) error(e.id, "duplicate id");
    seen.add(e.id);
    if (!fs.existsSync(root + "/public" + e.thumbnail))
      error(e.id, "thumbnail missing");
    if (
      e.roots.some(
        (r) =>
          ![
            "cell",
            "plant",
            "yeast",
            "bacterium",
            "paramecium",
            "phage",
          ].includes(r),
      )
    )
      error(e.id, "unknown root");
    const d = (
      await import(new URL("../src/processes/" + e.module, import.meta.url))
    ).default;
    const svg = fs.readFileSync(root + "public" + e.thumbnail, "utf8");
    if (
      !/viewBox=["']0 0 320 320["']/.test(svg) ||
      /<(?:script|image|text)\b/i.test(svg)
    )
      error(e.id, "SVG thumbnail contract mismatch");
    if (d.duration < 24 || d.duration > 40)
      error(e.id, "duration outside 24–40 seconds");
    if (
      d.stages.length < 4 ||
      d.stages.length > 7 ||
      d.stages.some(
        (stage, i) =>
          !Number.isFinite(stage.at) ||
          (i > 0 && stage.at <= d.stages[i - 1].at),
      )
    )
      error(e.id, "stage count/order malformed");
    if (e.id !== d.id) error(e.id, "id mismatch");
    if (
      !d.sources?.length ||
      d.sources.some((s) => !s.title || !s.url.startsWith("https://"))
    )
      error(e.id, "sources malformed");
    if (d.stages[0].at !== 0 || d.stages.at(-1).at >= 1)
      error(e.id, "stage boundaries malformed");
    for (const r of e.roots) {
      counts.rootCases++;
      perRoot[r] = (perRoot[r] ?? 0) + 1;
      const def = { ...d, ...d.contexts?.[r] };
      for (const field of ["intro", "title"])
        if (!def[field]?.zh || !def[field]?.en)
          error(e.id, `${r} ${field} missing bilingual`);
      for (const s of def.stages)
        for (const field of ["title", "description"])
          if (!s[field]?.zh || !s[field]?.en)
            error(e.id, `${r} stage ${field} missing bilingual`);
      if (def.legend?.some((l) => !l.text?.en || !l.text?.zh))
        error(e.id, `${r} legend.text absent`);
      const params = Object.fromEntries(
        (def.controls ?? []).map((c) => [c.id, c.default]),
      );
      for (const c of def.controls ?? []) {
        if (!c.options.some((o) => o.value === c.default))
          error(e.id, `${r} control ${c.id} default absent`);
        if (
          !c.label.en ||
          !c.label.zh ||
          c.options.some((o) => !o.label.zh || !o.label.en)
        )
          error(e.id, `${r} control missing bilingual`);
      }
      const m = def.create({ rootId: r });
      const nodeIDs = new Set(),
        geoIDs = new Set(),
        matIDs = new Set();
      m.group.traverse((o) => {
        nodeIDs.add(o.uuid);
        if (o.geometry) geoIDs.add(o.geometry.uuid);
        for (const mat of Array.isArray(o.material)
          ? o.material
          : o.material
            ? [o.material]
            : [])
          matIDs.add(mat.uuid);
      });
      const scenarios = (def.controls ?? []).reduce(
        (acc, c) =>
          acc.flatMap((pr) =>
            c.options.map((o) => ({ ...pr, [c.id]: o.value })),
          ),
        [params],
      );
      counts.controlCombinations += scenarios.length;
      // Prebuilt materials can be swapped in after creation. Learn their identities
      // once, then require subsequent seeks to reuse the same resources.
      for (const pr of scenarios)
        for (const p of [0, 0.2, 0.5, 0.75, 1]) {
          m.update(p, pr);
          m.group.traverse((o) => {
            for (const mat of Array.isArray(o.material)
              ? o.material
              : o.material
                ? [o.material]
                : [])
              matIDs.add(mat.uuid);
          });
        }
      if (![...m.camera.position, ...m.camera.target].every(Number.isFinite))
        error(e.id, "camera nonfinite");
      for (const pr of scenarios)
        for (const p of [0, 0.2, 0.5, 0.75, 1, NaN, -1, 2]) {
          counts.progressChecks++;
          m.update(p, pr);
          m.group.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(m.group, true),
            v = box.getSize(new THREE.Vector3()).toArray();
          if (![...box.min, ...box.max, ...v].every(Number.isFinite))
            error(e.id, `${r} ${p} ${JSON.stringify(pr)} nonfinite bounds`);
          if (Math.max(...v) > 20 || Math.max(...v) < 2)
            error(e.id, `${r} ${p} extent ${Math.max(...v)}`);
          m.group.traverse((o) => {
            if (!nodeIDs.has(o.uuid)) error(e.id, "node allocation");
            if (o.geometry && !geoIDs.has(o.geometry.uuid))
              error(e.id, "geometry allocation");
            if (o.geometry)
              for (const a of Object.values(o.geometry.attributes))
                if (!a.array.every(Number.isFinite))
                  error(e.id, "nonfinite geometry attribute");
            if (
              ![...o.position, ...o.quaternion, ...o.scale].every(
                Number.isFinite,
              )
            )
              error(e.id, `${r} ${p} nonfinite transforms`);
            for (const mat of Array.isArray(o.material)
              ? o.material
              : o.material
                ? [o.material]
                : [])
              if (!matIDs.has(mat.uuid)) error(e.id, "material allocation");
          });
          for (const l of m.labels ?? []) {
            if (!l.text?.zh || !l.text?.en)
              error(e.id, `${r} label text absent`);
            if (
              !Array.isArray(l.position) ||
              l.position.length !== 3 ||
              !l.position.every(Number.isFinite)
            )
              error(e.id, `${r} ${p} label position malformed`);
          }
        }
      for (const pr of scenarios) {
        m.update(0.7, pr);
        const a = snap(m);
        m.update(0.2, pr);
        m.update(0.7, pr);
        if (snap(m) !== a)
          error(
            e.id,
            `${r} ${JSON.stringify(pr)} repeat seek nondeterministic`,
          );
      }
      m.update(0.6, params);
      const b = snap(m);
      m.update(0.6);
      if (snap(m) !== b)
        error(e.id, `${r} missing parameters differs from declared default`);
      m.update(0.6, {});
      if (snap(m) !== b)
        error(e.id, `${r} empty parameters differs from declared default`);
      const disposable = new Set((m.materials ?? []).map((mat) => mat.uuid));
      m.group.traverse((o) => {
        for (const mat of Array.isArray(o.material)
          ? o.material
          : o.material
            ? [o.material]
            : [])
          disposable.add(mat.uuid);
      });
      for (const id of matIDs)
        if (!disposable.has(id))
          error(
            e.id,
            `${r} previously-used material absent from current tree and materials list`,
          );
      m.group.traverse((o) => o.geometry?.dispose());
    }
    summary.push(`${e.id} [${e.roots.join(",")}]`);
  } catch (err) {
    error(e.id, err.stack);
  }
}
const failures = [...new Set(issues)];
console.log(JSON.stringify({ ...counts, perRoot, issues: failures }, null, 2));
if (failures.length) process.exitCode = 1;
