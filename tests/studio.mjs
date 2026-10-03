import assert from "node:assert/strict";
import { test } from "node:test";

import * as config from "../src/studio/config.js";
import * as video from "../src/studio/recordVideo.js";
import * as composition from "../src/studio/composition.js";

test("reselecting a Studio option preserves the existing export session", () => {
  const current = config.normalizePreferences({ background: "transparent" });
  for (const [key, value] of Object.entries(current))
    assert.equal(
      config.changePreference(current, key, value, {}, "image"),
      current,
    );
  // Video displays light for a transparent image preference. Clicking the
  // visibly selected light choice must neither discard the movie nor overwrite
  // the image's transparent preference.
  assert.equal(
    config.changePreference(current, "background", "light", {}, "video"),
    current,
  );
  const changed = config.changePreference(
    current,
    "composition",
    "portrait",
    {},
    "video",
  );
  assert.notEqual(changed, current);
  assert.equal(changed.composition, "portrait");
  assert.equal(changed.background, "transparent");
});

test("corrupt or stale preferences cannot produce invalid exports", () => {
  assert.ok(config);
  const value = config.normalizePreferences(
    {
      composition: "unknown",
      resolution: Infinity,
      duration: -1,
      background: "javascript:bad",
      labels: "false",
      title: false,
      attribution: false,
      motion: "explode",
    },
    { kind: "process" },
  );
  assert.equal(value.composition, "landscape");
  assert.equal(value.resolution, 1920);
  assert.equal(value.duration, 10);
  assert.equal(value.background, "light");
  assert.equal(value.labels, true);
  assert.equal(value.title, false);
  assert.equal(Object.hasOwn(value, "attribution"), false);
  assert.equal(value.motion, "process");
  assert.doesNotThrow(() =>
    config.loadPreferences(
      {
        getItem() {
          throw Error("denied");
        },
      },
      {},
    ),
  );
  assert.doesNotThrow(() =>
    config.savePreferences(
      {
        setItem() {
          throw Error("quota");
        },
      },
      value,
    ),
  );
});

test("compositions produce high resolution even pixel dimensions", () => {
  assert.ok(config);
  for (const [composition, resolution, expected] of [
    ["landscape", 1920, { width: 1920, height: 1080 }],
    ["portrait", 1920, { width: 1080, height: 1920 }],
    ["square", 2560, { width: 2560, height: 2560 }],
    ["portrait", 2560, { width: 1440, height: 2560 }],
  ])
    assert.deepEqual(
      config.outputDimensions({ composition, resolution }),
      expected,
    );
});

test("export typography stays readable and outside the model region", () => {
  assert.ok(config);
  const layout = config.compositionLayout({
    composition: "portrait",
    resolution: 1920,
    title: true,
    attribution: true,
  });
  assert.ok(layout.titleSize >= 42);
  assert.ok(layout.footerSize >= 24);
  assert.ok(layout.model.y > layout.titleY + layout.titleSize);
  assert.ok(layout.model.y + layout.model.height < layout.footerY);
  assert.ok(layout.model.width > 900 && layout.model.height > 1450);
});

test("process and disassembly movies reach their intended endpoints", () => {
  assert.ok(config);
  assert.deepEqual(config.motionFrame("process", 0), { progress: 0 });
  assert.deepEqual(config.motionFrame("process", 1), { progress: 1 });
  assert.equal(config.motionFrame("explode", 0).separation, 0);
  assert.equal(config.motionFrame("explode", 1).separation, 0);
  assert.equal(config.motionFrame("explode", 0.5).separation, 1);
  assert.equal(config.motionFrame("turn", 1).turn, Math.PI * 2);
});

function recordingFixture() {
  let time = 0,
    nextId = 0,
    stopped = 0;
  const jobs = new Map(),
    frames = [],
    progress = [];
  const track = {
    stop() {
      stopped++;
    },
    requestFrame() {},
  };
  class Recorder {
    static isTypeSupported(type) {
      return type.startsWith("video/webm");
    }
    constructor(stream, options) {
      this.state = "inactive";
      this.mimeType = options.mimeType;
      this.stream = stream;
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      queueMicrotask(() => {
        this.ondataavailable?.({
          data: new Blob(["recorded-frame"], { type: this.mimeType }),
        });
        this.onstop?.();
      });
    }
  }
  const runtime = {
    MediaRecorder: Recorder,
    now: () => time,
    requestAnimationFrame(fn) {
      const id = ++nextId;
      jobs.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) {
      jobs.delete(id);
    },
    setTimeout(fn) {
      const id = ++nextId;
      jobs.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      jobs.delete(id);
    },
  };
  const canvas = {
    captureStream() {
      return { getTracks: () => [track], getVideoTracks: () => [track] };
    },
  };
  return {
    runtime,
    canvas,
    frames,
    progress,
    stopped: () => stopped,
    jobs,
    tick(value) {
      time = value;
      const pending = [...jobs.values()];
      jobs.clear();
      pending.forEach((fn) => fn(time));
    },
    options: {
      canvas,
      runtime,
      duration: 6,
      drawFrame: (p) => frames.push(p),
      onProgress: (p) => progress.push(p),
    },
  };
}

test("recorder delivers the final frame and a correctly named playable format", async () => {
  assert.ok(video);
  const f = recordingFixture();
  assert.equal(
    video.preferredVideoFormat(f.runtime.MediaRecorder).extension,
    "webm",
  );
  const done = video.recordVideo(f.options);
  f.tick(3000);
  f.tick(6000);
  f.tick(6160);
  const result = await done;
  assert.equal(result.extension, "webm");
  assert.ok(result.blob.size > 0);
  assert.equal(f.frames[0], 0);
  assert.equal(f.frames.at(-1), 1);
  assert.equal(f.progress.at(-1), 1);
  assert.equal(f.stopped(), 1);
  assert.equal(f.jobs.size, 0);
});

test("cancellation stops the stream and rejects without returning a partial video", async () => {
  assert.ok(video);
  const f = recordingFixture(),
    controller = new AbortController();
  const done = video.recordVideo({ ...f.options, signal: controller.signal });
  const rejected = assert.rejects(done, { name: "AbortError" });
  controller.abort();
  await rejected;
  assert.equal(f.stopped(), 1);
  assert.equal(f.jobs.size, 0);
});

test("60 Hz display does not render duplicate 30 fps recording frames", async () => {
  const f = recordingFixture();
  const done = video.recordVideo(f.options);
  for (let frame = 1; frame <= 360; frame++) f.tick((frame * 1000) / 60);
  f.tick(6160);
  await done;
  assert.equal(f.frames[0], 0);
  assert.equal(f.frames.at(-1), 1);
  assert.ok(f.frames.length >= 179 && f.frames.length <= 182);
  assert.equal(f.jobs.size, 0);
});

test("an encoder that stops early must not deliver an incomplete video", async () => {
  const f = recordingFixture();
  const ParentRecorder = f.runtime.MediaRecorder;
  let activeRecorder;
  f.runtime.MediaRecorder = class extends ParentRecorder {
    constructor(...args) {
      super(...args);
      activeRecorder = this;
    }
  };
  const done = video.recordVideo(f.options);
  const rejected = assert.rejects(done, /VIDEO_INTERRUPTED/);
  f.tick(1000);
  activeRecorder.stop();
  await rejected;
  assert.equal(f.stopped(), 1);
  assert.equal(f.jobs.size, 0);
});

test("an encoder that rejects the requested settings releases the stream", async () => {
  const f = recordingFixture();
  const ParentRecorder = f.runtime.MediaRecorder;
  f.runtime.MediaRecorder = class extends ParentRecorder {
    start() {
      throw new Error("Unsupported encoder settings");
    }
  };
  await assert.rejects(
    video.recordVideo(f.options),
    /Unsupported encoder settings/,
  );
  assert.equal(f.stopped(), 1);
  assert.equal(f.jobs.size, 0);
});

test("a renderer failure releases the camera stream and scheduled frames", async () => {
  assert.ok(video);
  const f = recordingFixture();
  const done = video.recordVideo({
    ...f.options,
    drawFrame: (p) => {
      if (p > 0) throw Error("Context lost");
    },
  });
  const rejected = assert.rejects(done, /Context lost/);
  f.tick(1000);
  await rejected;
  assert.equal(f.stopped(), 1);
  assert.equal(f.jobs.size, 0);
});

test("MP4 is preferred only when the browser can actually encode it", () => {
  assert.ok(video);
  assert.equal(
    video.preferredVideoFormat({ isTypeSupported: () => true }).extension,
    "mp4",
  );
  assert.equal(
    video.preferredVideoFormat({ isTypeSupported: () => false }),
    null,
  );
});

test("composition captures model pixels with export settings and reserves the text region", () => {
  assert.ok(composition, "Studio compositor is not implemented");
  const captures = [],
    draws = [],
    text = [];
  const frame = { width: 1080, height: 1500 };
  const ctx = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage(...args) {
      draws.push(args);
    },
    measureText: (value) => ({ width: Array.from(value).length * 25 }),
    fillText(...args) {
      text.push(args);
    },
    save() {},
    restore() {},
  };
  const canvas = { getContext: () => ctx };
  composition.drawComposition(
    canvas,
    {
      api: {
        ready: true,
        captureFrame(options) {
          captures.push(options);
          return frame;
        },
      },
      title: "A specimen",
      subtitle: "A visible structure",
    },
    {
      composition: "portrait",
      resolution: 1920,
      background: "transparent",
      labels: false,
      title: true,
      attribution: true,
      motion: "process",
    },
    { fraction: 0.5, lang: "en" },
  );
  assert.equal(canvas.width, 1080);
  assert.equal(canvas.height, 1920);
  assert.equal(captures[0].background, "transparent");
  assert.equal(captures[0].labels, false);
  assert.equal(captures[0].progress, 0.5);
  assert.equal(draws[0][0], frame);
  assert.ok(draws[0][2] > 140);
  assert.ok(text.some(([value]) => value === "A specimen"));
});

test("exports retain project and scale context without an author-name watermark", () => {
  const text = [];
  const ctx = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage() {},
    save() {},
    restore() {},
    measureText: (value) => ({ width: value.length * 12 }),
    fillText: (value) => text.push(value),
  };
  for (const attribution of [true, false]) {
    for (const fraction of [undefined, 0.5]) {
      text.length = 0;
      const prefs = config.normalizePreferences({ attribution, title: false });
      const layout = composition.drawComposition(
        { getContext: () => ctx },
        {
          api: { captureFrame: () => ({ width: 100, height: 100 }) },
        },
        prefs,
        { lang: "en", fraction },
      );
      assert.ok(text.includes("Teaching model · not to scale"));
      assert.ok(text.includes("BioScape"));
      assert.ok(text.every((value) => !value.includes("Kun Qian")));
      assert.ok(layout.model.y + layout.model.height < layout.footerY);
    }
  }
});

test("preview scales pixels but preserves export framing and typography", () => {
  const draws = [],
    captures = [],
    transforms = [],
    text = [];
  const ctx = {
    setTransform: (...value) => transforms.push(value),
    clearRect() {},
    fillRect() {},
    save() {},
    restore() {},
    drawImage: (...value) => draws.push(value),
    measureText: (value) => ({ width: value.length * 12 }),
    fillText: (...value) => text.push(value),
  };
  const source = {
    title: "Animal cell",
    api: {
      captureFrame(options) {
        captures.push(options);
        return { width: options.width, height: options.height };
      },
    },
  };
  const prefs = config.normalizePreferences({
    composition: "portrait",
    resolution: 2560,
  });
  const previewCanvas = { getContext: () => ctx },
    exportCanvas = { getContext: () => ctx };
  const previewLayout = composition.drawComposition(
    previewCanvas,
    source,
    prefs,
    { scale: 0.25, reuseFrame: true },
  );
  const previewTitle = [...text[0]];
  text.length = 0;
  const exportLayout = composition.drawComposition(exportCanvas, source, prefs);
  assert.deepEqual(previewLayout, exportLayout);
  assert.deepEqual(previewTitle, text[0]);
  assert.deepEqual([previewCanvas.width, previewCanvas.height], [360, 640]);
  assert.deepEqual([exportCanvas.width, exportCanvas.height], [1440, 2560]);
  assert.deepEqual(draws[0].slice(1), draws[1].slice(1));
  assert.equal(captures[0].labelScale, 0.25);
  assert.equal(captures[0].reuseFrame, true);
  assert.equal(captures[1].reuseFrame, false);
  assert.equal(captures[1].width, exportLayout.model.width);
  assert.deepEqual(transforms[0], [0.25, 0, 0, 0.25, 0, 0]);
});

test("process motion captions follow the exported stage while orbit preserves current stage", () => {
  const fractions = [],
    text = [];
  const ctx = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage() {},
    save() {},
    restore() {},
    measureText: (value) => ({ width: value.length * 12 }),
    fillText: (value) => text.push(value),
  };
  const source = {
    kind: "process",
    title: "Secretion",
    subtitle: "Original context",
    api: { captureFrame: () => ({ width: 100, height: 100 }) },
    getFrameCaption(fraction) {
      fractions.push(fraction);
      return "Stage 3 · Sorting";
    },
  };
  const canvas = { getContext: () => ctx };
  composition.drawComposition(
    canvas,
    source,
    config.normalizePreferences({ motion: "process" }, source),
    { fraction: 0.5 },
  );
  composition.drawComposition(
    canvas,
    source,
    config.normalizePreferences({ motion: "turn" }, source),
    { fraction: 0.5 },
  );
  assert.deepEqual(fractions, [0.5, undefined]);
  assert.ok(text.includes("Stage 3 · Sorting"));
  assert.ok(!text.includes("Original context"));
});

test("spacious framing preserves separate title and scientific footer regions", () => {
  for (const composition of ["landscape", "portrait", "square"]) {
    const fitted = config.compositionLayout(
      config.normalizePreferences({ composition }),
    );
    const airy = config.compositionLayout(
      config.normalizePreferences({ composition, framing: "airy" }),
    );
    assert.ok(airy.model.width < fitted.model.width);
    assert.ok(airy.model.height < fitted.model.height);
    assert.ok(airy.model.y > fitted.model.y);
    assert.ok(airy.model.y + airy.model.height < airy.footerY);
  }
});

test("AVC is preferred over ambiguous MP4 and VP9 is kept in WebM", () => {
  assert.match(
    video.preferredVideoFormat({ isTypeSupported: () => true }).mimeType,
    /avc1/,
  );
  assert.equal(
    video.preferredVideoFormat({
      isTypeSupported: (type) => !type.includes("avc1"),
    }).extension,
    "webm",
  );
});
