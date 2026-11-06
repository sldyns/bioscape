import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

// Run the actual App/HomeRouter component bodies and effects across a change
// between render and commit. UI children and browser adapters are inert; route,
// history, snapshot and navigation logic are the production implementations.
const directory = await mkdtemp(join(tmpdir(), "bioscape-startup-navigation-"));
const host = "globalThis.__startupNavigationHarness";
const componentNames = new Set([
  "StudioLoading",
  "AboutModel",
  "ProcessDirectory",
  "ProcessRenderingHost",
  "CellScene",
  "ProcessExperience",
  "CompareWorkspace",
  "Studio",
  "SceneActions",
  "ViewerHeading",
  "ShareDialog",
  "HomePage",
]);
const globals = [
  "window",
  "document",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "matchMedia",
  "setTimeout",
  "clearTimeout",
  "__startupNavigationHarness",
];

function fixture(Component, initialHash, api) {
  const originals = new Map(
    globals.map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const f = {
    slots: [],
    effects: [],
    index: 0,
    dirty: false,
    tree: null,
    timers: new Map(),
    nextTimer: 0,
    listeners: new Map(),
    replacements: [],
  };
  const storage = () => {
    const values = new Map();
    return {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, String(v)),
      removeItem: (k) => values.delete(k),
    };
  };
  f.location = new URL("https://bioscape.test/" + initialHash);
  f.setLocation = (hash, state = null) => {
    f.location.href = new URL(hash, f.location.href).href;
    f.history.state = state;
  };
  f.history = {
    state: null,
    replaceState(state, _title, hash) {
      f.replacements.push(hash);
      f.setLocation(hash, state);
    },
    pushState(state, _title, hash) {
      f.setLocation(hash, state);
    },
  };
  const add = (type, fn) => {
    if (!f.listeners.has(type)) f.listeners.set(type, new Set());
    f.listeners.get(type).add(fn);
  };
  const remove = (type, fn) => f.listeners.get(type)?.delete(fn);
  const document = {
    hidden: false,
    documentElement: { lang: "" },
    title: "",
    activeElement: { matches: () => false, closest: () => null, focus() {} },
    addEventListener() {},
    removeEventListener() {},
  };
  const browser = {
    location: f.location,
    history: f.history,
    localStorage: storage(),
    sessionStorage: storage(),
    addEventListener: add,
    removeEventListener: remove,
    scrollTo() {},
    matchMedia: () => ({ matches: false }),
  };
  const values = {
    window: browser,
    document,
    location: f.location,
    history: f.history,
    localStorage: browser.localStorage,
    sessionStorage: browser.sessionStorage,
    matchMedia: browser.matchMedia,
    setTimeout: (fn) => {
      const id = ++f.nextTimer;
      f.timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => f.timers.delete(id),
    __startupNavigationHarness: { current: f },
  };
  for (const [key, value] of Object.entries(values))
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  const changed = (slot, deps) =>
    !slot.dependencies ||
    !deps ||
    deps.some((v, i) => !Object.is(v, slot.dependencies[i]));
  const memo = (fn, deps) => {
    const slot = (f.slots[f.index++] ??= {});
    if (changed(slot, deps)) {
      slot.dependencies = deps ? [...deps] : undefined;
      slot.value = fn();
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
        (v) => {
          const next = typeof v === "function" ? v(slot.value) : v;
          if (!Object.is(next, slot.value)) {
            slot.value = next;
            f.dirty = true;
          }
        },
      ];
    },
    useMemo: memo,
    useCallback: (fn, deps) => memo(() => fn, deps),
    useLayoutEffect(fn, deps) {
      f.hooks.useEffect(fn, deps);
    },
    useEffect(fn, deps) {
      const slot = (f.slots[f.index++] ??= {});
      if (changed(slot, deps))
        f.effects.push(() => {
          slot.cleanup?.();
          slot.dependencies = deps ? [...deps] : undefined;
          slot.cleanup = fn();
        });
    },
    createElement: (type, props, ...children) => ({
      type,
      props: { ...props, children },
    }),
  };
  f.props =
    Component === api.App
      ? {
          historySession: api.createSceneHistorySession(),
          onHome() {},
          onSceneLeave() {},
        }
      : {};
  f.render = () => {
    f.index = 0;
    f.dirty = false;
    f.tree = Component(f.props);
  };
  f.commit = () => {
    let iterations = 0;
    while (f.effects.length || f.dirty) {
      assert.ok(++iterations < 20, "startup must converge");
      if (f.dirty) f.render();
      const batch = f.effects.splice(0);
      batch.forEach((fn) => fn());
    }
  };
  f.dispatch = (type) => {
    for (const fn of [...(f.listeners.get(type) || [])])
      fn({ type, preventDefault() {} });
  };
  f.nodes = () => {
    const out = [];
    const visit = (node) => {
      if (Array.isArray(node)) node.forEach(visit);
      else if (typeof node === "function") visit(node({}));
      else if (node && typeof node === "object" && node.props) {
        out.push(node);
        visit(node.props.children);
      }
    };
    visit(f.tree);
    return out;
  };
  f.process = () =>
    f
      .nodes()
      .find(
        (node) => node.props.rootId && Object.hasOwn(node.props, "processId"),
      );
  f.dispose = () => {
    for (const slot of f.slots) slot?.cleanup?.();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  };
  f.render();
  return f;
}

try {
  const outfile = join(directory, "components.mjs");
  await build({
    stdin: {
      contents:
        "export {default as App} from './src/App.jsx'; export {default as HomeRouter} from './src/home/HomeRouter.jsx'; export {sceneHash,readSceneState} from './src/exploration/state.js'; export {parsePath,parseProcess,parseExperience} from './src/navigation.js'; export {createSceneHistorySession} from './src/exploration/historySession.js';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
    loader: { ".css": "empty" },
    plugins: [
      {
        name: "startup-browser-adapters",
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (args.path === "react" || args.path === "lucide-react")
              return { path: args.path, namespace: "adapter" };
            const name = basename(args.path).replace(/\.(jsx|js)$/, "");
            if (componentNames.has(name))
              return { path: name, namespace: "adapter" };
          });
          builder.onLoad({ filter: /.*/, namespace: "adapter" }, ({ path }) => {
            if (path === "react")
              return {
                contents: [
                  ...[
                    "useRef",
                    "useState",
                    "useEffect",
                    "useLayoutEffect",
                    "useMemo",
                    "useCallback",
                  ].map(
                    (name) =>
                      `export const ${name}=(...args)=>${host}.current.hooks.${name}(...args);`,
                  ),
                  `const createElement=(...args)=>${host}.current.hooks.createElement(...args); export const lazy=loader=>({loader}); export const Suspense='Suspense'; export default {createElement,Fragment:'Fragment'};`,
                ].join("\n"),
              };
            if (path === "lucide-react")
              return {
                contents:
                  "export const ArrowLeft='ArrowLeft',ChevronRight='ChevronRight',Info='Info',Minus='Minus',Plus='Plus',RotateCcw='RotateCcw',Tag='Tag',Rotate3D='Rotate3D';",
              };
            return {
              contents: `function Component(){} Component.stubName=${JSON.stringify(path)}; export default Component;`,
            };
          });
        },
      },
    ],
  });
  const api = await import(pathToFileURL(outfile));
  const stateA = {
    lang: "zh",
    process: {
      progress: 0.98,
      speed: 1,
      parameters: { calcium: "blocked" },
      annotations: true,
    },
  };
  const stateB = {
    lang: "en",
    process: {
      progress: 0.7,
      speed: 0.5,
      parameters: { stimulus: "on" },
      annotations: false,
    },
  };
  const a = api.sceneHash("#/neuron?view=process&process=synapse", stateA);
  const b = api.sceneHash(
    "#/neuron?view=process&process=actionPotential",
    stateB,
  );
  const targets = [
    ["different process", b],
    [
      "same process with different controls",
      api.sceneHash("#/neuron?view=process&process=synapse", {
        lang: "en",
        process: {
          progress: 0.23,
          speed: 1.5,
          parameters: { calcium: "available" },
          annotations: false,
        },
      }),
    ],
    [
      "different root",
      api.sceneHash("#/plant?view=process&process=photosynthesis", {
        lang: "en",
        process: { progress: 0.4, parameters: { light: "dark" } },
      }),
    ],
    [
      "process directory",
      api.sceneHash("#/neuron?view=process", { lang: "en" }),
    ],
    [
      "structure",
      api.sceneHash("#/bacterium", { lang: "en", mode: "whole", labels: true }),
    ],
    [
      "comparison",
      api.sceneHash("#/cell", {
        lang: "en",
        compare: { left: { id: "cell" }, right: { id: "plant" } },
      }),
    ],
    ["plain scene link", "#/plant?view=process&process=photosynthesis"],
  ];
  const assertTarget = (f, target) => {
    const expected = api.readSceneState(target),
      id = api.parseProcess(target);
    assert.equal(
      api.parseProcess(f.location.hash),
      id,
      "URL must retain the requested process",
    );
    if (api.parseExperience(target) === "process") {
      const process = f.process();
      assert.ok(process, "requested process/directory must render");
      assert.equal(
        process.props.processId,
        id,
        "rendered process must follow the latest URL",
      );
      assert.equal(process.props.rootId, api.parsePath(target)[0]);
      if (expected) assert.equal(process.props.lang, expected.lang);
      if (expected?.process && id) {
        for (const key of ["progress", "speed", "parameters", "annotations"])
          assert.deepEqual(
            process.props.initialState[key],
            expected.process[key],
            `${key} must belong to the destination`,
          );
      } else if (id)
        assert.equal(
          process.props.initialState.progress ?? 0,
          0,
          "a plain new scene link must not inherit the old process progress",
        );
    } else {
      assert.equal(f.process(), undefined);
      assert.ok(
        f
          .nodes()
          .some((node) =>
            expected?.compare
              ? node.props.initialState?.left && node.props.initialState?.right
              : node.props.className === "anatomy-workspace",
          ),
      );
    }
    if (expected)
      assert.equal(
        api.readSceneState(f.location.hash)?.lang,
        expected.lang,
        "do not write the old snapshot into the new URL",
      );
  };
  for (const [name, target] of targets)
    await test(`startup reconciles ${name} changed before listeners attach`, () => {
      const f = fixture(api.App, a, api);
      try {
        f.setLocation(target);
        f.commit();
        assertTarget(f, target);
        const key = f.process()?.props.key;
        f.dispatch("popstate");
        f.dispatch("hashchange");
        f.commit();
        assertTarget(f, target);
        assert.equal(
          f.process()?.props.key,
          key,
          "duplicate native events do not remount the destination",
        );
      } finally {
        f.dispose();
      }
    });
  await test("unchanged startup and native Back/Forward preserve distinct process sessions", () => {
    const f = fixture(api.App, a, api);
    try {
      f.commit();
      assertTarget(f, a);
      const savedA = { hash: f.location.hash, state: f.history.state };
      f.setLocation(b);
      f.dispatch("hashchange");
      f.commit();
      assertTarget(f, b);
      f.process().props.onStateChange(
        { ...stateB.process, progress: 0.42 },
        { immediate: true },
      );
      const savedB = { hash: f.location.hash, state: f.history.state };
      f.setLocation(savedA.hash, savedA.state);
      f.dispatch("popstate");
      f.dispatch("hashchange");
      f.commit();
      assertTarget(f, a);
      f.setLocation(savedB.hash, savedB.state);
      f.dispatch("popstate");
      f.dispatch("hashchange");
      f.commit();
      assert.equal(f.process().props.processId, "actionPotential");
      assert.equal(f.process().props.initialState.progress, 0.42);
      assert.equal(f.process().props.lang, "en");
    } finally {
      f.dispose();
    }
  });
  for (const [initial, target, expectedHome] of [
    [a, "#/", true],
    ["#/", b, false],
  ])
    await test(`HomeRouter reconciles a pre-listener change to ${expectedHome ? "home" : "scene"}`, () => {
      const f = fixture(api.HomeRouter, initial, api);
      try {
        f.setLocation(target);
        f.commit();
        assert.equal(f.tree.type?.stubName === "HomePage", expectedHome);
        assert.equal(f.location.hash, target);
      } finally {
        f.dispose();
      }
    });
} finally {
  await rm(directory, { recursive: true, force: true });
}
