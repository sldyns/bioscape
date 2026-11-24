import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

export async function loadSceneReferences(contents) {
  const temporary = await mkdtemp(join(tmpdir(), "bioscape-reference-"));
  try {
    const outfile = join(temporary, "model.mjs");
    await build({
      stdin: {
        contents,
        resolveDir: fileURLToPath(new URL("../../", import.meta.url)),
      },
      bundle: true,
      platform: "node",
      format: "esm",
      outfile,
      logLevel: "silent",
      plugins: [
        {
          name: "shared-three",
          setup(builder) {
            builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
              path: import.meta.resolve(path),
              external: true,
            }));
          },
        },
      ],
    });
    return await import(pathToFileURL(outfile).href);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
