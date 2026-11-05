import assert from "node:assert/strict";
import { test } from "node:test";

import * as config from "../src/studio/config.js";
import * as video from "../src/studio/recordVideo.js";
import * as composition from "../src/studio/composition.js";

test("scientific export notes retain complete bilingual context without touching the model or credit", async () => {
  const { build } = await import("esbuild");
  const { fileURLToPath } = await import("node:url");
  const bundled = await build({
    stdin: {
      contents:
        "export { groupProcessStructures } from './src/exploration/relationships.js';",
      resolveDir: fileURLToPath(new URL("../", import.meta.url)),
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    logLevel: "silent",
  });
  const { groupProcessStructures } = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
  );
  const { getConditionNote } = await import(
    "../src/exploration/conditionNotes.js"
  );
  const notes = [];
  for (const lang of ["en", "zh"])
    for (const [id, parameters] of [
      ["actionPotential", { stimulus: "on" }],
      ["synapse", { calcium: "blocked" }],
    ]) {
      const note = [
        groupProcessStructures("neuron", id, []).scope?.label?.[lang],
        getConditionNote(id, parameters, lang)?.title,
      ]
        .filter(Boolean)
        .join(" · ");
      assert.ok(
        note.length > 10,
        `${id}/${lang}: use actual scientific context`,
      );
      notes.push({ note, lang });
    }
  for (const { note, lang } of notes)
    for (const format of ["landscape", "portrait", "square"])
      for (const resolution of [1920, 2560])
        for (const title of [true, false]) {
          const text = [];
          const ctx = {
            setTransform() {},
            clearRect() {},
            fillRect() {},
            drawImage() {},
            save() {},
            restore() {},
            measureText: (value) => ({
              width: Array.from(value).reduce(
                (width, char) => width + (/[^\x00-\x7f]/.test(char) ? 24 : 12),
                0,
              ),
            }),
            fillText: (value, x, y) => text.push({ value, x, y }),
          };
          const prefs = config.normalizePreferences({
            composition: format,
            resolution,
            title,
          });
          const layout = composition.drawComposition(
            { getContext: () => ctx },
            {
              title: "Biological process",
              scientificNote: note,
              api: { captureFrame: () => ({ width: 100, height: 100 }) },
            },
            prefs,
            { lang },
          );
          const footer = text.filter(
            (line) => line.y > layout.model.y + layout.model.height,
          );
          const scientific = footer.slice(0, -2);
          assert.equal(
            scientific
              .map((line) => line.value)
              .join("")
              .replace(/\s+/g, ""),
            note.replace(/\s+/g, ""),
            `${format}/${resolution}/${lang}: scientific context must not be truncated`,
          );
          assert.ok(
            scientific.every(
              (line) =>
                ctx.measureText(line.value).width <=
                layout.width - 2 * layout.padding,
            ),
          );
          assert.ok(
            scientific.every(
              (line) => line.y + layout.footerSize <= layout.footerY,
            ),
          );
          assert.ok(layout.model.height > 300);
          assert.equal(footer.at(-2).value, "BioScape");
          assert.equal(
            footer.at(-1).value,
            lang === "en"
              ? "Teaching model · not to scale"
              : "教学示意 · 非真实比例",
          );
        }
});

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

test("a released prepared composition never paints a late GPU result", async () => {
  let resolve,
    released = 0,
    painted = 0;
  const ready = new Promise((yes) => {
    resolve = yes;
  });
  const ctx = {
    measureText: (value) => ({ width: value.length * 12 }),
    drawImage() {
      painted++;
    },
  };
  const source = {
    title: "Specimen",
    api: {
      ready: true,
      captureFrame() {
        assert.fail("must not capture twice");
      },
      prepareCaptureFrame() {
        return {
          ready,
          release() {
            released++;
          },
        };
      },
    },
  };
  const job = composition.prepareComposition(
    { getContext: () => ctx },
    source,
    config.normalizePreferences({}),
  );
  const draw = job.draw();
  job.release();
  resolve({ width: 100, height: 100 });
  await assert.rejects(draw, { name: "AbortError" });
  assert.equal(painted, 0);
  assert.equal(released, 1);
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

test("portrait export descriptions wrap English words while retaining CJK and long tokens", () => {
  const text = [];
  const ctx = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    drawImage() {},
    save() {},
    restore() {},
    measureText: (value) => ({ width: Array.from(value).length * 12 }),
    fillText: (value) => text.push(value),
  };
  const prefs = config.normalizePreferences({ composition: "portrait" });
  for (const [description, separator, measure] of [
    [
      "Follow continuous leading-strand synthesis and Okazaki-fragment maturation on antiparallel templates.",
      " ",
    ],
    ["观察亲本链与新生链的方向关系。".repeat(12), ""],
    ["X".repeat(200), ""],
    [
      "i WWWW",
      "",
      (value) =>
        Array.from(value).reduce(
          (width, character) => width + (character === "W" ? 300 : 1),
          0,
        ),
    ],
  ]) {
    text.length = 0;
    ctx.measureText = (value) => ({
      width: measure ? measure(value) : Array.from(value).length * 12,
    });
    const layout = composition.drawComposition(
      { getContext: () => ctx },
      {
        kind: "process",
        title: "DNA replication fork",
        subtitle: description,
        getFrameCaption: () => "Step 4 / 6 · Repeated priming",
        api: { captureFrame: () => ({ width: 100, height: 100 }) },
      },
      prefs,
      { lang: separator ? "en" : "zh" },
    );
    const lines = text.slice(2, -2);
    assert.equal(lines.join(separator), description);
    assert.ok(lines.length > 1 && lines.length <= 3);
    assert.ok(
      lines.every(
        (line) =>
          ctx.measureText(line).width <= layout.width - layout.padding * 2,
      ),
    );
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

function visibilityRecordingFixture() {
  class TrackedTarget extends EventTarget {
    listeners = new Map();
    addEventListener(type, fn, options) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(fn);
      super.addEventListener(type, fn, options);
    }
    removeEventListener(type, fn, options) {
      this.listeners.get(type)?.delete(fn);
      super.removeEventListener(type, fn, options);
    }
    count() {
      return [...this.listeners.values()].reduce(
        (sum, set) => sum + set.size,
        0,
      );
    }
  }
  const owner = new TrackedTarget();
  owner.hidden = false;
  owner.defaultView = new TrackedTarget();
  let time = 0,
    next = 0,
    captures = 0,
    trackStops = 0;
  const rafs = new Map(),
    timers = new Map(),
    recorders = [],
    frames = [];
  class Recorder {
    static isTypeSupported(type) {
      return type.startsWith("video/webm");
    }
    constructor(stream, options) {
      this.state = "inactive";
      this.mimeType = options.mimeType;
      this.stopCalls = 0;
      recorders.push(this);
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.stopCalls++;
      this.state = "inactive";
      queueMicrotask(() => {
        this.ondataavailable?.({ data: new Blob(["complete-recording"]) });
        this.onstop?.();
      });
    }
  }
  const track = {
    stop() {
      trackStops++;
    },
    requestFrame() {},
  };
  const canvas = {
    ownerDocument: owner,
    captureStream() {
      captures++;
      return { getTracks: () => [track], getVideoTracks: () => [track] };
    },
  };
  const runtime = {
    MediaRecorder: Recorder,
    now: () => time,
    requestAnimationFrame(fn) {
      const id = ++next;
      rafs.set(id, fn);
      return id;
    },
    cancelAnimationFrame(id) {
      rafs.delete(id);
    },
    setTimeout(fn, delay) {
      const id = ++next;
      timers.set(id, { fn, due: time + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  const advance = (value, paint = true) => {
    time = value;
    if (paint) {
      const pending = [...rafs.values()];
      rafs.clear();
      pending.forEach((fn) => fn(time));
    }
    const due = [...timers].filter(([, timer]) => timer.due <= time);
    due.forEach(([id, timer]) => {
      timers.delete(id);
      timer.fn();
    });
  };
  return {
    owner,
    canvas,
    frames,
    recorders,
    advance,
    hide() {
      owner.hidden = true;
      owner.dispatchEvent(new Event("visibilitychange"));
    },
    show() {
      owner.hidden = false;
      owner.dispatchEvent(new Event("visibilitychange"));
    },
    leave() {
      owner.defaultView.dispatchEvent(new Event("pagehide"));
    },
    snapshot: () => ({
      captures,
      trackStops,
      jobs: rafs.size + timers.size,
      listeners: owner.count() + owner.defaultView.count(),
    }),
    options: {
      canvas,
      runtime,
      duration: 6,
      drawFrame: (fraction) => frames.push(fraction),
    },
  };
}
function observeRecording(promise) {
  const state = { status: "pending" };
  promise.then(
    (value) => Object.assign(state, { status: "fulfilled", value }),
    (error) => Object.assign(state, { status: "rejected", error }),
  );
  return state;
}
const recordingMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

for (const trigger of ["hide", "leave"]) {
  test(`recording ${trigger} stops tracks without waiting for another animation frame`, async () => {
    const f = visibilityRecordingFixture(),
      controller = new AbortController();
    const state = observeRecording(
      video.recordVideo({ ...f.options, signal: controller.signal }),
    );
    try {
      f.advance(1000);
      f[trigger]();
      await recordingMicrotasks();
      assert.equal(
        state.status,
        "rejected",
        "leaving the page must settle recording before RAF resumes",
      );
      assert.equal(state.error.message, "VIDEO_PAGE_HIDDEN");
      assert.equal(f.recorders[0].stopCalls, 1);
      assert.deepEqual(f.snapshot(), {
        captures: 1,
        trackStops: 1,
        jobs: 0,
        listeners: 0,
      });
    } finally {
      controller.abort();
      await recordingMicrotasks();
    }
  });
}
test("starting a hidden recording rejects before drawing or allocating media resources", async () => {
  const f = visibilityRecordingFixture(),
    controller = new AbortController();
  f.owner.hidden = true;
  const state = observeRecording(
    video.recordVideo({ ...f.options, signal: controller.signal }),
  );
  try {
    await recordingMicrotasks();
    assert.equal(state.status, "rejected");
    assert.equal(state.error.message, "VIDEO_PAGE_HIDDEN");
    assert.equal(f.frames.length, 0);
    assert.deepEqual(f.snapshot(), {
      captures: 0,
      trackStops: 0,
      jobs: 0,
      listeners: 0,
    });
  } finally {
    controller.abort();
    await recordingMicrotasks();
  }
});
test("visible visibility changes preserve a complete video and release lifecycle listeners", async () => {
  const f = visibilityRecordingFixture();
  const done = video.recordVideo(f.options);
  f.show();
  f.advance(3000);
  f.advance(6000);
  f.advance(6120, false);
  const result = await done;
  assert.ok(result.blob.size);
  assert.equal(f.frames.at(-1), 1);
  assert.deepEqual(f.snapshot(), {
    captures: 1,
    trackStops: 1,
    jobs: 0,
    listeners: 0,
  });
  f.hide();
  f.leave();
  assert.equal(f.recorders[0].stopCalls, 1);
});
test("hiding while the encoder finalizes discards the partial result", async () => {
  const f = visibilityRecordingFixture(),
    controller = new AbortController();
  const state = observeRecording(
    video.recordVideo({ ...f.options, signal: controller.signal }),
  );
  try {
    f.advance(6000);
    f.advance(6120, false);
    f.hide();
    await recordingMicrotasks();
    assert.equal(state.status, "rejected");
    assert.equal(state.error.message, "VIDEO_PAGE_HIDDEN");
    assert.equal(f.recorders[0].stopCalls, 1);
    assert.deepEqual(f.snapshot(), {
      captures: 1,
      trackStops: 1,
      jobs: 0,
      listeners: 0,
    });
  } finally {
    controller.abort();
    await recordingMicrotasks();
  }
});
test("manual recording cancellation releases visibility listeners and keeps AbortError", async () => {
  const f = visibilityRecordingFixture(),
    controller = new AbortController();
  const done = video.recordVideo({ ...f.options, signal: controller.signal });
  const rejected = assert.rejects(done, { name: "AbortError" });
  controller.abort();
  await rejected;
  assert.deepEqual(f.snapshot(), {
    captures: 1,
    trackStops: 1,
    jobs: 0,
    listeners: 0,
  });
});
test("render failure releases recording visibility listeners", async () => {
  const f = visibilityRecordingFixture();
  const done = video.recordVideo({
    ...f.options,
    drawFrame() {
      throw new Error("capture failed");
    },
  });
  await assert.rejects(done, /capture failed/);
  assert.deepEqual(f.snapshot(), {
    captures: 0,
    trackStops: 0,
    jobs: 0,
    listeners: 0,
  });
});
test("visibility loss during the initial draw does not allocate a recorder afterward", async () => {
  const f = visibilityRecordingFixture(),
    controller = new AbortController();
  const state = observeRecording(
    video.recordVideo({
      ...f.options,
      signal: controller.signal,
      drawFrame() {
        f.hide();
      },
    }),
  );
  try {
    await recordingMicrotasks();
    assert.equal(state.status, "rejected");
    assert.equal(state.error.message, "VIDEO_PAGE_HIDDEN");
    assert.deepEqual(f.snapshot(), {
      captures: 0,
      trackStops: 0,
      jobs: 0,
      listeners: 0,
    });
  } finally {
    controller.abort();
    await recordingMicrotasks();
  }
});
test("visibility loss during initial progress publication cannot leave an orphan frame", async () => {
  const f = visibilityRecordingFixture(),
    controller = new AbortController();
  const state = observeRecording(
    video.recordVideo({
      ...f.options,
      signal: controller.signal,
      onProgress() {
        f.hide();
      },
    }),
  );
  try {
    await recordingMicrotasks();
    assert.equal(state.status, "rejected");
    assert.equal(state.error.message, "VIDEO_PAGE_HIDDEN");
    assert.deepEqual(f.snapshot(), {
      captures: 1,
      trackStops: 1,
      jobs: 0,
      listeners: 0,
    });
  } finally {
    controller.abort();
    await recordingMicrotasks();
  }
});
test("a cancelled background recording can be retried visibly with a new recorder", async () => {
  const f = visibilityRecordingFixture(),
    controller = new AbortController();
  const state = observeRecording(
    video.recordVideo({ ...f.options, signal: controller.signal }),
  );
  try {
    f.hide();
    await recordingMicrotasks();
    assert.equal(state.status, "rejected");
    f.show();
    const next = video.recordVideo(f.options);
    f.advance(3000);
    f.advance(6000);
    f.advance(6120, false);
    assert.ok((await next).blob.size);
    assert.equal(f.recorders.length, 2);
    assert.deepEqual(f.snapshot(), {
      captures: 2,
      trackStops: 2,
      jobs: 0,
      listeners: 0,
    });
  } finally {
    controller.abort();
    await recordingMicrotasks();
  }
});
