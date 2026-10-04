import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extensionEntries } from "../src/processes/extensions.js";
import {
  getConditionNote,
  CONDITION_CONTROL_AUDIT,
} from "../src/exploration/conditionNotes.js";

// Detect new unreviewed branches in the actual scene definitions, without
// making the runtime note lookup import scene builders or Three.js.
const project = fileURLToPath(new URL("../", import.meta.url));
const modules = [
  "secretionProcess.js",
  "transcriptionProcess.js",
  "photosynthesisProcess.js",
  "phageProcess.js",
  ...extensionEntries.map((entry) => entry.module),
];
const dir = await mkdtemp(join(tmpdir(), "bioscape-conditions-"));
try {
  const outfile = join(dir, "definitions.mjs");
  await build({
    stdin: {
      contents: `${modules.map((module, i) => `import d${i} from './src/processes/${module}';`).join("\n")} export default [${modules.map((_, i) => `d${i}`).join(",")}].map(d=>({id:d.id,controls:d.controls||[]}));`,
      resolveDir: project,
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  const { default: definitions } = await import(pathToFileURL(outfile));
  const actual = Object.fromEntries(
    definitions.map((d) => [
      d.id,
      Object.fromEntries(
        d.controls.map((c) => [
          c.id,
          { default: c.default, options: c.options.map((o) => o.value) },
        ]),
      ),
    ]),
  );
  assert.equal(definitions.length, 84);
  assert.deepEqual(CONDITION_CONTROL_AUDIT, actual);
  let branches = 0;
  for (const d of definitions) {
    assert.equal(getConditionNote(d.id), null, `${d.id}: defaults`);
    assert.equal(
      getConditionNote(d.id, null),
      null,
      `${d.id}: null parameters`,
    );
    const defaults = Object.fromEntries(
      d.controls.map((c) => [c.id, c.default]),
    );
    for (const c of d.controls) {
      assert.equal(getConditionNote(d.id, { [c.id]: "unknown" }), null);
      for (const option of c.options) {
        branches++;
        const params = Object.freeze({ ...defaults, [c.id]: option.value });
        const before = JSON.stringify(params);
        for (const lang of ["zh", "en"]) {
          const note = getConditionNote(d.id, params, lang);
          const expected =
            option.value !== c.default &&
            !(d.id === "proteasome" && c.id === "shell");
          assert.equal(
            Boolean(note),
            expected,
            `${d.id}/${c.id}/${option.value}/${lang}`,
          );
          if (note) {
            assert.ok(["condition", "reference"].includes(note.kind));
            assert.ok(note.title.length > 3 && note.body.length > 25);
            assert.ok(!/^当前条件$|^Current condition$/.test(note.title));
            if (note.kind === "reference") {
              assert.match(
                note.body,
                lang === "en"
                  ? /Chapters describe the normal mechanism/
                  : /章节保留正常机制/,
              );
            }
          }
        }
        assert.equal(JSON.stringify(params), before, "Lookup must be pure");
      }
    }
  }
  assert.equal(branches, 155);
  assert.equal(getConditionNote("unknown", { atp: "absent" }), null);
  const note = (id, parameters) => getConditionNote(id, parameters, "en");
  assert.match(
    note("replication", { ligase: "absent" }).body,
    /synthesis continue.*nicks/,
  );
  assert.match(
    note("immuneResponse", { epitope: "unmatched" }).body,
    /still loaded and presented/,
  );
  assert.match(
    note("bacterialCellWall", { antibiotic: "betaLactam" }).body,
    /elongation can continue/,
  );
  assert.match(
    note("phageAssembly", { protease: "inactive" }).body,
    /tail assembly can continue/,
  );
  assert.doesNotMatch(
    note("motorTransport", { motor: "dynein", atp: "depleted" }).body,
    /carries the cargo/,
  );
  assert.doesNotMatch(
    note("lacOperon", { lactose: "absent", glucose: "high" }).body,
    /With lactose present/,
  );
  assert.match(
    note("yeastGal", { galactose: "present", glucose: "high" }).body,
    /Mig1/,
  );
  assert.doesNotMatch(
    note("yeastGal", { galactose: "absent", glucose: "high" }).body,
    /Gal80 repression can be relieved/,
  );
  assert.match(
    note("trpOperon", { tryptophan: "high", charging: "limited" }).body,
    /TrpR still represses initiation/,
  );
  assert.doesNotMatch(
    note("yeastOsmoregulation", { osmolarity: "unchanged", hog1: "inhibited" })
      .body,
    /water loss and early Fps1 closure still occur/,
  );
  assert.match(
    note("yeastOsmoregulation", { osmolarity: "high", hog1: "inhibited" }).body,
    /basal glycerol retained/,
  );
  assert.match(
    note("diffusion", { route: "oxygen", gradient: "equal" }).body,
    /Oxygen.*Equal concentrations/,
  );
  assert.match(
    note("diffusion", { route: "water", gradient: "equal" }).body,
    /Equal water activity.*aquaporins/,
  );
  assert.doesNotMatch(
    note("diffusion", { route: "water", gradient: "equal" }).body,
    /concentration/i,
  );
  assert.match(
    getConditionNote("diffusion", { route: "water", gradient: "equal" }, "zh")
      .body,
    /两侧水活度相等/,
  );
  assert.match(
    note("proteasome", { shell: "whole", tag: "untagged" }).body,
    /ubiquitin/,
  );
  const source = await readFile(
    join(project, "src/exploration/conditionNotes.js"),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /^import\s/m,
    "Runtime lookup must remain standalone metadata",
  );
  console.log(
    "Condition notes: 84 definitions, 155 options, bilingual copy and combined controls passed.",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
