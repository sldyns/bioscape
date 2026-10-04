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
    this.children = [];
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
    this.children.push(...children);
  }
  prepend(...children) {
    this.children.unshift(...children);
  }
  replaceChildren(...children) {
    this.children = children;
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
    this.context = runtime.current;
    this.domElement = new Element("canvas");
  }
  setPixelRatio() {}
  setClearColor() {}
  setSize() {}
  dispose() {
    this.context.rendererDisposals++;
  }
  render(scene, camera) {
    camera.updateMatrixWorld();
    this.context.draws++;
    scene.traverse((object) => {
      if (object.isInstancedMesh) this.context.gpu.update(object);
    });
  }
}

class Controls {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
  }
  update() {
    this.camera.lookAt(this.target);
  }
  saveState() {}
  addEventListener() {}
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
      return { texture: new THREE.Texture(), dispose() {} };
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
    index: 0,
    writes: 0,
    reads: 0,
    contentReads: 0,
    projections: 0,
    draws: 0,
    rendererDisposals: 0,
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
  };
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
      if (props?.ref && !props.ref.current)
        props.ref.current = new Element(type);
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
    globalThis.document = {
      createElement: (tag) => new Element(tag),
      createElementNS: (_, tag) => new Element(tag),
      addEventListener() {},
      removeEventListener() {},
      fonts: {
        addEventListener: (_, fn) => f.fonts.add(fn),
        removeEventListener: (_, fn) => f.fonts.delete(fn),
      },
    };
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
    f.tree = Component(f.props);
    f.effects.forEach((effect) => effect());
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
        update() {},
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
                    "useRef",
                    "useState",
                    "useEffect",
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

  await test("visible annotations retain exact dynamic output while unchanged frames do no DOM work", () => {
    const f = sceneFixture(ProcessScene);
    f.render();
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

    f.render({ annotations: false });
    f.flush();
    f.writes = f.reads = f.projections = 0;
    f.labels[0].active = true;
    delete f.labels[0].text.en;
    f.labels[0].text.zh = "语言回退更新";
    f.labels[1].text.en = "Long changed label";
    f.viewport = { width: 390, height: 500 };
    f.fontScale = 1.4;
    f.render({ lang: "en" });
    f.observers.forEach((fn) => fn());
    f.fonts.forEach((fn) => fn());
    f.flush();
    assert.equal(f.writes + f.reads + f.projections, 0);
    f.render({ annotations: true });
    f.flush();
    assert.equal(f.reads, 6, "All three active labels measure after showing");
    const restored = f.snapshot();
    const fresh = sceneFixture(ProcessScene);
    fresh.labels.forEach((label, i) =>
      Object.assign(label, structuredClone(f.labels[i])),
    );
    fresh.viewport = { ...f.viewport };
    fresh.fontScale = f.fontScale;
    fresh.render({ lang: "en" });
    fresh.flush();
    assert.deepEqual(
      fresh.snapshot(),
      restored,
      "Hide/change/show must match a fresh visible component",
    );
    fresh.dispose();
    f.render();
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

  await test("player memo preserves stage epsilon, random seek, language, condition and root context", () => {
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
    f.render();
    const seek = (value) => {
      find(
        f.tree,
        (node) => node.props?.id === "process-timeline",
      ).props.onChange({ target: { value: value * 1000 } });
      f.render();
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
    for (let i = 1; i <= 100; i++) seek(i / 10000);
    assert.equal(f.noteCalls, noteCalls);
    assert.equal(f.relatedCalls, relatedCalls);
    for (const value of [
      0.14998, 0.14999, 0.149995, 0.15, 0.150005, 0.7, 0.2, 1, 0, 0.47999, 0.48,
    ])
      seek(value);
    f.render({ lang: "en" });
    seek(f.state.progress);
    assert.equal(f.noteCalls, noteCalls + 1);
    find(
      f.tree,
      (node) => node.type === "select" && node.props.value === "available",
    ).props.onChange({ target: { value: "depleted" } });
    f.render();
    seek(0.8);
    assert.equal(f.noteCalls, noteCalls + 2);
    f.render({ rootId: "plant" });
    seek(0.3);
    f.dispose();
  });
} finally {
  await rm(directory, { recursive: true, force: true });
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
