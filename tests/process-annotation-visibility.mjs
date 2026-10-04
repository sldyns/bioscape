import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";

// Run the real component/effects with a recording DOM and renderer. This checks
// scheduling and layout access without a browser, GPU or timing assumptions.
const runtime = { current: null };
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
    this.children.push(...items);
  }
  prepend(...items) {
    this.children.unshift(...items);
  }
  replaceChildren(...items) {
    this.children = items;
  }
  setAttribute(key, value) {
    this.context.writes++;
    this.attributes[key] = String(value);
  }
  addEventListener() {}
  removeEventListener() {}
  remove() {}
  getBoundingClientRect() {
    return this.context.viewport;
  }
}
class Renderer {
  constructor() {
    this.domElement = new Element("canvas");
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
class Controls {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
  }
  update() {
    this.camera.lookAt(this.target);
    return false;
  }
  saveState() {}
  addEventListener() {}
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

function fixture(Component, annotations = false) {
  const context = {
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
    fonts: new Set(),
    observers: [],
    progress: { current: 0 },
    updates: [],
    api: null,
  };
  runtime.current = context;
  context.hooks = {
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
      return {
        group,
        labels,
        camera: { position: [0, 1, 8], target: [0, 0, 0] },
        update(progress) {
          context.updates.push(progress);
          mesh.position.x = progress;
          labels[0].active = progress < 0.5;
          labels[2].active = progress >= 0.5;
          labels[2].position[0] = 1 + progress;
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
    Component(context.props);
    context.effects.forEach((effect) => effect());
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
                contents: `export const useRef=(...a)=>${host}.current.hooks.useRef(...a); export const useState=(...a)=>${host}.current.hooks.useState(...a); export const useEffect=(...a)=>${host}.current.hooks.useEffect(...a); export default {createElement:(...a)=>${host}.current.hooks.createElement(...a)};`,
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
  await test("hidden process annotations do no layout work and resume the latest pose", () => {
    const f = fixture(ProcessScene);
    f.render();
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
    f.render({ lang: "en" });
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
    f.render({ annotations: true });
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
    f.render({ annotations: false });
    f.flush();
    const hiddenReads = f.reads;
    f.fontScale = 1.4;
    f.fonts.forEach((fn) => fn());
    f.render({ lang: "zh" });
    f.flush();
    assert.equal(f.reads, hiddenReads);
    f.render({ annotations: true });
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
    visible.render();
    visible.flush();
    assert.deepEqual(visible.snapshot(), expected);
    visible.dispose();
  });
} finally {
  await rm(directory, { recursive: true, force: true });
  for (const [key, descriptor] of globals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
