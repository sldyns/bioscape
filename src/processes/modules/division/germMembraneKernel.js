import { grid, tets, edges, triangles } from "./germMembraneTopology.js";
import { kernelData } from "./germMembraneKernel.generated.js";

const signature = JSON.stringify([grid, tets, edges, triangles]);
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
const modules = new WeakMap();
const rejectedApis = new WeakSet();
const records = new WeakMap();
const constructors = {
  f32: Float32Array,
  f64: Float64Array,
  i32: Int32Array,
  u32: Uint32Array,
};
const CANARY = 0x73c0a51e;
// Once-per-instance compatibility guard; no per-frame host calls.
const NORM_PROBES = [
  [0, 0, 0],
  [-0, 0, -0],
  [3, 4, 0],
  [1, 2, 3],
  [-0.25, 0.75, -1.125],
  [1, 2 ** -26, 2 ** -26],
  [Number.MIN_VALUE, Number.MIN_VALUE, 0],
  [1e-300, -2e-300, 3e-300],
  [1e300, -2e300, 3e300],
  [Number.MAX_VALUE, 1, 0],
  [Number.MAX_VALUE, Number.MAX_VALUE, 0],
  [Infinity, NaN, 1],
  [-Infinity, 1, NaN],
  [NaN, 1, 2],
  [1, NaN, 2],
  [1, 2, NaN],
];

// Construction failure selects the existing full-detail JavaScript algorithm.
// The arena is private and fixed in size; no memory growth or worker is used.
export function createGermMembraneKernel(options = {}) {
  const api = Object.prototype.hasOwnProperty.call(options, "webAssembly")
    ? options.webAssembly
    : typeof WebAssembly === "object"
      ? WebAssembly
      : null;
  if (
    !api ||
    typeof api.Module !== "function" ||
    typeof api.Instance !== "function" ||
    !littleEndian ||
    typeof atob !== "function"
  )
    return null;
  if (kernelData.abi !== 3 || kernelData.signature !== signature) return null;
  for (const name of ["nx", "ny", "nz", "capacity"]) {
    if (
      Object.prototype.hasOwnProperty.call(options, name) &&
      options[name] !== grid[name]
    )
      return null;
  }
  if (rejectedApis.has(api)) return null;
  try {
    let module = modules.get(api);
    if (!module) {
      const bytes = Uint8Array.from(atob(kernelData.wasmBase64), (c) =>
        c.charCodeAt(0),
      );
      module = new api.Module(bytes);
      modules.set(api, module);
    }
    const instance = new api.Instance(module, {});
    if (
      !NORM_PROBES.every((values) =>
        Object.is(instance.exports.norm3(...values), Math.hypot(...values)),
      )
    )
      throw Error("Membrane magnitude compatibility mismatch");
    const memory = instance.exports.memory;
    const buffer = memory.buffer;
    const layout = kernelData.layout;
    if (buffer.byteLength !== layout.byteLength)
      throw Error("Membrane kernel arena size mismatch");
    const view = (name) => {
      const segment = layout.segments[name];
      return new constructors[segment.type](
        buffer,
        segment.offset,
        segment.length,
      );
    };
    const guards = layout.guards.map(
      (g) => new Uint32Array(buffer, g.offset, g.words),
    );
    for (const guard of guards) guard.fill(CANARY);
    return {
      field: view("field"),
      gradients: view("gradients"),
      coordinates: view("coordinates"),
      activeCells: view("activeCells"),
      activeMin: view("activeMin"),
      activeMax: view("activeMax"),
      positions: [view("positions0"), view("positions1")],
      normals: [view("normals0"), view("normals1")],
      candidates: [view("candidates0"), view("candidates1")],
      edgeCache: view("edgeCache"),
      meta: view("meta"),
      bounds: view("bounds"),
      normalization: "local-compensated-3",
      norm3: (x, y, z) => instance.exports.norm3(x, y, z),
      extract: (level, activeCount, layer) =>
        instance.exports.extract(level, activeCount, layer),
      memoryBytes: buffer.byteLength,
      bufferStable: () => memory.buffer === buffer,
      guardsIntact: () =>
        guards.every((g) => g.every((value) => value === CANARY)),
    };
  } catch {
    rejectedApis.add(api);
    return null;
  }
}

// A WeakMap records the actual backend for regression tests without changing
// scene objects, scientific userData, geometry metadata or rendered pixels.
export function registerGermMembraneKernelGeometry(geometry, kernel) {
  records.set(geometry, kernel);
}

export function readGermMembraneKernelRecord(geometry) {
  if (!records.has(geometry)) return null;
  const kernel = records.get(geometry);
  return {
    backend: kernel ? "wasm" : "javascript",
    normalization: kernel?.normalization ?? "javascript",
    memoryBytes: kernel?.memoryBytes ?? 0,
    bufferStable: kernel?.bufferStable() ?? true,
    guardsIntact: kernel?.guardsIntact() ?? true,
  };
}
