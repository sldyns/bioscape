import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  processCacheSnapshot,
  disposeCacheModel,
} from "../../../../tests/helpers/process-cache-snapshot.mjs";

const [source, output] = process.argv.slice(2);
if (!source || !output)
  throw new Error(
    "Usage: node generate-process-cache-b-reference.mjs SOURCE OUTPUT",
  );
const cases = [
  {
    id: "ciliaryMotion",
    file: "src/processes/modules/neurons/ciliaryMotionProcess.js",
    rootId: "paramecium",
    progress: [0, 0.17, 0.27, 0.36, 0.47, 0.58, 0.71, 0.83, 1],
  },
  {
    id: "plasmodesmata",
    file: "src/processes/modules/plantConnections/plasmodesmataProcess.js",
    rootId: "plant",
    progress: [0, 0.16, 0.35, 0.41, 0.5, 0.6, 0.78, 0.93, 1],
  },
  {
    id: "stomata",
    file: "src/processes/modules/plantWater/stomataProcess.js",
    rootId: "plant",
    progress: [0, 0.22, 0.28, 0.49, 0.5, 0.69, 0.73, 0.94, 1],
  },
  {
    id: "osmoticBalance",
    file: "src/processes/modules/membrane/osmoticBalanceProcess.js",
    rootId: "cell",
    progress: [0, 0.15, 0.23, 0.38, 0.5, 0.63, 0.86, 0.9, 1],
  },
];
const rows = [];
for (const entry of cases) {
  const definition = (
    await import(pathToFileURL(path.join(source, entry.file)))
  ).default;
  const model = definition.create({ rootId: entry.rootId });
  const control = definition.controls[0];
  const values = control.options.map((option) => option.value);
  const progress = [
    ...new Set(
      entry.progress.flatMap((p) => [
        Math.max(0, p - 1e-7),
        p,
        Math.min(1, p + 1e-7),
      ]),
    ),
    0.813579,
    0.173847,
    1,
    0,
    0.629193,
    0.1603687500000001,
  ];
  const poses = [];
  const parameters = {};
  try {
    // Mutating the same parameter object at a fixed progress tests invalidation.
    for (const p of progress)
      for (const value of values) {
        parameters[control.id] = value;
        model.update(p, parameters);
        poses.push({
          progress: p,
          parameters: { ...parameters },
          expected: processCacheSnapshot(model),
        });
      }
    // Playback within each branch exercises its long unchanged-shape plateaus.
    for (const value of values)
      for (const p of [0, 0.08, 0.2, 0.32, 0.5, 0.68, 0.8, 0.96, 1, 0.6, 0.1]) {
        parameters[control.id] = value;
        model.update(p, parameters);
        poses.push({
          progress: p,
          parameters: { ...parameters },
          expected: processCacheSnapshot(model),
        });
      }
    rows.push({ ...entry, progress: undefined, poses });
  } finally {
    disposeCacheModel(model);
  }
  console.log(`${entry.id}: ${poses.length} frozen reference poses`);
}
await fs.writeFile(
  output,
  JSON.stringify(
    {
      sourceCommit: "ae697be",
      description:
        "Complete geometry/index/normal/instance bytes, all transforms including hidden nodes, material state, bounds, labels and userData. Frozen reference; no visual tolerances.",
      rows,
    },
    null,
    2,
  ) + "\n",
);
