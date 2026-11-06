import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";

// Run the real component/effects with a recording DOM and renderer. This checks
// scheduling and layout access without a browser, GPU or timing assumptions.
const runtime = { current: null };
let nextId = 0;
const globals = new Map(
  [
    "window",
    "document",
    "ResizeObserver",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "__processAnnotationRuntime",
  ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
);
class Element {
  constructor(tag) {
    this.tag = tag;
    this.context = runtime.current;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.className = "";
    this.hidden = false;
    this.parentElement = null;
    this.tabIndex = tag === "button" ? 0 : -1;
    this.listeners = new Map();
    this._text = "";
    this.style = new Proxy(
      {},
      {
        set: (target, key, value) => {
          if (["visibility", "left", "top"].includes(key))
            this.context.writes++;
          target[key] = value;
          return true;
        },
      },
    );
    this.classList = { add() {}, toggle() {} };
    this.context.elements.push(this);
  }
  set textContent(value) {
    this.context.writes++;
    this._text = value;
  }
  get textContent() {
    return this._text;
  }
  get tagName() {
    return this.tag.toUpperCase();
  }
  get nextElementSibling() {
    const siblings = this.parentElement?.children ?? [];
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }
  get previousElementSibling() {
    const siblings = this.parentElement?.children ?? [];
    return siblings[siblings.indexOf(this) - 1] ?? null;
  }
  get offsetWidth() {
    this.context.reads++;
    return this.context.props.annotations
      ? Math.max(21, this.textContent.length * 10) * this.context.fontScale
      : 0;
  }
  get offsetHeight() {
    this.context.reads++;
    return this.context.props.annotations ? 21 * this.context.fontScale : 0;
  }
  append(...items) {
    for (const item of items) item.parentElement = this;
    this.children.push(...items);
  }
  prepend(...items) {
    for (const item of items) item.parentElement = this;
    this.children.unshift(...items);
  }
  replaceChildren(...items) {
    for (const item of this.children) item.parentElement = null;
    for (const item of items) item.parentElement = this;
    this.children = items;
  }
  setAttribute(key, value) {
    this.context.writes++;
    this.attributes[key] = String(value);
  }
  removeAttribute(key) {
    delete this.attributes[key];
    if (key === "tabindex") this.tabIndex = -1;
  }
  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }
  removeEventListener(type) {
    this.listeners.delete(type);
  }
  scrollIntoView(options) {
    this.scrollOptions = options;
  }
  focus() {
    document.activeElement = this;
    this.listeners.get("focus")?.();
  }
  remove() {}
  getBoundingClientRect() {
    return this.context.viewport;
  }
}
class Renderer {
  constructor() {
    this.domElement = new Element("canvas");
    this.shadowMap = {
      enabled: false,
      type: THREE.PCFShadowMap,
      autoUpdate: true,
      needsUpdate: false,
    };
    this.info = { autoReset: true };
  }
  setRenderTarget(value) {
    this.renderTarget = value;
  }
  setScissorTest(value) {
    this.scissorTest = value;
  }
  setPixelRatio() {}
  setClearColor() {}
  setSize() {}
  dispose() {}
  render(scene, camera) {
    camera.updateMatrixWorld();
    runtime.current.draws++;
  }
}
class Controls extends THREE.EventDispatcher {
  constructor(camera) {
    super();
    this.camera = camera;
    this.target = new THREE.Vector3();
  }
  update() {
    this.camera.lookAt(this.target);
    return false;
  }
  saveState() {}
  listenToKeyEvents() {}
  dispose() {}
}
runtime.three = {
  ...THREE,
  WebGLRenderer: Renderer,
  PMREMGenerator: class {
    fromScene() {
      return { texture: new THREE.Texture(), dispose() {} };
    }
    dispose() {}
  },
};
runtime.Controls = Controls;
globalThis.__processAnnotationRuntime = runtime;

function fixture(Component, annotations = false, options = {}) {
  const context = {
    pendingInitializations: new Set(),
    elements: [],
    reads: 0,
    writes: 0,
    draws: 0,
    fontScale: 1,
    viewport: { width: 600, height: 400 },
    jobs: new Map(),
    sequence: 0,
    slots: [],
    index: 0,
    effects: [],
    layoutEffects: [],
    fonts: new Set(),
    observers: [],
    progress: { current: 0 },
    updates: [],
    api: null,
  };
  runtime.current = context;
  context.hooks = {
    useId() {
      return (context.slots[context.index++] ??= `annotation-${nextId++}`);
    },
    useRef(initial) {
      const i = context.index++;
      return (context.slots[i] ??= { current: initial });
    },
    useState(initial) {
      const i = context.index++;
      const slot = (context.slots[i] ??= { value: initial });
      return [
        slot.value,
        (value) => {
          slot.value = typeof value === "function" ? value(slot.value) : value;
        },
      ];
    },
    useLayoutEffect(callback, dependencies) {
      const i = context.index++;
      const slot = (context.slots[i] ??= {});
      if (
        !slot.dependencies ||
        dependencies.some((v, n) => !Object.is(v, slot.dependencies[n]))
      )
        context.layoutEffects.push(() => {
          slot.cleanup?.();
          slot.dependencies = [...dependencies];
          slot.cleanup = callback();
        });
    },
    useEffect(callback, dependencies) {
      const i = context.index++;
      const slot = (context.slots[i] ??= {});
      if (
        !slot.dependencies ||
        dependencies.some((v, n) => !Object.is(v, slot.dependencies[n]))
      )
        context.effects.push(() => {
          slot.cleanup?.();
          slot.dependencies = [...dependencies];
          slot.cleanup = callback();
        });
    },
    createElement(tag, props) {
      if (props?.ref && !props.ref.current) {
        props.ref.current = new Element(tag);
        props.ref.current.className = props.className ?? "";
      }
      return null;
    },
  };
  globalThis.window = {
    devicePixelRatio: 1,
    matchMedia: () => ({ matches: false }),
  };
  globalThis.document = {
    activeElement: null,
    createElement: (tag) => new Element(tag),
    createElementNS: (_namespace, tag) => new Element(tag),
    fonts: {
      addEventListener: (_event, fn) => context.fonts.add(fn),
      removeEventListener: (_event, fn) => context.fonts.delete(fn),
    },
  };
  globalThis.ResizeObserver = class {
    constructor(callback) {
      context.observers.push(callback);
    }
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = (fn) => {
    context.jobs.set(++context.sequence, fn);
    return context.sequence;
  };
  globalThis.cancelAnimationFrame = (id) => context.jobs.delete(id);
  const definition = {
    id: "annotation-visibility-fixture",
    stages: [],
    create() {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial(),
      );
      group.add(mesh);
      const labels = [
        {
          text: { zh: "初始复合体", en: "Initial complex" },
          position: [-1, 0, 0],
        },
        { text: { zh: "ATP", en: "ATP" }, position: [0, 1, 0] },
        {
          text: { zh: "正在生成的产物", en: "Growing product" },
          position: [1, 0, 0],
        },
      ];
      const initial = labels[0],
        product = labels[2];
      if (options.physicalKind !== undefined)
        for (const label of labels) label.annotationKind = options.physicalKind;
      const contextLabels = options.contexts
        ? [
            {
              text: {
                zh: "空间靠近不等于转录",
                en: "Proximity is not transcription",
              },
            },
            { text: { zh: "本窗口无转录脉冲", en: "No burst in this window" } },
          ]
        : [];
      for (const label of contextLabels) {
        label.annotationKind = "context";
        Object.defineProperty(label, "position", {
          enumerable: true,
          get() {
            throw new Error("Context must never read a geometric position");
          },
        });
      }
      labels.splice(1, 0, ...contextLabels);
      return {
        group,
        labels,
        camera: { position: [0, 1, 8], target: [0, 0, 0] },
        update(progress) {
          context.updates.push(progress);
          mesh.position.x = progress;
          initial.active = progress < 0.5;
          product.active = progress >= 0.5;
          product.position[0] = 1 + progress;
          if (contextLabels.length) {
            contextLabels[0].active = progress < 0.5;
            contextLabels[1].active = progress >= 0.5;
          }
        },
      };
    },
  };
  context.props = {
    definition,
    rootId: "cell",
    parameters: {},
    progress: 0,
    progressSource: context.progress,
    lang: "zh",
    annotations,
    onSceneReady: (api) => {
      context.api = api;
    },
  };
  context.render = (props = {}) => {
    Object.assign(context.props, props);
    context.index = 0;
    context.effects = [];
    context.layoutEffects = [];
    Component(context.props);
    context.layoutEffects.forEach((effect) => effect());
    context.effects.forEach((effect) => effect());
    if (context.pendingInitializations.size)
      return Promise.all([...context.pendingInitializations]);
  };
  context.flush = () => {
    for (let i = 0; context.jobs.size && i < 8; i++) {
      const jobs = [...context.jobs.values()];
      context.jobs.clear();
      jobs.forEach((callback) => callback(i * 16));
    }
    assert.equal(context.jobs.size, 0, "Paused annotation changes must settle");
  };
  context.snapshot = () => ({
    markers: context.elements
      .filter((e) => e.className === "process-model-label")
      .map((e) => ({ text: e.textContent, ...e.style })),
    lines: context.elements
      .filter((e) => e.tag === "line")
      .map((e) => e.attributes),
    keys: context.elements
      .filter((e) => e.className === "process-annotation-item")
      .map((e) => ({
        hidden: e.hidden,
        aria: e.attributes["aria-label"],
        text: e.children.map((c) => c.textContent),
      })),
    contexts: context.elements
      .filter((e) => e.className === "process-annotation-context")
      .map((e) => ({ text: e.textContent, hidden: e.hidden })),
  });
  context.dispose = () => context.slots.forEach((slot) => slot.cleanup?.());
  return context;
}

const directory = await mkdtemp(
  join(tmpdir(), "bioscape-annotation-visibility-"),
);
const source = resolve(
  process.env.BIOSCAPE_PROCESS_SCENE_REVIEW_SOURCE ??
    "src/processes/ProcessScene.jsx",
);
try {
  const outfile = join(directory, "component.mjs");
  await build({
    entryPoints: [source],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
    plugins: [
      {
        name: "recording-scene-runtime",
        setup(build) {
          // Track the real asynchronous framing helper without replacing its
          // queue, cancellation, model updates, or bounds calculations.
          build.onLoad(
            { filter: /framingPreparation\.js$/ },
            async ({ path }) => ({
              contents:
                (await readFile(path, "utf8")).replace(
                  "export function createProcessFramingPreparation(",
                  "function createActualProcessFramingPreparation(",
                ) +
                `
export function createProcessFramingPreparation(options) {
  const fixture = globalThis.__processAnnotationRuntime.current;
  const preparation = createActualProcessFramingPreparation(options);
  return {
    start(...args) {
      const promise = preparation.start(...args);
      fixture.pendingInitializations.add(promise);
      promise.then(() => fixture.pendingInitializations.delete(promise));
      return promise;
    },
    cancel: (...args) => preparation.cancel(...args),
    dispose: () => preparation.dispose(),
    get pending() { return preparation.pending; },
  };
}
`,
              loader: "js",
              resolveDir: resolve("src/processes"),
            }),
          );
          build.onResolve(
            {
              filter:
                /^(react|three|three\/addons\/controls\/OrbitControls\.js|three\/addons\/environments\/RoomEnvironment\.js)$/,
            },
            (args) => ({ path: args.path, namespace: "recording" }),
          );
          build.onResolve({ filter: /sceneCapture\.js$/ }, () => ({
            path: "capture",
            namespace: "recording",
          }));
          build.onLoad({ filter: /.*/, namespace: "recording" }, ({ path }) => {
            const host = "globalThis.__processAnnotationRuntime";
            if (path === "react")
              return {
                contents: `export const useId=(...a)=>${host}.current.hooks.useId(...a); export const useRef=(...a)=>${host}.current.hooks.useRef(...a); export const useState=(...a)=>${host}.current.hooks.useState(...a); export const useEffect=(...a)=>${host}.current.hooks.useEffect(...a); export const useLayoutEffect=(...a)=>${host}.current.hooks.useLayoutEffect(...a); export default {createElement:(...a)=>${host}.current.hooks.createElement(...a)};`,
              };
            if (path === "three")
              return {
                contents: Object.keys(runtime.three)
                  .map((key) => `export const ${key}=${host}.three.${key};`)
                  .join("\n"),
              };
            if (path.includes("OrbitControls"))
              return {
                contents: `export const OrbitControls=${host}.Controls;`,
              };
            if (path.includes("RoomEnvironment"))
              return {
                contents: `export class RoomEnvironment extends ${host}.three.Scene {dispose(){}}`,
              };
            return {
              contents:
                "export const applySceneView=()=>true; export const normalizeSceneView=v=>v; export const readSceneView=()=>({direction:[0,0,1],target:[0,0,0],zoom:1}); export const createSceneCapture=({getLabels})=>({dispose(){},captureFrame(){return getLabels();}});",
            };
          });
        },
      },
    ],
  });
  const { default: ProcessScene } = await import(pathToFileURL(outfile));
  await test("hidden process annotations do no layout work and resume the latest pose", async () => {
    const f = fixture(ProcessScene);
    await f.render();
    f.flush();
    assert(
      f.api?.ready && f.draws > 0,
      "The real scene effect must render successfully",
    );
    assert.equal(
      f.reads,
      0,
      "Initially hidden annotations must not measure zero-size DOM",
    );
    const initialWrites = f.writes;
    f.progress.current = 0.7;
    f.api.requestRender();
    await f.render({ lang: "en" });
    f.viewport = { width: 390, height: 500 };
    f.fontScale = 1.2;
    f.observers.forEach((fn) => fn());
    f.fonts.forEach((fn) => fn());
    f.flush();
    assert.equal(
      f.api.getProgress(),
      0.7,
      "Hidden labels must not suspend model updates",
    );
    assert.equal(f.reads, 0);
    assert.equal(
      f.writes,
      initialWrites,
      "Hidden frames must skip all annotation DOM writes",
    );
    const exported = f.api.captureFrame();
    assert.equal(
      exported.length,
      3,
      "Canvas export still reads model annotations independently",
    );
    assert.equal(exported[2].text, "Growing product");
    assert.equal(exported[2].active, true);
    await f.render({ annotations: true });
    assert(
      f.jobs.size > 0,
      "Showing annotations while paused must request a frame",
    );
    f.flush();
    assert.equal(
      f.reads,
      4,
      "Both active markers must be measured on first show",
    );
    const firstShow = f.snapshot();
    assert.deepEqual(
      firstShow.keys.map((key) => key.hidden),
      [true, true, false],
    );
    assert.deepEqual(firstShow.keys[2].text, ["1", "Growing product"]);
    const beforeFont = f.reads;
    f.fontScale = 1.3;
    f.fonts.forEach((fn) => fn());
    f.flush();
    assert.equal(
      f.reads,
      beforeFont + 4,
      "Visible font changes must refresh metrics",
    );
    await f.render({ annotations: false });
    f.flush();
    const hiddenReads = f.reads;
    f.fontScale = 1.4;
    f.fonts.forEach((fn) => fn());
    await f.render({ lang: "zh" });
    f.flush();
    assert.equal(f.reads, hiddenReads);
    await f.render({ annotations: true });
    f.flush();
    assert.equal(
      f.reads,
      hiddenReads + 4,
      "Showing again must invalidate cached metrics",
    );
    assert.deepEqual(f.snapshot().keys[2].text, ["1", "正在生成的产物"]);
    const expected = f.snapshot();
    f.dispose();
    assert.equal(f.fonts.size, 0);
    assert.equal(f.jobs.size, 0);

    // The same pose rendered with annotations visible from mount is an exact
    // DOM/layout oracle for hide -> resize/font/lang/pose change -> show.
    const visible = fixture(ProcessScene, true);
    visible.viewport = { width: 390, height: 500 };
    visible.fontScale = 1.4;
    visible.progress.current = 0.7;
    await visible.render();
    visible.flush();
    assert.deepEqual(visible.snapshot(), expected);
    visible.dispose();
  });
  await test("context notes retain text without geometry, numbering or molecular focus", async () => {
    const f = fixture(ProcessScene, true, { contexts: true });
    await f.render();
    f.flush();
    assert(
      f.api?.ready,
      "The context fixture must render without reading position",
    );
    const keys = f.elements.filter(
      (e) => e.className === "process-annotation-item",
    );
    const notes = f.elements.filter(
      (e) => e.className === "process-annotation-context",
    );
    const keyHost = notes[0].parentElement;
    assert.equal(notes.length, 2);
    assert.equal(
      keys.length,
      3,
      "Only physical labels create molecular buttons",
    );
    assert.equal(f.snapshot().markers.length, 3);
    assert.equal(f.snapshot().lines.length, 3);
    assert.deepEqual(
      f.elements
        .filter((e) => e.className === "process-model-label")
        .map((e) => e.dataset.label),
      ["0", "3", "4"],
      "Physical marker data keeps original model indices after the split",
    );
    assert.equal(
      keyHost.tabIndex,
      0,
      "The existing scrolling key is keyboard-accessible",
    );
    for (const note of notes) {
      assert.equal(note.tag, "p");
      assert.equal(note.attributes.role, "note");
      assert.equal(note.tabIndex, -1);
      assert.equal(
        note.listeners.size,
        0,
        "A context note has no molecular highlighting action",
      );
    }
    assert.deepEqual(f.snapshot().keys[0].text, ["1", "初始复合体"]);
    assert.deepEqual(
      f.snapshot().contexts.map((note) => note.hidden),
      [false, true],
    );
    keys[0].focus();
    f.progress.current = 0.7;
    f.api.requestRender();
    f.flush();
    assert.equal(
      document.activeElement,
      keys[2],
      "Focus skips notes and inactive keys",
    );
    assert.deepEqual(f.snapshot().keys[2].text, ["1", "正在生成的产物"]);
    assert.deepEqual(
      f.snapshot().contexts.map((note) => note.hidden),
      [true, false],
    );
    const stable = { reads: f.reads, writes: f.writes };
    for (let i = 0; i < 100; i++) {
      f.api.requestRender();
      f.flush();
    }
    assert.deepEqual(
      { reads: f.reads, writes: f.writes },
      stable,
      "Settled context frames do not write DOM or measure marker geometry",
    );
    const seek = f.api.captureFrame({ progress: 0 });
    const capturedContexts = seek.filter(
      (label) => label.annotationKind === "context",
    );
    assert.deepEqual(
      capturedContexts.map((label) => label.active),
      [true, false],
    );
    assert(capturedContexts.every((label) => !("position" in label)));
    assert.equal(
      f.api.getProgress(),
      0.7,
      "Capture restores the live progress",
    );
    await f.render({ annotations: false });
    f.flush();
    const hidden = { reads: f.reads, writes: f.writes };
    f.progress.current = 0.1;
    await f.render({ lang: "en" });
    f.flush();
    assert.deepEqual({ reads: f.reads, writes: f.writes }, hidden);
    const hiddenCapture = f.api.captureFrame();
    assert.deepEqual(
      hiddenCapture
        .filter((label) => label.annotationKind === "context")
        .map((label) => label.text),
      ["Proximity is not transcription", "No burst in this window"],
      "Capture language remains current even while live annotations are hidden",
    );
    await f.render({ annotations: true });
    f.flush();
    assert.deepEqual(f.snapshot().contexts, [
      { text: "Proximity is not transcription", hidden: false },
      { text: "No burst in this window", hidden: true },
    ]);
    assert.equal(
      document.activeElement,
      keys[0],
      "Reverse seek restores a remaining physical focus target",
    );
    f.dispose();
    assert.equal(
      keyHost.tabIndex,
      -1,
      "Context keyboard setup is removed on scene cleanup",
    );
  });
  await test("region, state and unknown kinds retain the ordinary annotation path", async () => {
    const original = fixture(ProcessScene, true);
    await original.render();
    original.flush();
    const expected = original.snapshot();
    const expectedCapture = original.api.captureFrame();
    original.dispose();
    for (const physicalKind of ["region", "state", "unknown", "Context"]) {
      const f = fixture(ProcessScene, true, { physicalKind });
      await f.render();
      f.flush();
      assert.deepEqual(f.snapshot(), expected);
      assert.deepEqual(f.api.captureFrame(), expectedCapture);
      f.dispose();
    }
  });
} finally {
  await rm(directory, { recursive: true, force: true });
  for (const [key, descriptor] of globals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
