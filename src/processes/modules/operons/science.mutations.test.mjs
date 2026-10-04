import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { verifyLac, verifyTrp, verifyHog } from "./science.test.mjs";
import { verifyDuplexClearance } from "./duplexGeometry.test.mjs";
import {
  verifyInducerOrder,
  verifyDNATransitions,
  verifyRNAHandoff,
  verifyLeaderContinuity,
  verifyGlycerolContainment,
} from "./playback.test.mjs";

// Mutations exist only in esbuild memory; never rewrite the product files.
const root = fileURLToPath(new URL("./", import.meta.url));
const cases = [
  [
    "operons-01",
    "lacOperonProcess.js",
    "detailedDNA.update(transcriptionBubbles);",
    "detailedDNA.update(polymerases[0].position.x, polymerases[0].visible ? 1 : 0);",
    verifyLac,
  ],
  [
    "operons-02",
    "trpOperonProcess.js",
    "Severely depleted (charged tRNA limiting)",
    "Low",
    verifyTrp,
  ],
  [
    "operons-03",
    "yeastOsmoregulationProcess.js",
    "ease(p, 0.53, 0.65)",
    "ease(p, 0.32, 0.54)",
    verifyHog,
  ],
  [
    "operons-04",
    "yeastOsmoregulationProcess.js",
    "Nonphosphorylatable",
    "Inhibited",
    verifyHog,
  ],
  [
    "operons-05",
    "yeastOsmoregulationProcess.js",
    "placeHog(nuclearMove);",
    "hog.position.set(.02 + 1.08 * nuclearMove, -.45 + .76 * nuclearMove, .12);",
    verifyHog,
  ],
  [
    "peer-operons-01",
    "structuralDetails.js",
    "y + sign * ry * Math.cos(phase),\n          sign * rz * Math.sin(phase),",
    "y + radius * Math.cos(i*.29+s*Math.PI)*(1-.8*spread)+sign*.32*spread,\n          radius*.72*Math.sin(i*.29+s*Math.PI)*(1-spread),",
    (model) => verifyDuplexClearance(model, [0.7385]),
    "lacOperonProcess.js",
  ],
  [
    "20261004-operons-01",
    "lacOperonProcess.js",
    "ease(p, 0.25, 0.43)",
    "ease(p, 0.17, 0.39)",
    verifyInducerOrder,
  ],
  [
    "20261004-operons-02-dna",
    "lacOperonProcess.js",
    "i < count\n            ? ease(p, start - 0.035, start) * (1 - ease(p, end, end + 0.04))\n            : 0",
    "m.visible ? 1 : 0",
    verifyDNATransitions,
  ],
  [
    "20261004-operons-02-rna",
    "lacOperonProcess.js",
    "transcripts[i].visible,\n          ease(p, 0.87",
    "polymerases[i].visible,\n          ease(p, 0.87",
    verifyRNAHandoff,
  ],
  [
    "20261004-operons-03",
    "trpOperonProcess.js",
    "ease(p, 0.22 + i * 0.095, 0.22 + (i + 1) * 0.095)",
    "ease(p, 0.22 + i * 0.095, 0.34 + i * 0.095)",
    verifyLeaderContinuity,
  ],
  [
    "20261004-operons-04",
    "trpOperonProcess.js",
    "ease(p, 0.17, 0.22) * (stall ? 1 : 1 - ease(p, 0.81, 0.96))",
    "polymerase.visible && p > 0.2 ? 1 : 0",
    verifyDNATransitions,
  ],
  [
    "20261004-operons-05-dna",
    "yeastGalProcess.js",
    "induced ? ease(p, 0.68, 0.72) * (1 - ease(p, 0.96, 1)) : 0",
    "polymerase.visible ? 1 : 0",
    verifyDNATransitions,
  ],
  [
    "20261004-operons-05-rna",
    "yeastGalProcess.js",
    "rna.visible,\n        ease(p, 0.97",
    "polymerase.visible,\n        ease(p, 0.97",
    verifyRNAHandoff,
  ],
  [
    "20261004-operons-06",
    "yeastOsmoregulationProcess.js",
    "g.position.x = (-2.3 + (i % 5) * 0.85) * volume;\n        g.position.y = (-1.25 - Math.floor(i / 5) * 0.3) * volume;",
    "g.position.x = -2.3 + (i % 5) * 0.85;\n        g.position.y = -1.25 - Math.floor(i / 5) * 0.3;",
    verifyGlycerolContainment,
  ],
];
for (const [id, file, before, after, verify, entry] of cases) {
  const path = root + file,
    source = await readFile(path, "utf8");
  assert(source.includes(before), id + " mutation anchor missing");
  const result = await build({
    entryPoints: [entry ? root + entry : path],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    logLevel: "silent",
    plugins: [
      {
        name: "scientific-regression-mutation",
        setup(b) {
          b.onLoad({ filter: /\.js$/ }, (args) =>
            args.path === path
              ? {
                  contents: source.replace(before, after),
                  loader: "js",
                  resolveDir: root,
                }
              : null,
          );
        },
      },
    ],
  });
  const mutant = await import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64")
  );
  let failure = null;
  try {
    verify(mutant.default);
  } catch (e) {
    failure = e;
  }
  assert(failure, id + " old defect escaped regression");
  console.log(id + " old defect rejected: " + failure.message.split("\n")[0]);
}
