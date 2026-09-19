import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const dir = await mkdtemp(join(tmpdir(), "cell-atlas-check-"));
try {
  const outfile = join(dir, "models.mjs");
  await build({
    entryPoints: ["tests/models.mjs"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const result = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
  for (const test of [
    "tests/asset-url.mjs",
    "tests/process-label-layout.mjs",
    "tests/render-updates.mjs",
    "tests/exact-vertex-index.mjs",
    "tests/process-contract.mjs",
    "tests/secretion-refinement.mjs",
    "tests/process-bounds.mjs",
    "tests/science-regressions.mjs",
  ]) {
    if (process.exitCode !== 0) break;
    const result = spawnSync(process.execPath, [test], { stdio: "inherit" });
    process.exitCode = result.status ?? 1;
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
