import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as THREE from "three";
import { WebGLObjects } from "../node_modules/three/src/renderers/webgl/WebGLObjects.js";
import { getConditionNote } from "../src/exploration/conditionNotes.js";
import { restoreProcessSession } from "../src/exploration/processSession.js";

// Execute the real React component bodies/effects. Only browser/GPU adapters are
// replaced; model transforms, annotation projection/layout and disposal are real.
const runtime = { current: null };
let nextId = 0;
let groupProcessStructures;
const originals = new Map(
  [
    "window",
    "document",
    "ResizeObserver",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "__processSharedRuntime",
  ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
);

class Element {
  constructor(tag, context = runtime.current) {
    this.tag = tag;
    this.context = context;
    this.ownerDocument = context.document;
    this.parentElement = null;
    this.children = [];
    this.listeners = new Map();
    this.dataset = {};
    this.attributes = {};
    this.classes = new Set();
    this.classList = {
      add: (key) => this.classes.add(key),
      toggle: (key, value) => {
        context.writes++;
        if (value) this.classes.add(key);
        else this.classes.delete(key);
      },
    };
    this.style = new Proxy(
      {},
      {
        set: (target, key, value) => {
          if (["left", "top", "visibility"].includes(key)) context.writes++;
          target[key] = value;
          return true;
        },
      },
    );
    this._text = "";
    this._hidden = false;
    context.elements.push(this);
  }
  set textContent(value) {
    this.context.writes++;
    this._text = value;
  }
  get textContent() {
    this.context.contentReads++;
    return this._text;
  }
  set hidden(value) {
    this.context.writes++;
    this._hidden = value;
    if (value && this.contains(this.ownerDocument?.activeElement))
      this.ownerDocument.setFocus(this.ownerDocument.body);
  }
  get hidden() {
    this.context.contentReads++;
    return this._hidden;
  }
  get offsetWidth() {
    this.context.reads++;
    return Math.max(21, [...this._text].length * 10) * this.context.fontScale;
  }
  get offsetHeight() {
    this.context.reads++;
    return 21 * this.context.fontScale;
  }
  append(...children) {
    for (const child of children) {
      child.remove();
      child.parentElement = this;
      this.children.push(child);
    }
  }
  prepend(...children) {
    for (const child of children) {
      child.remove();
      child.parentElement = this;
    }
    this.children.unshift(...children);
  }
  replaceChildren(...children) {
    for (const child of [...this.children]) child.remove();
    this.append(...children);
  }
  contains(element) {
    for (let node = element; node; node = node.parentElement)
      if (node === this) return true;
    return false;
  }
  closest(selector) {
    // The player requests a single class; reject unsupported selector syntax.
    assert.match(selector, /^\.[A-Za-z_][\w-]*$/);
    const className = selector.slice(1);
    for (let node = this; node; node = node.parentElement)
      if (
        (node.className ?? "").split(/\s+/).includes(className) ||
        node.classes.has(className)
      )
        return node;
    return null;
  }
  get isConnected() {
    return this.ownerDocument?.body?.contains(this) ?? false;
  }
  get tagName() {
    return this.tag.toUpperCase();
  }
  get nextElementSibling() {
    const siblings = this.parentElement?.children;
    return siblings?.[siblings.indexOf(this) + 1] ?? null;
  }
  get previousElementSibling() {
    const siblings = this.parentElement?.children;
    return siblings?.[siblings.indexOf(this) - 1] ?? null;
  }
  scrollIntoView(options) {
    this.scrollOptions = options;
  }
  focus() {
    if (!this.isConnected || this.disabled) return;
    for (let node = this; node; node = node.parentElement)
      if (node._hidden) return;
    if (
      !["button", "input", "select", "textarea"].includes(this.tag) &&
      typeof this.tabIndex !== "number"
    )
      return;
    this.ownerDocument.setFocus(this);
  }
  matches(selector) {
    assert.equal(selector, ":focus-visible");
    return (
      this.ownerDocument.activeElement === this &&
      this.ownerDocument.inputModality === "keyboard"
    );
  }
  setAttribute(key, value) {
    this.context.writes++;
    this.attributes[key] = String(value);
  }
  removeAttribute(key) {
    this.context.writes++;
    delete this.attributes[key];
    if (key === "tabindex") delete this.tabIndex;
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }
  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) ?? [])
      listener({ ...event, target: this, currentTarget: this });
  }
  remove() {
    if (this.contains(this.ownerDocument?.activeElement))
      this.ownerDocument.setFocus(this.ownerDocument.body);
    if (!this.parentElement) return;
    const siblings = this.parentElement.children;
    siblings.splice(siblings.indexOf(this), 1);
    this.parentElement = null;
  }
  getBoundingClientRect() {
    return this.context.viewport;
  }
}

class Renderer {
  constructor() {
    this.context = runtime.current;
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
  dispose() {
    this.context.rendererDisposals++;
  }
  render(scene, camera) {
    if (this.context.failDraws > 0) {
      this.context.failDraws--;
      throw new Error("S214 planned draw failure");
    }
    camera.updateMatrixWorld();
    this.context.draws++;
    scene.traverse((object) => {
      if (object.isInstancedMesh) this.context.gpu.update(object);
    });
  }
}

class Controls extends THREE.EventDispatcher {
  constructor(camera) {
    super();
    this.camera = camera;
    runtime.current.controls.push(this);
    this.target = new THREE.Vector3();
  }
  update() {
    this.camera.lookAt(this.target);
  }
  saveState() {}
  listenToKeyEvents() {}
  dispose() {}
}

runtime.three = {
  ...THREE,
  Vector3: class extends THREE.Vector3 {
    project(camera) {
      runtime.current.projections++;
      return super.project(camera);
    }
  },
  WebGLRenderer: Renderer,
  PMREMGenerator: class {
    fromScene() {
      const f = runtime.current;
      f.environmentPreparations++;
      return {
        texture: new THREE.Texture(),
        dispose() {
          f.environmentDisposals++;
        },
      };
    }
    dispose() {}
  },
};
runtime.Controls = Controls;
runtime.group = (...args) => {
  runtime.current.relatedCalls++;
  return (runtime.current.related = groupProcessStructures(...args));
};
runtime.note = (...args) => {
  runtime.current.noteCalls++;
  return (runtime.current.note = getConditionNote(...args));
};
runtime.restore = restoreProcessSession;
globalThis.__processSharedRuntime = runtime;

function fixture(Component, props) {
  const f = {
    elements: [],
    slots: [],
    effects: [],
    layoutEffects: [],
    index: 0,
    writes: 0,
    reads: 0,
    contentReads: 0,
    projections: 0,
    draws: 0,
    rendererDisposals: 0,
    environmentPreparations: 0,
    environmentDisposals: 0,
    relatedCalls: 0,
    noteCalls: 0,
    jobs: new Map(),
    sequence: 0,
    fonts: new Set(),
    observers: [],
    fontScale: 1,
    viewport: { width: 600, height: 400 },
    props,
    buffers: new Set(),
    removed: [],
    disposed: [],
    failDraws: 0,
    pendingInitializations: new Set(),
    controls: [],
    modelUpdates: [],
  };
  // Keep document identity and activeElement across component rerenders. This
  // recorder models focus state, not native focus-visible heuristics or scroll.
  f.document = {
    activeElement: null,
    inputModality: "keyboard",
    focusHistory: [],
    createElement: (tag) => new Element(tag, f),
    createElementNS: (_, tag) => new Element(tag, f),
    addEventListener() {},
    removeEventListener() {},
    fonts: {
      addEventListener: (_, fn) => f.fonts.add(fn),
      removeEventListener: (_, fn) => f.fonts.delete(fn),
    },
    setFocus(element) {
      if (this.activeElement === element) return;
      const previous = this.activeElement;
      this.activeElement = element;
      this.focusHistory.push(element);
      previous?.dispatchEvent({ type: "blur" });
      element.dispatchEvent({ type: "focus" });
    },
  };
  f.document.body = new Element("body", f);
  f.document.activeElement = f.document.body;
  f.gpu = WebGLObjects(
    { ARRAY_BUFFER: 34962 },
    { get: (object) => object.geometry, update() {} },
    {
      update: (attribute) => f.buffers.add(attribute),
      remove: (attribute) => {
        f.buffers.delete(attribute);
        f.removed.push(attribute);
      },
    },
    { render: { frame: 1 } },
  );
  const memo = (callback, dependencies) => {
    const slot = (f.slots[f.index++] ??= {});
    if (
      !slot.dependencies ||
      dependencies.some((v, i) => !Object.is(v, slot.dependencies[i]))
    ) {
      slot.dependencies = [...dependencies];
      slot.value = callback();
    }
    return slot.value;
  };
  f.hooks = {
    useId() {
      return (f.slots[f.index++] ??= `shared-${nextId++}`);
    },
    useRef(initial) {
      return (f.slots[f.index++] ??= { current: initial });
    },
    useState(initial) {
      const slot = (f.slots[f.index++] ??= {
        value: typeof initial === "function" ? initial() : initial,
      });
      return [
        slot.value,
        (value) => {
          slot.value = typeof value === "function" ? value(slot.value) : value;
        },
      ];
    },
    useMemo: memo,
    useCallback: (callback, dependencies) => memo(() => callback, dependencies),
    useLayoutEffect(callback, dependencies) {
      const slot = (f.slots[f.index++] ??= {});
      if (
        !slot.dependencies ||
        dependencies.some((v, i) => !Object.is(v, slot.dependencies[i]))
      )
        f.layoutEffects.push(() => {
          slot.cleanup?.();
          slot.dependencies = [...dependencies];
          slot.cleanup = callback();
        });
    },
    useEffect(callback, dependencies) {
      const slot = (f.slots[f.index++] ??= {});
      if (
        !slot.dependencies ||
        dependencies.some((v, i) => !Object.is(v, slot.dependencies[i]))
      )
        f.effects.push(() => {
          slot.cleanup?.();
          slot.dependencies = [...dependencies];
          slot.cleanup = callback();
        });
    },
    createElement(type, props, ...children) {
      if (props?.ref && !props.ref.current) {
        props.ref.current = new Element(type);
        props.ref.current.className = props.className ?? "";
        f.document.body.append(props.ref.current);
      }
      return { type, props: { ...props, children } };
    },
  };
  f.render = (patch = {}) => {
    runtime.current = f;
    Object.assign(f.props, patch);
    globalThis.window = {
      devicePixelRatio: 1,
      matchMedia: () => ({ matches: false }),
    };
    globalThis.document = f.document;
    globalThis.ResizeObserver = class {
      constructor(fn) {
        f.observers.push(fn);
      }
      observe() {}
      disconnect() {}
    };
    globalThis.requestAnimationFrame = (fn) => {
      f.jobs.set(++f.sequence, fn);
      return f.sequence;
    };
    globalThis.cancelAnimationFrame = (id) => f.jobs.delete(id);
    f.index = 0;
    f.effects = [];
    f.layoutEffects = [];
    f.tree = Component(f.props);
    f.layoutEffects.forEach((effect) => effect());
    f.effects.forEach((effect) => effect());
    // Wait for the actual owned framing queues. GPU/browser adapters remain
    // recording fakes; the new asynchronous preparation is not mocked away.
    if (f.pendingInitializations.size)
      return Promise.all([...f.pendingInitializations]);
  };
  f.flush = () => {
    runtime.current = f;
    for (let i = 0; f.jobs.size && i < 8; i++) {
      const jobs = [...f.jobs.values()];
      f.jobs.clear();
      jobs.forEach((job) => job(i * 16));
    }
    assert.equal(f.jobs.size, 0, "Paused work must settle");
  };
  f.snapshot = () =>
    f.elements
      .filter(
        (e) =>
          ["process-model-label", "process-annotation-item"].includes(
            e.className,
          ) || e.tag === "line",
      )
      .map((e) => ({
        tag: e.tag,
        text: e._text,
        hidden: e._hidden,
        style: { ...e.style },
        attributes: { ...e.attributes },
        classes: [...e.classes],
        children: e.children.map((child) => child._text),
      }));
  f.dispose = () => {
    runtime.current = f;
    f.slots.forEach((slot) => slot.cleanup?.());
  };
  return f;
}

function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return null;
  if (Array.isArray(tree)) {
    for (const child of tree) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return null;
  }
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}

function sceneFixture(Component) {
  const labels = [
    { text: { zh: "第一复合体", en: "First complex" }, position: [-1, 0, 0] },
    { text: { zh: "ATP", en: "ATP" }, position: [0, 1, 0] },
    {
      text: { zh: "最后产物", en: "Final product" },
      position: [1, 0, 0],
      priority: 3,
      active: false,
    },
  ];
  const progress = { current: 0 };
  let f;
  const track = (resource, name) =>
    resource.addEventListener("dispose", () => f.disposed.push(name));
  const definition = {
    id: "shared-performance-fixture",
    stages: [],
    create() {
      const group = new THREE.Group();
      const geometry = new THREE.BoxGeometry();
      f.ownedGeometry = geometry;
      const texture = new THREE.Texture();
      const material = new THREE.MeshBasicMaterial({ map: texture });
      track(geometry, "geometry");
      track(material, "material");
      track(texture, "texture");
      for (let i = 0; i < 2; i++) {
        const mesh = new THREE.InstancedMesh(geometry, material, 1);
        mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(i, 0, 0));
        mesh.setColorAt(0, new THREE.Color("white"));
        track(mesh, `instance-${i}`);
        group.add(mesh);
      }
      group.add(new THREE.Mesh(geometry, material));
      return {
        group,
        labels,
        camera: { position: [0, 1, 8], target: [0, 0, 0] },
        update(value, parameters) {
          f.modelUpdates.push({ value, parameters });
          f.onModelUpdate?.(value, parameters);
        },
      };
    },
  };
  f = fixture(Component, {
    definition,
    rootId: "cell",
    progress: 0,
    progressSource: progress,
    parameters: {},
    lang: "zh",
    annotations: true,
    onSceneReady: (api) => {
      f.api = api;
    },
  });
  f.labels = labels;
  f.redraw = () => {
    f.api.requestRender();
    f.flush();
  };
  return f;
}

async function expectDrawFailure(action) {
  const original = console.error;
  const errors = [];
  try {
    console.error = (...args) => errors.push(args);
    await action();
  } finally {
    console.error = original;
  }
  assert.equal(errors.length, 1, "Only the planned scene failure is expected");
  assert.equal(errors[0][0], "Process scene failure");
  assert.equal(errors[0].at(-1)?.message, "S214 planned draw failure");
}

async function failedSceneFixture(Component) {
  const f = sceneFixture(Component);
  await f.render();
  f.flush();
  assert(f.api?.ready);
  const oldCanvas = f.elements.find((element) => element.tag === "canvas");
  oldCanvas.focus();
  assert.equal(f.document.activeElement, oldCanvas);
  f.failDraws = 1;
  await expectDrawFailure(() => f.redraw());
  assert.equal(f.api, null);
  assert.equal(oldCanvas.isConnected, false);
  assert.equal(f.document.activeElement, f.document.body);
  await f.render();
  const retryView = find(f.tree, (node) => node.type === "button");
  assert(retryView?.props.children.includes("重新加载"));
  // This hook recorder mounts ref-backed scene roots, not the complete JSX
  // tree. Supply a connected event target for the real rendered Retry handler;
  // native React commit, focus-visible classification and scroll stay browser
  // gates. The target never chooses or focuses the replacement canvas itself.
  const retry = f.document.createElement("button");
  const host = f.elements.find(
    (element) => element.className === "process-canvas",
  );
  host.append(retry);
  retry.addEventListener("click", retryView.props.onClick);
  return { f, oldCanvas, retry };
}

const directory = await mkdtemp(join(tmpdir(), "bioscape-process-shared-"));
try {
  const relationshipsFile = join(directory, "relationships.mjs");
  await build({
    entryPoints: ["src/exploration/relationships.js"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: relationshipsFile,
    logLevel: "silent",
  });
  ({ groupProcessStructures } = await import(pathToFileURL(relationshipsFile)));
  const playerPath = resolve("src/processes/ProcessExperience.jsx");
  const scenePath = resolve("src/processes/ProcessScene.jsx");
  await build({
    entryPoints: { scene: scenePath, player: playerPath },
    outdir: directory,
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
    plugins: [
      {
        name: "recording-shared-runtime",
        setup(builder) {
          builder.onLoad(
            { filter: /instanceBoundsCache\.js$/ },
            async ({ path }) => ({
              contents:
                (await readFile(path, "utf8")).replace(
                  "export function createInstanceBoundsCache(",
                  "function createActualInstanceBoundsCache(",
                ) +
                `
export function createInstanceBoundsCache(options) {
  const cache = createActualInstanceBoundsCache(options);
  const fixture = globalThis.__processSharedRuntime.current;
  (fixture.instanceBoundsCaches ??= []).push(cache);
  return cache;
}
`,
              loader: "js",
              resolveDir: resolve("src/processes"),
            }),
          );
          builder.onLoad(
            { filter: /framingPreparation\.js$/ },
            async ({ path }) => ({
              contents:
                (await readFile(path, "utf8")).replace(
                  "export function createProcessFramingPreparation(",
                  "function createActualProcessFramingPreparation(",
                ) +
                `
export function createProcessFramingPreparation(options) {
  const fixture = globalThis.__processSharedRuntime.current;
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
          builder.onLoad(
            { filter: /ProcessExperience\.jsx$/ },
            async ({ path }) => ({
              contents: `${await readFile(path, "utf8")}\nexport { ProcessPlayer };`,
              loader: "jsx",
              resolveDir: resolve("src/processes"),
            }),
          );
          builder.onResolve({ filter: /./ }, (args) => {
            if (args.kind === "entry-point") return;
            if (
              args.path === "react" ||
              args.path === "three" ||
              args.path.startsWith("three/addons/") ||
              args.path.endsWith("sceneCapture.js")
            )
              return { path: args.path, namespace: "mock" };
            if (
              args.importer === playerPath &&
              args.path !== "./playbackClock.js"
            )
              return { path: args.path, namespace: "mock" };
          });
          builder.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => {
            const host = "globalThis.__processSharedRuntime";
            if (path === "react")
              return {
                contents: [
                  ...[
                    "useId",
                    "useRef",
                    "useState",
                    "useEffect",
                    "useLayoutEffect",
                    "useMemo",
                    "useCallback",
                  ].map(
                    (key) =>
                      `export const ${key}=(...a)=>${host}.current.hooks.${key}(...a);`,
                  ),
                  `const createElement=(...a)=>${host}.current.hooks.createElement(...a); export const lazy=fn=>fn; export const Suspense=()=>null; export default {createElement,useCallback};`,
                ].join("\n"),
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
            if (path.endsWith("sceneCapture.js"))
              return {
                contents:
                  "export const applySceneView=()=>true,normalizeSceneView=v=>v,readSceneView=()=>({direction:[0,0,1],target:[0,0,0],zoom:1}),createSceneCapture=({getLabels})=>({dispose(){},captureFrame(){return getLabels();}});",
              };
            if (path === "lucide-react")
              return {
                contents: [
                  "Play",
                  "Pause",
                  "RotateCcw",
                  "Plus",
                  "Minus",
                  "ChevronLeft",
                  "ChevronRight",
                  "ArrowLeft",
                  "Tag",
                ]
                  .map((key) => `export const ${key}=()=>null;`)
                  .join("\n"),
              };
            const mocks = {
              "./catalog": "export const processCatalog={};",
              "../hierarchy": "export const getNode=id=>({name:id});",
              "../exploration/relationships.js": `export const groupProcessStructures=(...a)=>${host}.group(...a);`,
              "../exploration/conditionNotes.js": `export const getConditionNote=(...a)=>${host}.note(...a);`,
              "../exploration/processSession.js": `export const restoreProcessSession=(...a)=>${host}.restore(...a);`,
              "./loaders.js": "export const processLoaders={};",
            };
            return {
              contents:
                mocks[path] ??
                (path.endsWith(".css") ? "" : "export default ()=>null;"),
            };
          });
        },
      },
    ],
  });
  const { default: ProcessScene } = await import(
    pathToFileURL(join(directory, "scene.mjs"))
  );
  const { ProcessPlayer } = await import(
    pathToFileURL(join(directory, "player.mjs"))
  );

  await test("actual framing retires changed inputs and releases active and retired keys before ready or cancel", async () => {
    const f = sceneFixture(ProcessScene);
    f.onModelUpdate = () => {
      if (f.modelUpdates.length === 5)
        f.ownedGeometry.attributes.position.array[0] += 0.125;
    };
    await f.render();
    assert(f.api?.ready);
    const cache = f.instanceBoundsCaches.at(-1);
    assert(cache.statistics().totalRetirements > 0);
    assert.equal(cache.statistics().entries, 0);
    assert.equal(cache.statistics().retiredEntries, 0);
    assert.equal(cache.statistics().retainedBytes, 0);
    f.dispose();
    const cancelled = sceneFixture(ProcessScene);
    cancelled.onModelUpdate = () => {
      if (cancelled.modelUpdates.length === 5)
        cancelled.ownedGeometry.attributes.position.array[0] += 0.125;
      if (cancelled.modelUpdates.length === 6) cancelled.dispose();
    };
    await cancelled.render();
    assert.equal(cancelled.api, null);
    const interrupted = cancelled.instanceBoundsCaches.at(-1);
    assert(interrupted.statistics().totalRetirements > 0);
    assert.equal(interrupted.statistics().entries, 0);
    assert.equal(interrupted.statistics().retiredEntries, 0);
    assert.equal(interrupted.statistics().retainedBytes, 0);
  });

  await test("actual framing reuses instance and ordinary-mesh results and releases every snapshot before ready or cancellation", async () => {
    const f = sceneFixture(ProcessScene);
    await f.render();
    assert(f.api?.ready);
    const cache = f.instanceBoundsCaches.at(-1);
    assert.equal(cache.admissionStatistics().warmupSamples, 2);
    assert(cache.admissionStatistics().completedSamples > 2);
    assert(cache.statistics().hits > 0);
    assert(cache.statistics().meshHits > 0);
    assert.equal(cache.statistics().entries, 0);
    assert.equal(cache.statistics().retainedBytes, 0);
    f.dispose();
    assert.equal(cache.statistics().entries, 0);
    const cancelled = sceneFixture(ProcessScene);
    cancelled.onModelUpdate = () => {
      if (cancelled.modelUpdates.length === 3) cancelled.dispose();
    };
    await cancelled.render();
    assert.equal(cancelled.api, null);
    assert.equal(cancelled.instanceBoundsCaches.at(-1).statistics().entries, 0);
    assert.equal(
      cancelled.instanceBoundsCaches.at(-1).statistics().retainedBytes,
      0,
    );
    assert.equal(cancelled.pendingInitializations.size, 0);
  });

  await test("unmount before framing starts cancels its actual queued model work", async () => {
    const f = sceneFixture(ProcessScene);
    const pending = f.render();
    assert.equal(f.api, null);
    assert.equal(f.pendingInitializations.size, 1);
    assert.equal(f.environmentPreparations, 0);
    assert.equal(f.controls.at(-1).enabled, false);
    f.controls.at(-1).dispatchEvent({ type: "change" });
    assert.equal(
      f.jobs.size,
      0,
      "Orbit invalidation cannot queue an unfinished scene",
    );
    const loadingStatus = find(f.tree, (node) => node.props?.role === "status");
    assert(loadingStatus?.props.children.includes("正在准备模型…"));
    f.dispose();
    await pending;
    assert.equal(f.modelUpdates.length, 0);
    assert.equal(f.environmentPreparations, 0);
    assert.equal(f.environmentDisposals, 0);
    assert.equal(f.draws, 0);
    assert.equal(f.api, null);
    assert.equal(f.rendererDisposals, 1);
    assert.equal(f.pendingInitializations.size, 0);
    assert.equal(f.fonts.size, 0);
    assert.equal(f.jobs.size, 0);
    assert.deepEqual(f.disposed.sort(), [
      "geometry",
      "instance-0",
      "instance-1",
      "material",
      "texture",
    ]);
  });

  await test("cancellation during framing avoids the unused environment computation", async () => {
    const f = sceneFixture(ProcessScene);
    f.onModelUpdate = () => {
      assert.equal(f.environmentPreparations, 0);
      f.dispose();
    };
    await f.render();
    assert.equal(f.modelUpdates.length, 1);
    assert.equal(f.environmentPreparations, 0);
    assert.equal(f.environmentDisposals, 0);
    assert.equal(f.draws, 0);
    assert.equal(f.api, null);
    assert.equal(f.rendererDisposals, 1);
    assert.equal(f.pendingInitializations.size, 0);
    assert.equal(new Set(f.disposed).size, f.disposed.length);
    assert.equal(f.disposed.length, 5);
    f.dispose();
    assert.equal(f.rendererDisposals, 1);
  });

  await test("context loss during framing skips environment work until the actual retry succeeds", async () => {
    const f = sceneFixture(ProcessScene);
    f.onModelUpdate = () => {
      f.onModelUpdate = null;
      assert.equal(f.environmentPreparations, 0);
      f.elements
        .find((element) => element.tag === "canvas")
        .dispatchEvent({
          type: "webglcontextlost",
          preventDefault() {},
        });
    };
    await f.render();
    assert.equal(f.modelUpdates.length, 1);
    assert.equal(f.environmentPreparations, 0);
    assert.equal(f.draws, 0);
    assert.equal(f.api, null);
    await f.render();
    const retry = find(f.tree, (node) => node.type === "button");
    assert(retry?.props.children.includes("重新加载"));
    retry.props.onClick({ currentTarget: { matches: () => false } });
    await f.render();
    f.flush();
    assert(f.api?.ready);
    assert.equal(f.environmentPreparations, 1);
    assert.equal(f.environmentDisposals, 0);
    assert.equal(f.rendererDisposals, 1);
    f.dispose();
    assert.equal(f.environmentDisposals, 1);
    assert.equal(f.rendererDisposals, 2);
  });

  await test("navigation during framing retires the previous setup before publishing the new scene", async () => {
    const f = sceneFixture(ProcessScene);
    const old = f.render();
    const fresh = f.render({ rootId: "plant" });
    await Promise.all([old, fresh]);
    f.flush();
    assert(f.api?.ready);
    assert.equal(f.environmentPreparations, 1);
    assert.equal(f.rendererDisposals, 1);
    assert.equal(
      f.elements.filter(
        (element) => element.tag === "canvas" && element.isConnected,
      ).length,
      1,
    );
    assert.equal(f.pendingInitializations.size, 0);
    f.dispose();
    assert.equal(f.rendererDisposals, 2);
    assert.equal(f.environmentDisposals, 1);
    assert.equal(f.jobs.size, 0);
  });

  await test("the first ready scene restores progress and parameters changed during preparation", async () => {
    const f = sceneFixture(ProcessScene);
    f.onModelUpdate = () => assert.equal(f.environmentPreparations, 0);
    const pending = f.render();
    f.props.progressSource.current = 0.73;
    const latest = { calcium: "blocked" };
    const update = f.render({ parameters: latest });
    await Promise.all([pending, update]);
    f.flush();
    assert(f.api?.ready);
    assert.equal(f.api.getProgress(), 0.73);
    assert.equal(f.modelUpdates.at(-1).value, 0.73);
    assert.equal(f.modelUpdates.at(-1).parameters, latest);
    assert.equal(f.pendingInitializations.size, 0);
    assert.equal(f.environmentPreparations, 1);
    f.dispose();
    assert.equal(f.environmentDisposals, 1);
  });

  await test("recording DOM preserves focus only for connected visible nodes", async () => {
    const f = fixture(() => null, {});
    await f.render();
    const group = f.document.createElement("div");
    const first = f.document.createElement("button");
    const second = f.document.createElement("button");
    const outside = f.document.createElement("button");
    f.document.body.append(group, outside);
    group.append(second);
    group.prepend(first);
    group.className = "fixture process-catalog";
    second.classList.add("stage-control");
    assert.equal(first.tagName, "BUTTON");
    assert.equal(group.tagName, "DIV");
    group.tabIndex = 0;
    group.setAttribute("tabindex", "0");
    group.focus();
    assert.equal(f.document.activeElement, group);
    group.removeAttribute("tabindex");
    assert.equal(group.attributes.tabindex, undefined);
    outside.focus();
    group.focus();
    assert.equal(f.document.activeElement, outside);
    assert.equal(first.closest(".process-catalog"), group);
    assert.equal(group.closest(".process-catalog"), group);
    assert.equal(second.closest(".stage-control"), second);
    assert.equal(outside.closest(".process-catalog"), null);
    assert(group.contains(first));
    assert(group.contains(group));
    assert.equal(group.contains(outside), false);
    assert.equal(group.contains(null), false);
    assert.equal(first.nextElementSibling, second);
    assert.equal(second.previousElementSibling, first);
    assert.equal(first.previousElementSibling, null);
    assert.equal(second.nextElementSibling, null);
    first.focus();
    assert.equal(f.document.activeElement, first);
    assert(first.matches(":focus-visible"));
    assert.equal(second.matches(":focus-visible"), false);
    await f.render();
    assert.equal(globalThis.document, f.document);
    assert.equal(f.document.activeElement, first, "Rerender must retain focus");
    group.hidden = true;
    assert.equal(f.document.activeElement, f.document.body);
    first.focus();
    assert.equal(f.document.activeElement, f.document.body);
    group.hidden = false;
    first.focus();
    group.remove();
    assert.equal(first.isConnected, false);
    assert.equal(first.closest(".process-catalog"), group);
    first.focus();
    assert.equal(f.document.activeElement, f.document.body);
    f.document.body.append(group);
    first.focus();
    group.replaceChildren(second);
    assert.equal(first.parentElement, null);
    assert.equal(first.closest(".process-catalog"), null);
    assert.equal(f.document.activeElement, f.document.body);
    f.document.inputModality = "pointer";
    second.focus();
    assert.equal(f.document.activeElement, second);
    assert.equal(second.matches(":focus-visible"), false);
    outside.disabled = true;
    outside.focus();
    assert.equal(f.document.activeElement, second);
    f.dispose();
  });

  for (const route of ["next", "previous", "canvas"])
    await test(`hidden focused annotation moves to ${route} in DOM order`, async () => {
      const f = sceneFixture(ProcessScene);
      f.labels[2].active = route !== "canvas";
      if (route === "next")
        f.labels.push({
          text: {
            zh: "较低优先级的后续产物",
            en: "Later low-priority product",
          },
          position: [-1, -1, 0],
          priority: -1,
        });
      await f.render();
      f.flush();
      assert(f.api?.ready);
      const keys = f.elements.filter(
        (element) => element.className === "process-annotation-item",
      );
      const canvas = f.elements.find((element) => element.tag === "canvas");
      const index = route === "previous" ? 2 : 0;
      const target =
        route === "next" ? keys[2] : route === "previous" ? keys[0] : canvas;
      assert.equal(keys[1]._hidden, true, "Short notation is a skipped key");
      if (route === "next")
        assert.equal(
          keys[3]._hidden,
          false,
          "A priority-ordered walk would choose this other visible key",
        );
      keys[index].focus();
      assert.equal(f.document.activeElement, keys[index]);
      const before = f.document.focusHistory.length;
      f.labels[index].active = false;
      f.redraw();
      assert.equal(keys[index]._hidden, true);
      assert.equal(f.document.activeElement, target);
      assert(target.isConnected);
      assert.equal(target._hidden, false);
      assert.deepEqual(
        f.document.focusHistory.slice(before),
        [f.document.body, target],
        "The hidden setter loses focus before the component restores it",
      );
      const markers = f.elements.filter(
        (element) => element.className === "process-model-label",
      );
      assert.equal(markers[index].classes.has("highlighted"), false);
      if (target !== canvas)
        assert(markers[keys.indexOf(target)].classes.has("highlighted"));
      assert.equal(
        f.jobs.size,
        0,
        "Focus events must not schedule a render loop",
      );
      f.dispose();
    });

  await test("annotation updates retain external and still-visible key focus", async () => {
    const f = sceneFixture(ProcessScene);
    f.labels[2].active = true;
    await f.render();
    f.flush();
    const outside = f.document.createElement("button");
    f.document.body.append(outside);
    outside.focus();
    const before = f.document.focusHistory.length;
    const document = f.document;
    await f.render({ lang: "en" });
    f.flush();
    f.labels[0].active = false;
    f.redraw();
    assert.equal(f.document, document);
    assert.equal(globalThis.document, document);
    assert.equal(document.activeElement, outside);
    assert.equal(document.focusHistory.length, before);
    const keys = f.elements.filter(
      (element) => element.className === "process-annotation-item",
    );
    keys[2].focus();
    const beforeKey = document.focusHistory.length;
    f.labels[0].active = true;
    f.redraw();
    f.labels[0].active = false;
    f.redraw();
    assert.equal(document.activeElement, keys[2]);
    assert.equal(document.focusHistory.length, beforeKey);
    f.dispose();
  });

  for (const modality of ["keyboard", "pointer"])
    await test(`Retry handler follows the ${modality} focus-visible fixture state`, async () => {
      const { f, oldCanvas, retry } = await failedSceneFixture(ProcessScene);
      f.document.inputModality = modality;
      assert.equal(retry.matches(":focus-visible"), false);
      retry.focus();
      const restore = modality === "keyboard";
      assert.equal(retry.matches(":focus-visible"), restore);
      retry.dispatchEvent({ type: "click" });
      await f.render();
      f.flush();
      assert(f.api?.ready, "The real attempt effect must rebuild successfully");
      const newCanvas = f.elements.find(
        (element) => element.tag === "canvas" && element.isConnected,
      );
      assert(newCanvas);
      assert.notEqual(newCanvas, oldCanvas);
      assert.equal(oldCanvas.isConnected, false);
      assert.equal(f.rendererDisposals, 1);
      assert.equal(f.document.activeElement, restore ? newCanvas : retry);
      oldCanvas.focus();
      assert.equal(f.document.activeElement, restore ? newCanvas : retry);
      await f.render();
      assert.equal(
        find(f.tree, (node) => node.type === "button"),
        null,
      );
      // Simulate removal after the successful JSX update, without setting focus.
      retry.remove();
      assert.equal(
        f.document.activeElement,
        restore ? newCanvas : f.document.body,
      );
      const outside = f.document.createElement("button");
      f.document.body.append(outside);
      outside.focus();
      await f.render({ rootId: "plant" });
      f.flush();
      assert(f.api?.ready);
      assert.equal(newCanvas.isConnected, false);
      assert.equal(
        f.document.activeElement,
        outside,
        "Consumed retry intent must not focus a later rebuild",
      );
      f.dispose();
    });

  await test("a failed Retry cannot focus its removed canvas or pretend readiness", async () => {
    const { f, oldCanvas, retry } = await failedSceneFixture(ProcessScene);
    retry.focus();
    assert(retry.matches(":focus-visible"));
    f.failDraws = 1;
    await expectDrawFailure(async () => {
      retry.dispatchEvent({ type: "click" });
      await f.render();
      f.flush();
    });
    const failedCanvas = f.elements
      .filter((element) => element.tag === "canvas")
      .at(-1);
    assert.notEqual(failedCanvas, oldCanvas);
    assert.equal(failedCanvas.isConnected, false);
    assert.equal(f.api, null);
    assert.equal(f.rendererDisposals, 2);
    assert.equal(f.document.focusHistory.includes(failedCanvas), false);
    failedCanvas.focus();
    assert.equal(f.document.activeElement, retry);
    await f.render();
    assert(find(f.tree, (node) => node.type === "button"));
    retry.dispatchEvent({ type: "click" });
    await f.render();
    f.flush();
    assert(f.api?.ready);
    const newCanvas = f.elements.find(
      (element) => element.tag === "canvas" && element.isConnected,
    );
    assert(newCanvas);
    assert.notEqual(newCanvas, failedCanvas);
    assert.notEqual(newCanvas, oldCanvas);
    assert.equal(f.document.activeElement, newCanvas);
    f.dispose();
  });

  await test("visible annotations retain exact dynamic output while unchanged frames do no DOM work", async () => {
    const f = sceneFixture(ProcessScene);
    await f.render();
    f.flush();
    assert(f.api?.ready && f.draws > 0);
    const initial = f.snapshot();
    f.writes = f.reads = f.contentReads = f.projections = 0;
    for (let i = 0; i < 4; i++) f.redraw();
    assert.equal(
      f.projections,
      8,
      "Only the two active anchors project, on every frame",
    );
    assert.equal(f.writes, 0);
    assert.equal(f.reads, 0);
    assert.equal(f.contentReads, 0);
    assert.deepEqual(f.snapshot(), initial);

    f.labels[0].text.zh = "原位改变但仍用同一编号";
    f.redraw();
    let key = f.elements.find((e) => e.className === "process-annotation-item");
    assert.equal(key.children[1]._text, f.labels[0].text.zh);
    assert.equal(key.attributes["aria-label"], `1. ${f.labels[0].text.zh}`);
    f.labels[2].active = true;
    f.labels[0].active = false;
    f.redraw();
    const keys = f.elements.filter(
      (e) => e.className === "process-annotation-item",
    );
    assert.equal(keys[0]._hidden, true);
    assert.equal(
      keys[2].children[0]._text,
      "1",
      "Priority placement must not change source numbering",
    );
    const notation = f.elements.filter(
      (e) => e.className === "process-model-label",
    )[1];
    for (const [text, numbered] of [
      ["😀😀😀😀😀", false],
      ["😀😀😀😀😀😀", true],
      ["DNA", false],
      ["核", true],
    ]) {
      f.labels[1].text.zh = text;
      f.redraw();
      assert.equal(notation.classes.has("numbered"), numbered);
      assert.equal(notation._text, numbered ? "1" : text);
    }
    const beforeMove = f.snapshot();
    f.labels[2].position[0] = 1.3;
    f.redraw();
    assert.notDeepEqual(
      f.snapshot(),
      beforeMove,
      "Anchor mutations must move the leader immediately",
    );
    f.labels[2].position[0] = 10000;
    f.redraw();
    assert.equal(
      f.elements.filter((e) => e.className === "process-model-label")[2].style
        .visibility,
      "hidden",
    );
    f.labels[2].position[0] = 1.3;
    f.redraw();

    await f.render({ annotations: false });
    f.flush();
    f.writes = f.reads = f.projections = 0;
    f.labels[0].active = true;
    delete f.labels[0].text.en;
    f.labels[0].text.zh = "语言回退更新";
    f.labels[1].text.en = "Long changed label";
    f.viewport = { width: 390, height: 500 };
    f.fontScale = 1.4;
    await f.render({ lang: "en" });
    f.observers.forEach((fn) => fn());
    f.fonts.forEach((fn) => fn());
    f.flush();
    assert.equal(f.writes + f.reads + f.projections, 0);
    await f.render({ annotations: true });
    f.flush();
    assert.equal(f.reads, 6, "All three active labels measure after showing");
    const restored = f.snapshot();
    const fresh = sceneFixture(ProcessScene);
    fresh.labels.forEach((label, i) =>
      Object.assign(label, structuredClone(f.labels[i])),
    );
    fresh.viewport = { ...f.viewport };
    fresh.fontScale = f.fontScale;
    await fresh.render({ lang: "en" });
    fresh.flush();
    assert.deepEqual(
      fresh.snapshot(),
      restored,
      "Hide/change/show must match a fresh visible component",
    );
    fresh.dispose();
    await f.render();
    const measured = f.reads;
    f.fontScale = 1.6;
    f.fonts.forEach((fn) => fn());
    f.flush();
    assert.equal(
      f.reads,
      measured + 6,
      "Font invalidation must work even when prepared text is unchanged",
    );
    f.dispose();
    f.dispose();
    assert.equal(
      f.buffers.size,
      0,
      "InstancedMesh dispose must release real WebGLObjects attributes",
    );
    assert.equal(f.removed.length, 4);
    assert.deepEqual(f.disposed.sort(), [
      "geometry",
      "instance-0",
      "instance-1",
      "material",
      "texture",
    ]);
    assert.equal(f.rendererDisposals, 1);
    assert.equal(f.fonts.size, 0);
    assert.equal(f.jobs.size, 0);
  });

  await test("zoom and reset controls follow the actual scene readiness callback", async () => {
    const definition = {
      id: "pending-controls-fixture",
      duration: 30,
      sources: [],
      title: { zh: "准备中", en: "Preparing" },
      intro: { zh: "等待模型", en: "Wait for the model" },
      stages: [
        {
          at: 0,
          title: { zh: "开始", en: "Start" },
          description: { zh: "开始", en: "Start" },
        },
      ],
      controls: [],
    };
    const f = fixture(ProcessPlayer, {
      definition,
      rootId: "cell",
      lang: "zh",
    });
    await f.render();
    const checkButtons = (disabled) => {
      for (const label of ["放大", "缩小", "重置视角"]) {
        const button = find(
          f.tree,
          (node) =>
            node.type === "button" && node.props?.["aria-label"] === label,
        );
        assert(button);
        assert.equal(button.props.disabled, disabled);
      }
    };
    checkButtons(true);
    const scene = find(
      f.tree,
      (node) =>
        node.props?.definition?.id === definition.id &&
        typeof node.props?.onSceneReady === "function",
    );
    assert(scene);
    scene.props.onSceneReady({ ready: true, requestRender() {} });
    await f.render();
    checkButtons(false);
    scene.props.onSceneReady(null);
    await f.render();
    checkButtons(true);
    f.dispose();
  });

  await test("player memo preserves stage epsilon, random seek, language, condition and root context", async () => {
    const bi = (value) => ({ zh: value, en: value });
    const stages = [0, 0.15, 0.150005, 0.48, 0.9].map((at) => ({
      at,
      title: bi(String(at)),
      description: bi("Description"),
    }));
    const definition = {
      id: "motorTransport",
      title: bi("Transport"),
      intro: bi("Intro"),
      sources: [],
      duration: 24,
      stages,
      controls: [
        {
          id: "atp",
          label: bi("ATP"),
          default: "available",
          options: ["available", "depleted"].map((value) => ({
            value,
            label: bi(value),
          })),
        },
      ],
      contexts: { plant: { stages: [stages[0], stages[3]] } },
    };
    let f;
    f = fixture(ProcessPlayer, {
      definition,
      rootId: "cell",
      lang: "zh",
      onStateChange: (state) => {
        f.state = state;
      },
    });
    await f.render();
    const seek = async (value) => {
      find(
        f.tree,
        (node) => node.props?.id === "process-timeline",
      ).props.onChange({ target: { value: value * 1000 } });
      await f.render();
      const contextual = {
        ...definition,
        ...definition.contexts?.[f.props.rootId],
      };
      assert.deepEqual(
        f.related,
        groupProcessStructures(
          f.props.rootId,
          definition.id,
          contextual.stages,
          f.state.progress,
          f.state.parameters,
        ),
      );
      assert.deepEqual(
        f.note,
        getConditionNote(definition.id, f.state.parameters, f.props.lang),
      );
    };
    const noteCalls = f.noteCalls,
      relatedCalls = f.relatedCalls;
    for (let i = 1; i <= 100; i++) await seek(i / 10000);
    assert.equal(f.noteCalls, noteCalls);
    assert.equal(f.relatedCalls, relatedCalls);
    for (const value of [
      0.14998, 0.14999, 0.149995, 0.15, 0.150005, 0.7, 0.2, 1, 0, 0.47999, 0.48,
    ])
      await seek(value);
    await f.render({ lang: "en" });
    await seek(f.state.progress);
    assert.equal(f.noteCalls, noteCalls + 1);
    find(
      f.tree,
      (node) => node.type === "select" && node.props.value === "available",
    ).props.onChange({ target: { value: "depleted" } });
    await f.render();
    await seek(0.8);
    assert.equal(f.noteCalls, noteCalls + 2);
    await f.render({ rootId: "plant" });
    await seek(0.3);
    f.dispose();
  });
} finally {
  await rm(directory, { recursive: true, force: true });
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
