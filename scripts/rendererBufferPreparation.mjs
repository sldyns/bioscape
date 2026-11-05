import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
export function bufferPreparationHook() {
  return {
    name: "bioscape-buffer-preparation",
    apply: "build",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith("/three/build/three.module.js"))
        return null;
      if (createHash("sha256").update(code).digest("hex") !== EXPECTED)
        throw Error("Unrecognized Three renderer source");
      const start = code.indexOf("class WebGLRenderer {"),
        anchor = "\t\tthis.dispose = function () {",
        at = code.indexOf(anchor, start);
      if (start < 0 || at < 0)
        throw Error("Renderer insertion boundary missing");
      let result = code.slice(0, at) + HOOK + "\n" + code.slice(at);
      const dispose = "\t\t\tobjects.dispose();";
      if (result.split(dispose).length !== 2)
        throw Error("Renderer disposal boundary ambiguous");
      result = result.replace(
        dispose,
        "\t\t\tbioscapePreparationDisposed = true;\n\t\t\tcanvas.removeEventListener( 'webglcontextlost', bioscapeResetStaging, false );\n\t\t\tif (bioscapeStagingVAO !== null) _gl.deleteVertexArray(bioscapeStagingVAO);\n\t\t\tbioscapeStagingVAO = null;\n" +
          dispose,
      );
      return { code: result, map: null };
    },
  };
}
const EXPECTED =
  "c8211c69345d2e9949dc7a8ac969380497aa0600a5a8ac6a459c8cd02dd9cb8a";
const HOOK = readFileSync(
  new URL("./renderer-hook.txt", import.meta.url),
  "utf8",
);
