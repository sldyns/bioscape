import assert from "node:assert/strict";
import fs from "node:fs";
import { generateKernelSource } from "../scripts/generate-germ-membrane-kernel.mjs";
import { kernelData } from "../src/processes/modules/division/germMembraneKernel.generated.js";
import { createGermMembraneKernel } from "../src/processes/modules/division/germMembraneKernel.js";

const generated = await generateKernelSource();
assert.equal(WebAssembly.validate(generated.kernel.bytes), true);
assert.deepEqual(
  Buffer.from(kernelData.wasmBase64, "base64"),
  Buffer.from(generated.kernel.bytes),
);
assert.equal(
  fs.readFileSync(
    new URL(
      "../src/processes/modules/division/germMembraneKernel.generated.js",
      import.meta.url,
    ),
    "utf8",
  ),
  generated.source,
);
assert.deepEqual(
  WebAssembly.Module.imports(new WebAssembly.Module(generated.kernel.bytes)),
  [],
);
assert.equal(createGermMembraneKernel({ webAssembly: null }), null);
assert.equal(createGermMembraneKernel({ nx: 63 }), null);
assert.equal(
  createGermMembraneKernel({
    webAssembly: {
      Module() {
        throw Error("simulated blocked compilation");
      },
      Instance() {},
    },
  }),
  null,
);

const kernel = createGermMembraneKernel();
assert(
  kernel,
  "The supported default API must actually create a WebAssembly backend",
);
assert.equal(kernel.memoryBytes, kernelData.layout.byteLength);
assert.equal(kernel.bufferStable(), true);
assert.equal(kernel.guardsIntact(), true);
const arrays = [
  kernel.field,
  kernel.gradients,
  kernel.coordinates,
  ...kernel.positions,
  ...kernel.normals,
  ...kernel.candidates,
];
assert(arrays.every((a) => a.buffer === kernel.field.buffer));
assert(arrays.every((a) => a.byteOffset % a.BYTES_PER_ELEMENT === 0));
const run = (level, count, layer) => {
  kernel.edgeCache.fill(0);
  return kernel.extract(level, count, layer);
};
assert.equal(run(0, 0, 0), 0);
assert.deepEqual([...kernel.meta], [0, 0]);
assert.deepEqual(
  [...kernel.bounds],
  [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity],
);

// One crossed cube gives six tetrahedra, eighteen output vertices and seven
// first-occurrence grid edges. It also exercises the norm-zero fallback.
kernel.field.fill(1);
kernel.field[0] = -1;
kernel.activeCells[0] = 0;
kernel.activeMin[0] = -1;
kernel.activeMax[0] = 1;
assert.equal(run(0, 1, 0), 54);
assert.deepEqual([...kernel.meta], [54, 7]);
assert(kernel.normals[0].subarray(0, 54).every((v) => v === 0));
assert.deepEqual([...kernel.bounds], [0, 0, 0, 0, 0, 0]);
for (let i = 0; i < kernel.gradients.length; i += 3)
  kernel.gradients.set([3, 4, 0], i);
assert.equal(run(0, 1, 1), 54);
assert.equal(kernel.normals[1][0], Math.fround(0.6));
assert.equal(kernel.normals[1][1], Math.fround(0.8));
assert.equal(kernel.normals[1][2], 0);
assert.equal(kernel.guardsIntact(), true);
assert.equal(kernel.bufferStable(), true);
console.log(
  "Division membrane kernel: deterministic module, bounded arena, norm and fallback checks passed",
);

// A wide deterministic binary-exponent distribution exercises scaled magnitude
// and compensated rounding, including subnormal, overflow and nonfinite inputs.
const special = [
  [0, 0, 0],
  [-0, 0, -0],
  [3, 4, 0],
  [1, 2, 3],
  [-1, -2, -3],
  [1, 2 ** -26, 2 ** -26],
  [Number.MIN_VALUE, 0, 0],
  [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE],
  [1e-300, 2e-300, -3e-300],
  [1e300, 2e300, -3e300],
  [Number.MAX_VALUE, 1, 0],
  [Number.MAX_VALUE, Number.MAX_VALUE, 0],
  [Infinity, NaN, 1],
  [-Infinity, 1, NaN],
  [NaN, 1, 2],
  [1, NaN, 2],
  [1, 2, NaN],
  [Infinity, Infinity, Infinity],
  [0, Number.MIN_VALUE, 0],
  [0, 0, Number.MIN_VALUE],
  [2 ** -500, 2 ** 500, 1],
  [2 ** 500, 1, 2 ** -500],
  [0.1, 0.2, 0.3],
  [-0.1, -0.2, -0.3],
  [1, 1, 1],
  [1, 2 ** -27, 2 ** -27],
  [2 ** -1022, 2 ** -1022, 2 ** -1022],
  [2 ** 1023, 2 ** -1074, 0],
  [0.9999999999999999, 1.0000000000000002, 1],
  [1e-100, 1e100, 1e-20],
  [1e100, 1e-20, 1e-100],
  [1e-20, 1e-100, 1e100],
];
let checked = 0;
function compareMagnitude(values) {
  const expected = Math.hypot(...values),
    actual = kernel.norm3(...values);
  assert(
    Object.is(actual, expected),
    `norm3 exact-double mismatch at vector${checked}: ${values.join(",")} expected${expected} actual${actual}`,
  );
  checked++;
}
special.forEach(compareMagnitude);
let seed = 0x76c0a51e;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (let j = 0; j < 100000; j++) {
  const values = Array.from({ length: 3 }, () => {
    const exponent = Math.floor(random() * 2098) - 1074;
    return (random() < 0.5 ? -1 : 1) * (1 + random()) * 2 ** exponent;
  });
  compareMagnitude(values);
}
assert.equal(checked, 100032);
assert.equal(kernel.normalization, "local-compensated-3");
assert.equal(kernel.guardsIntact(), true);
assert.equal(kernel.bufferStable(), true);
console.log(
  "Local compensated norm:100032 exact-double Math.hypot comparisons PASS; WebAssembly imports0",
);
