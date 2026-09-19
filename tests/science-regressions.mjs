// Geometry/sequence regressions added for confirmed scientific audit findings.
// Passing these checks is not a proof of every biological statement.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { extensionEntries } from "../src/processes/extensions.js";

const groups = [
  ...new Set(extensionEntries.map((entry) => entry.module.split("/")[2])),
].sort();
let passed = 0;
for (const group of groups) {
  const file = fileURLToPath(
    new URL(
      `../src/processes/modules/${group}/science.test.mjs`,
      import.meta.url,
    ),
  );
  if (!existsSync(file))
    throw new Error(`Missing scientific regression: ${group}`);
  console.log(`Scientific regression: ${group}`);
  const result = spawnSync(process.execPath, [file], {
    stdio: "inherit",
    timeout: 900_000,
  });
  if (result.status !== 0) {
    if (result.error) console.error(result.error);
    process.exitCode = result.status || 1;
    break;
  }
  passed++;
}
console.log(`Scientific regression groups: ${passed}/${groups.length}`);
