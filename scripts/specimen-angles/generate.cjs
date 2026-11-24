const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createRequire } = require("node:module");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");

const here = __dirname;
const { values: options } = require("node:util").parseArgs({
  options: {
    out: { type: "string" },
    width: { type: "string" },
    ids: { type: "string" },
    resume: { type: "boolean" },
    review: { type: "string" },
    repo: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});
if (options.help) {
  console.log(
    "node scripts/specimen-angles/generate.cjs --out DIR [--repo DIR] [--ids a,b] [--width 576] [--resume]\n" +
      "Use --review MAP.json for a native-size four-view contact sheet. Use --ids to choose specimens.\n" +
      "PLAYWRIGHT_MODULE may point to an installed Playwright package. CHROME_BIN may point to an installed browser.",
  );
  process.exit(0);
}
function locateRepo() {
  for (const start of [
    options.repo,
    process.env.BIOSCAPE_REPO,
    process.cwd(),
    here,
  ].filter(Boolean)) {
    let dir = path.resolve(start);
    while (
      !fs.existsSync(path.join(dir, "src", "hierarchy.js")) ||
      !fs.existsSync(path.join(dir, "package.json"))
    ) {
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    if (fs.existsSync(path.join(dir, "src", "hierarchy.js"))) return dir;
  }
  throw Error("Pass --repo with a local BioScape checkout.");
}
const repo = locateRepo();
const req = createRequire(path.join(repo, "package.json"));
const { build } = req("esbuild");
function localChromium() {
  const modules = process.env.PLAYWRIGHT_MODULE
    ? [process.env.PLAYWRIGHT_MODULE]
    : ["playwright", "playwright-core", "@playwright/test"];
  for (const name of modules) {
    let resolved;
    try {
      resolved = req.resolve(name);
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      continue;
    }
    const chromium = req(resolved).chromium;
    if (chromium) return chromium;
  }
  throw Error(
    "Set PLAYWRIGHT_MODULE to an installed Playwright package, or install Playwright locally.",
  );
}
const chromium = localChromium();
const out = path.resolve(
  options.out || path.join(os.tmpdir(), "bioscape-specimen-angles"),
);
const scoreWidth = Number(options.width || 576);
const put = (file, content) => {
  const destination = path.join(out, file);
  fs.writeFileSync(destination + ".new", content);
  fs.renameSync(destination + ".new", destination);
};
const hash = (value) => createHash("sha256").update(value).digest("hex");

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const artifacts = await build({
    stdin: {
      contents: fs.readFileSync(path.join(here, "projection.js"), "utf8"),
      resolveDir: repo,
      sourcefile: "atlas-angle-projection.js",
    },
    absWorkingDir: repo,
    platform: "browser",
    bundle: true,
    format: "iife",
    target: "chrome130",
    minify: true,
    write: false,
    logLevel: "silent",
    metafile: true,
  });
  // Bundled local sources include the complete model/geometry data. No network,
  // build products in the checkout, dev server, or production navigation is used.
  const bundled = artifacts.outputFiles[0].text;
  const relevant = Object.keys(artifacts.metafile.inputs)
    .filter((f) => f.startsWith("src/"))
    .sort();
  const inputs = Object.fromEntries(
    relevant.map((f) => [f, hash(fs.readFileSync(path.join(repo, f)))]),
  );
  const inputHash = hash(relevant.map((f) => f + " " + inputs[f]).join("\n"));
  const sourceKey = hash(
    [
      inputHash,
      hash(fs.readFileSync(path.join(here, "projection.js"))),
      scoreWidth,
    ].join("/"),
  );
  put(
    "source-inputs.json",
    JSON.stringify(
      { productionInputHash: inputHash, bundleHash: hash(bundled), inputs },
      null,
      2,
    ) + "\n",
  );
  const head = fs.existsSync(path.join(repo, ".git"))
    ? execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim()
    : null;
  const executable = process.env.CHROME_BIN
    ? { executablePath: process.env.CHROME_BIN }
    : fs.existsSync(chromium.executablePath())
      ? {}
      : { channel: "chrome" };
  const browser = await chromium.launch({
    ...executable,
    headless: true,
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-sync",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1152, height: 720 },
      deviceScaleFactor: 1,
    });
    await page.route("**/*", (r) => r.abort());
    const browserErrors = [];
    page.on("pageerror", (e) => browserErrors.push(String(e).slice(0, 320)));
    page.on("console", (m) => {
      if (m.type() === "error") browserErrors.push(m.text().slice(0, 320));
    });
    await page.setContent(
      "<!doctype html><meta charset=utf-8><title>Offline specimen angle measurements</title>",
    );
    await page.addScriptTag({ content: bundled });
    const manifest = await page.evaluate(
      (w) => window.angleAtlas.init(w),
      scoreWidth,
    );
    const ids = options.ids
      ? String(options.ids).split(",")
      : options.review
        ? [
            "cell",
            "erythrocyte",
            "neuron",
            "muscleFibre",
            "cristae",
            "atpSynthase",
            "nucleosome",
            "bilayer",
            "chloroplast",
            "actin",
          ]
        : manifest.ids;
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !manifest.ids.includes(id))
    )
      throw Error("Unexpected model identifier.");
    if (options.review) {
      const mapping = JSON.parse(fs.readFileSync(path.resolve(options.review)));
      const receipts = [];
      for (const id of ids) {
        if (!mapping[id]) throw Error("Missing review angle " + id);
        const size = await page.evaluate(
          ([key, fourth]) => window.angleAtlas.review(key, fourth),
          [id, mapping[id]],
        );
        if (size.join(",") !== "1152,720")
          throw Error("Review dimension mismatch.");
        const filename = id + ".png";
        await page
          .locator("#proof")
          .screenshot({ path: path.join(out, filename) });
        receipts.push({
          id,
          delta: mapping[id],
          pixels: size,
          filename,
          sha256: hash(fs.readFileSync(path.join(out, filename))),
        });
        if (browserErrors.length)
          throw Error(id + " " + browserErrors.slice(0, 2).join(" "));
      }
      await page.evaluate(() => window.angleAtlas.finish());
      put(
        "review.json",
        JSON.stringify(
          {
            productionInputHash: inputHash,
            order: ["front", "quarter turn", "back", "chosen oblique"],
            tilePixels: [576, 360],
            receipts,
          },
          null,
          2,
        ) + "\n",
      );
      console.log("Native four-view proofs", receipts.length);
      return;
    }
    let rows = [],
      done = new Set();
    const priorFile = path.join(out, "checkpoint.json");
    if (options.resume && fs.existsSync(priorFile)) {
      const prior = JSON.parse(fs.readFileSync(priorFile));
      if (
        prior.sourceKey !== sourceKey ||
        JSON.stringify(prior.ids) !== JSON.stringify(ids)
      )
        throw Error("Checkpoint built from another source or catalog.");
      rows = prior.rows;
      done = new Set(rows.map((r) => r.id));
    }
    for (const id of ids) {
      if (done.has(id)) continue;
      const row = await page.evaluate(
        (key) => window.angleAtlas.analyze(key),
        id,
      );
      if (browserErrors.length)
        throw Error(id + " " + browserErrors.slice(0, 2).join(" "));
      rows.push(row);
      if (rows.length % 10 === 0 || rows.length === ids.length) {
        put("checkpoint.json", JSON.stringify({ sourceKey, ids, rows }) + "\n");
        console.log("Measured", rows.length, "/", ids.length);
      }
    }
    await page.evaluate(() => window.angleAtlas.finish());
    const pairs = new Map();
    for (const r of rows) {
      const key = r.delta.join(",");
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    const numeric = (a, b) => a - b;
    const range = (vals) => [Math.min(...vals), Math.max(...vals)];
    const sort = (vals) => [...vals].sort(numeric);
    const median = (vals) => {
      const a = sort(vals);
      return (
        (a[Math.floor((a.length - 1) / 2)] + a[Math.floor(a.length / 2)]) / 2
      );
    };
    const report = {
      head,
      productionInputHash: inputHash,
      sourceKey,
      buildSourceFiles: relevant.length,
      viewport: manifest.size,
      browser: browser.version(),
      renderer: manifest.device,
      checked: rows.length,
      expected: ids.length,
      uniqueIds: new Set(rows.map((r) => r.id)).size,
      choices: manifest.choices.length,
      chosenVariants: pairs.size,
      yawPitchCounts: Object.fromEntries([...pairs].sort()),
      above: rows.filter((r) => r.delta[1] > 0).length,
      below: rows.filter((r) => r.delta[1] < 0).length,
      absolutePitch: range(rows.map((r) => r.pitch)),
      separationDegrees: range(rows.map((r) => r.metrics.angle)),
      meshCount: rows.reduce((s, r) => s + r.visibleMeshes, 0),
      labelledPresentations: rows.filter((r) => r.anchors).length,
      anchors: rows.reduce((s, r) => s + r.anchors, 0),
      mixedTransparency: rows.filter((r) => r.alpha).length,
      nonblank: rows.filter((r) => r.minFramePixels > 0).length,
      frameCount: rows.length * (manifest.choices.length + 4),
      maxTouchedBorderSamples: Math.max(...rows.map((r) => r.maxEdgeSamples)),
      medianNewVisibleWeight: median(rows.map((r) => r.metrics.newSurface)),
      winnerAboveLegacy: rows.filter((r) => r.score > r.oldScore).length,
      belowLegacy: rows.filter((r) => r.score <= r.oldScore).map((r) => r.id),
      medianScoreVsLegacy: median(rows.map((r) => r.score - r.oldScore)),
      smallestWinningMargin: Math.min(...rows.map((r) => r.margin)),
      middleWinningMargin: median(rows.map((r) => r.margin)),
      errors: browserErrors,
    };
    put(
      "angles.json",
      "{\n" +
        rows
          .map(
            (r) => "  " + JSON.stringify(r.id) + ": " + JSON.stringify(r.delta),
          )
          .join(",\n") +
        "\n}\n",
    );
    put("report.json", JSON.stringify(report, null, 2) + "\n");
    put("rankings.json", JSON.stringify(rows) + "\n");
    // The final rankings contain the checkpoint's evidence once every ID is present.
    fs.unlinkSync(priorFile);
    console.log(
      JSON.stringify({
        checked: report.checked,
        variants: report.chosenVariants,
        nonblank: report.nonblank,
        aboveLegacy: report.winnerAboveLegacy,
        input: inputHash.slice(0, 12),
        out,
      }),
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(String(e).slice(0, 1000));
  process.exitCode = 1;
});
