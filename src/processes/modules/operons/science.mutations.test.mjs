import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { verifyLac, verifyTrp, verifyHog } from "./science.test.mjs";
import { verifyDuplexClearance } from "./duplexGeometry.test.mjs";

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
