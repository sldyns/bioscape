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
    "tests/home-catalog.mjs",
    "tests/startup-catalog.mjs",
    "tests/home-navigation.mjs",
    "tests/home-search.mjs",
    "tests/exploration-state.mjs",
    "tests/history-session.mjs",
    "tests/exploration-relationships.mjs",
    "tests/scene-capture.mjs",
    "tests/scene-capture-scratch.mjs",
    "tests/structure-label-modes.mjs",
    "tests/structure-render-reuse.mjs",
    "tests/studio.mjs",
    "tests/studio-preview.mjs",
    "tests/comparison.mjs",
    "tests/comparison-capture.mjs",
    "tests/specialized-cells.mjs",
    "tests/erythrocyte-refinement.mjs",
    "tests/neuron-refinement.mjs",
    "tests/muscle-refinement.mjs",
    "tests/process-session.mjs",
    "tests/process-playback.mjs",
    "tests/related-process-entry.mjs",
    "tests/proteasome-polish.mjs",
    "tests/replication-recruitment.mjs",
    "tests/process-continuity-c.mjs",
    "tests/condition-notes.mjs",
    "src/processes/modules/traffic/fusionProfiles.test.mjs",
    "tests/process-label-layout.mjs",
    "tests/render-updates.mjs",
    "tests/framing-distance-cache.mjs",
    "tests/process-annotation-visibility.mjs",
    "tests/process-shared-performance.mjs",
    "tests/prepared-model-cache.mjs",
    "tests/model-transfer-bounds.mjs",
    "tests/model-loading-reuse.mjs",
    "tests/exact-vertex-index.mjs",
    "tests/dynamic-tube-exact.mjs",
    "tests/process-contract.mjs",
    "tests/process-geometry-cache-exact.mjs",
    "tests/process-geometry-cache-b-exact.mjs",
    "tests/secretion-refinement.mjs",
    "tests/secretion-performance-equivalence.mjs",
    "tests/original-secretion-review.mjs",
    "tests/original-secretion-label-review.mjs",
    "tests/regulation-label-review.mjs",
    "tests/original-transcription-labels.mjs",
    "tests/original-photosynthesis-review.mjs",
    "tests/original-infection-review.mjs",
    "src/processes/modules/membrane/process-review.test.mjs",
    "src/processes/modules/translation/review20261004.test.mjs",
    "src/processes/modules/translation/labelAnchors20261004.test.mjs",
    "src/processes/modules/chromatin/plantSmoke.test.mjs",
    "src/processes/modules/operons/science.mutations.test.mjs",
    "src/processes/modules/signals/deformation.test.mjs",
    "src/processes/modules/signals/labelAnchors.test.mjs",
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
