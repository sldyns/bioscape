import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { build } from "esbuild";
import {
  createCaptureLabelMask,
  layoutCaptureLabels,
} from "../src/scene/sceneCapture.js";

// An explicitly supplied frozen source makes this an independent A/B oracle.
// Normal verification has no dependency on a developer's temporary checkout.
const baselineSource = process.env.BIOSCAPE_CAPTURE_BASELINE;
const repository = dirname(dirname(fileURLToPath(import.meta.url)));

test(
  "pooled capture labels exactly match the supplied frozen baseline",
  { skip: !baselineSource },
  async (t) => {
    const directory = await mkdtemp(
      join(tmpdir(), "bioscape-capture-equivalence-"),
    );
    try {
      const outfile = join(directory, "baseline.mjs");
      await build({
        entryPoints: [baselineSource],
        outfile,
        bundle: true,
        platform: "node",
        format: "esm",
        nodePaths: [join(repository, "node_modules")],
        logLevel: "silent",
      });
      const baseline = await import(pathToFileURL(outfile));
      const scratch = {};
      const measure = (text, size) => [...text].length * size * 0.52;
      let cases = 0;
      for (const [width, height] of [
        [960, 640],
        [96, 64],
        [640, 360],
        [360, 640],
        [256, 256],
        [480, 320],
      ]) {
        for (const scale of [1, 0.5, 2]) {
          for (const phase of [0, 1, 2, -1]) {
            const pixels = new Uint8Array(width * height * 4);
            for (let y = 0; y < height; y++)
              for (let x = 0; x < width; x++) {
                const stripe = (x * 3 + y * 5 + phase * 7) % 29;
                pixels[(y * width + x) * 4 + 3] =
                  phase < 0
                    ? 0
                    : phase === 2 || stripe > 23
                      ? 255
                      : stripe < 2
                        ? 9
                        : stripe === 3
                          ? 8
                          : 0;
              }
            const logicalWidth = width / scale,
              logicalHeight = height / scale;
            const labels = Array.from({ length: 16 }, (_, index) => ({
              text: `${index % 3 ? "Label" : "细胞结构"} ${index}`,
              x: logicalWidth * (index % 2 ? 0.78 : 0.22),
              y:
                logicalHeight *
                (0.1 + ((index * 7 + 17 + phase * 3) % 17) / 22),
              priority: index % 4,
            }));
            const oldMask = baseline.createCaptureLabelMask(
              pixels,
              width,
              height,
              scale,
            );
            const pooledMask = createCaptureLabelMask(
              pixels,
              width,
              height,
              scale,
              scratch,
            );
            for (let index = 0; index < 10; index++) {
              const rectangle = [
                ((index - 1) * logicalWidth) / 8,
                ((index - 1) * logicalHeight) / 8,
                logicalWidth / 4,
                logicalHeight / 3,
              ];
              assert.equal(pooledMask(...rectangle), oldMask(...rectangle));
            }
            assert.deepEqual(
              layoutCaptureLabels(
                labels,
                logicalWidth,
                logicalHeight,
                measure,
                pooledMask,
                scratch,
              ),
              baseline.layoutCaptureLabels(
                labels,
                logicalWidth,
                logicalHeight,
                measure,
                oldMask,
              ),
              `Exact label placement at ${width}x${height}, scale ${scale}, phase ${phase}`,
            );
            cases++;
          }
        }
      }
      assert.equal(cases, 72);
      t.diagnostic(
        `${cases} frozen-baseline mask/layout cases matched exactly`,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
