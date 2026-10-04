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
    "Usage: node generate-process-cache-reference.mjs SOURCE OUTPUT",
  );
const cases = [
  {
    id: "bacterialDivision",
    file: "src/processes/modules/bacterialCore/bacterialDivisionProcess.js",
    roots: ["bacterium"],
    parameter: "septalSynthesis",
    values: ["active", "blocked"],
    progress: [
      0, 0.03, 0.05, 0.17, 0.43, 0.46, 0.52, 0.605, 0.65, 0.68, 0.76, 0.83,
      0.89, 0.9, 0.905, 0.95, 1,
    ],
  },
  {
    id: "chromatinAccess",
    file: "src/processes/modules/chromatin/chromatinAccessProcess.js",
    roots: ["cell", "plant", "yeast"],
    parameter: "hydrolysis",
    values: ["active", "disabled"],
    progress: [
      0, 0.12, 0.17, 0.3, 0.33, 0.34, 0.5, 0.64, 0.76, 0.77, 0.84, 0.91, 0.97,
      1,
    ],
  },
  {
    id: "tad",
    file: "src/processes/modules/chromatin/tadProcess.js",
    roots: ["cell"],
    parameter: "condition",
    values: ["normal", "boundaryDeleted", "cohesinDepleted"],
    progress: [
      0, 0.02, 0.15, 0.16, 0.17, 0.36, 0.6, 0.62, 0.68, 0.72, 0.78, 0.93, 1,
    ],
  },
  {
    id: "dnaRepair",
    file: "src/processes/modules/genome/dnaRepairProcess.js",
    roots: ["cell", "plant", "yeast"],
    parameter: "incision",
    values: ["active", "blocked"],
    progress: [
      0, 0.13, 0.15, 0.31, 0.34, 0.4, 0.43, 0.48, 0.54, 0.63, 0.64, 0.8, 0.87,
      0.88, 0.89, 0.97, 1,
    ],
  },
];
const rows = [];
for (const entry of cases) {
  const definition = (
    await import(pathToFileURL(path.join(source, entry.file)))
  ).default;
  for (const rootId of entry.roots) {
    const model = definition.create({ rootId });
    const parameters = {};
    const poses = [];
    // Both sides of every boundary, plus reversed and irregular seeks.
    const progress = [
      ...new Set(
        entry.progress.flatMap((p) => [
          Math.max(0, p - 1e-7),
          p,
          Math.min(1, p + 1e-7),
        ]),
      ),
    ];
    progress.push(0.605, 1, 0, 0.1603687500000001, 0.97831, 0.34, 0.03);
    for (const p of progress)
      for (const value of entry.values) {
        parameters[entry.parameter] = value;
        model.update(p, parameters);
        poses.push({
          progress: p,
          parameters: { ...parameters },
          expected: processCacheSnapshot(model),
        });
      }
    rows.push({ id: entry.id, file: entry.file, rootId, poses });
    disposeCacheModel(model);
    console.log(`${entry.id}/${rootId}: ${poses.length} reference poses`);
  }
}
await fs.writeFile(
  output,
  JSON.stringify(
    {
      sourceCommit: "ae697be",
      description:
        "Exact geometry/index/normal/instance bytes, transforms including hidden nodes, material state, labels and userData from the frozen pre-optimization source. No tolerances or omitted invisible buffers.",
      rows,
    },
    null,
    2,
  ) + "\n",
);
