// A deterministic emitter for one private scalar kernel. No external compiler.
// Binary encoding: https://webassembly.github.io/spec/core/binary/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import * as prettier from "prettier";
import {
  grid,
  tets,
  edges,
  triangles,
} from "../src/processes/modules/division/germMembraneTopology.js";

const HERE = fileURLToPath(import.meta.url);
const OUTPUT = fileURLToPath(
  new URL(
    "../src/processes/modules/division/germMembraneKernel.generated.js",
    import.meta.url,
  ),
);
const TYPE = { i32: 0x7f, f64: 0x7c };
const OP = {
  "i32.eqz": 0x45,
  "i32.eq": 0x46,
  "i32.ne": 0x47,
  "i32.lt_u": 0x49,
  "i32.gt_u": 0x4b,
  "i32.ge_s": 0x4e,
  "i32.ge_u": 0x4f,
  "i32.add": 0x6a,
  "i32.sub": 0x6b,
  "i32.mul": 0x6c,
  "i32.div_u": 0x6e,
  "i32.or": 0x72,
  "f64.eq": 0x61,
  "f64.ne": 0x62,
  "f64.lt": 0x63,
  "f64.gt": 0x64,
  "f64.abs": 0x99,
  "f64.sqrt": 0x9f,
  "f64.add": 0xa0,
  "f64.sub": 0xa1,
  "f64.mul": 0xa2,
  "f64.div": 0xa3,
  "f64.min": 0xa4,
  "f64.max": 0xa5,
  "f32.demote_f64": 0xb6,
  "f64.promote_f32": 0xbb,
};
const MEMORY = {
  i32: { bytes: 4, align: 2, load: 0x28, store: 0x36 },
  u32: { bytes: 4, align: 2, load: 0x28, store: 0x36 },
  u16: { bytes: 2, align: 1, load: 0x2f },
  u8: { bytes: 1, align: 0, load: 0x2d },
  f32: { bytes: 4, align: 2, load: 0x2a, store: 0x38 },
  f64: { bytes: 8, align: 3, load: 0x2b, store: 0x39 },
};
const flat = (...v) => v.flat(Infinity);
function uleb(value) {
  const a = [];
  do {
    const b = value & 0x7f;
    value >>>= 7;
    a.push(b | (value ? 0x80 : 0));
  } while (value);
  return a;
}
function sleb(value) {
  const a = [];
  for (;;) {
    const b = value & 0x7f;
    value >>= 7;
    const done = (value === 0 && !(b & 0x40)) || (value === -1 && b & 0x40);
    a.push(b | (done ? 0 : 0x80));
    if (done) return a;
  }
}
const vector = (values) => flat(uleb(values.length), values);
const text = (value) => {
  const b = [...Buffer.from(value)];
  return flat(uleb(b.length), b);
};
const section = (id, bytes) => flat(id, uleb(bytes.length), bytes);
const i = (n) => flat(0x41, sleb(n));
const d = (n) => {
  const b = Buffer.alloc(8);
  b.writeDoubleLE(n);
  return flat(0x44, [...b]);
};
const op = (name, ...args) => {
  if (!(name in OP)) throw Error("Unknown private opcode: " + name);
  return flat(args, OP[name]);
};
const select = (a, b, condition) => flat(a, b, condition, 0x1b);
const add = (a, b) => op("i32.add", a, b);
const mul = (a, b) => op("i32.mul", a, b);
const plus = (a, n) => (n ? add(a, i(n)) : a);

function allocate() {
  const { nx, ny, nz, capacity } = grid;
  const row = nx + 1,
    plane = row * (ny + 1),
    count = plane * (nz + 1);
  const corner = [
    0,
    1,
    row + 1,
    row,
    plane,
    plane + 1,
    plane + row + 1,
    plane + row,
  ];
  const segments = {},
    guards = [],
    data = [];
  let cursor = 0;
  function take(name, type, length, values) {
    cursor = Math.ceil(cursor / 8) * 8;
    const segment = {
      type,
      length,
      offset: cursor,
      bytes: MEMORY[type].bytes * length,
    };
    segments[name] = segment;
    if (values) {
      const b = Buffer.alloc(segment.bytes);
      values.forEach((v, j) => {
        if (type === "u8") b.writeUInt8(v, j);
        else if (type === "u16") b.writeUInt16LE(v, j * 2);
        else b.writeInt32LE(v, j * 4);
      });
      data.push({ offset: cursor, bytes: b });
    }
    cursor += segment.bytes;
    cursor = Math.ceil(cursor / 4) * 4;
    guards.push({ offset: cursor, words: 4 });
    cursor += 16;
    return segment;
  }
  const triData = triangles.flat(),
    cross = triangles.map((v) => [...new Set(v)]),
    crossData = cross.flat();
  const offsets = (lists) => {
    let n = 0;
    return lists.map((v) => {
      const start = n;
      n += v.length;
      return start;
    });
  };
  take(
    "tetOffsets",
    "i32",
    24,
    tets.flatMap((tet) => tet.map((c) => corner[c])),
  );
  take("edges", "u8", 12, edges.flat());
  take(
    "triCounts",
    "u8",
    16,
    triangles.map((v) => v.length),
  );
  take("triOffsets", "u16", 16, offsets(triangles));
  take("triData", "u8", triData.length, triData);
  take(
    "crossCounts",
    "u8",
    16,
    cross.map((v) => v.length),
  );
  take("crossOffsets", "u16", 16, offsets(cross));
  take("crossData", "u8", crossData.length, crossData);
  const kinds = new Uint8Array(plane + row + 2);
  [1, row, plane, row + 1, plane + 1, plane + row, plane + row + 1].forEach(
    (offset, kind) => {
      kinds[offset] = kind;
    },
  );
  take("edgeKinds", "u8", kinds.length, [...kinds]);
  take("field", "f32", count);
  take("gradients", "f32", count * 3);
  take("coordinates", "f32", count * 3);
  take("activeCells", "i32", nx * ny * nz);
  take("activeMin", "f32", nx * ny * nz);
  take("activeMax", "f32", nx * ny * nz);
  for (const layer of [0, 1]) {
    take("positions" + layer, "f32", capacity * 3);
    take("normals" + layer, "f32", capacity * 3);
    take("candidates" + layer, "u32", capacity);
  }
  take("edgeCache", "i32", count * 7);
  take("ids", "i32", 4);
  take("values", "f64", 4);
  take("edgeKeys", "i32", 6);
  take("ep", "f64", 18);
  take("en", "f64", 18);
  take("meta", "i32", 2);
  take("bounds", "f64", 6);
  const pages = Math.ceil(cursor / 65536),
    initial = Buffer.alloc(
      Math.max(...data.map((v) => v.offset + v.bytes.length)),
    );
  for (const part of data) part.bytes.copy(initial, part.offset);
  return {
    layout: {
      abi: 3,
      row,
      plane,
      count,
      capacity,
      pages,
      byteLength: pages * 65536,
      segments,
      guards,
    },
    initial,
  };
}

class FunctionBody {
  constructor(parameters, integers, doubles, layout) {
    this.code = [];
    this.scopes = [];
    this.layout = layout;
    this.names = [...parameters, ...integers, ...doubles];
    this.indices = Object.fromEntries(
      this.names.map((name, index) => [name, index]),
    );
    this.locals = vector([
      flat(uleb(integers.length), TYPE.i32),
      flat(uleb(doubles.length), TYPE.f64),
    ]);
  }
  get(name) {
    if (!(name in this.indices)) throw Error("Unknown local " + name);
    return flat(0x20, uleb(this.indices[name]));
  }
  set(name, value) {
    this.emit(value, 0x21, uleb(this.indices[name]));
  }
  emit(...bytes) {
    this.code.push(...flat(bytes));
  }
  depth(name) {
    const n = this.scopes.lastIndexOf(name);
    if (n < 0) throw Error("Unknown label " + name);
    return this.scopes.length - 1 - n;
  }
  block(name, body, loop = false) {
    this.emit(loop ? 0x03 : 0x02, 0x40);
    this.scopes.push(name);
    body();
    this.scopes.pop();
    this.emit(0x0b);
  }
  when(condition, yes, no) {
    this.emit(condition, 0x04, 0x40);
    this.scopes.push(Symbol());
    yes();
    if (no) {
      this.emit(0x05);
      no();
    }
    this.scopes.pop();
    this.emit(0x0b);
  }
  loop(index, limit, body) {
    const end = index + ":end",
      again = index + ":loop";
    this.set(index, i(0));
    this.block(end, () =>
      this.block(
        again,
        () => {
          this.emit(
            op("i32.ge_u", this.get(index), limit),
            0x0d,
            uleb(this.depth(end)),
          );
          body();
          this.set(index, plus(this.get(index), 1));
          this.emit(0x0c, uleb(this.depth(again)));
        },
        true,
      ),
    );
  }
  load(name, index) {
    const s = this.layout.segments[name],
      m = MEMORY[s.type];
    return flat(mul(index, i(m.bytes)), m.load, uleb(m.align), uleb(s.offset));
  }
  store(name, index, value) {
    const s = this.layout.segments[name],
      m = MEMORY[s.type];
    this.emit(
      mul(index, i(m.bytes)),
      value,
      m.store,
      uleb(m.align),
      uleb(s.offset),
    );
  }
  dynamicLoad(type, pointer, index) {
    const m = MEMORY[type];
    return flat(add(pointer, mul(index, i(m.bytes))), m.load, uleb(m.align), 0);
  }
  dynamicStore(type, pointer, index, value) {
    const m = MEMORY[type];
    this.emit(
      add(pointer, mul(index, i(m.bytes))),
      value,
      m.store,
      uleb(m.align),
      0,
    );
  }
}

// Fixed-three scaled compensated summation. Algebraically unroll the first
// two Kahan steps (initial compensation is zero); preserve every f64 operation.
// Design references: V8/Node22 MathHypot and V8 FastMathHypot, src/builtins/math.tq.
// This is scalar arithmetic, not an approximate inverse square root.
function normBody(layout) {
  const f = new FunctionBody(
    ["x", "y", "z"],
    [],
    [
      "a",
      "b",
      "c",
      "maximum",
      "na",
      "nb",
      "nc",
      "pa",
      "pb",
      "sum",
      "compensation",
      "pc",
    ],
    layout,
  );
  const g = (name) => f.get(name);
  for (const [name, input] of [
    ["a", "x"],
    ["b", "y"],
    ["c", "z"],
  ])
    f.set(name, op("f64.abs", g(input)));
  const infinite = op(
    "i32.or",
    op(
      "i32.or",
      op("f64.eq", g("a"), d(Infinity)),
      op("f64.eq", g("b"), d(Infinity)),
    ),
    op("f64.eq", g("c"), d(Infinity)),
  );
  f.when(infinite, () => f.emit(d(Infinity), 0x0f));
  f.set("maximum", op("f64.max", op("f64.max", g("a"), g("b")), g("c")));
  f.when(op("f64.eq", g("maximum"), d(0)), () => f.emit(d(0), 0x0f));
  for (const [name, value] of [
    ["na", "a"],
    ["nb", "b"],
    ["nc", "c"],
  ])
    f.set(name, op("f64.div", g(value), g("maximum")));
  f.set("pa", op("f64.mul", g("na"), g("na")));
  f.set("pb", op("f64.mul", g("nb"), g("nb")));
  f.set("sum", op("f64.add", g("pa"), g("pb")));
  f.set(
    "compensation",
    op("f64.sub", op("f64.sub", g("sum"), g("pa")), g("pb")),
  );
  f.set(
    "pc",
    op("f64.sub", op("f64.mul", g("nc"), g("nc")), g("compensation")),
  );
  f.emit(
    op(
      "f64.mul",
      op("f64.sqrt", op("f64.add", g("sum"), g("pc"))),
      g("maximum"),
    ),
    0x0f,
    0x0b,
  );
  return flat(f.locals, f.code);
}

export function buildKernelModule() {
  const { layout, initial } = allocate();
  const integers = [
    "cell",
    "tet",
    "n",
    "mask",
    "cross",
    "e",
    "a",
    "b",
    "key",
    "cached",
    "e3",
    "a3",
    "b3",
    "tri",
    "triCount",
    "triOffset",
    "crossCount",
    "crossOffset",
    "cursor",
    "candidateCount",
    "positions",
    "normals",
    "candidates",
    "ia",
    "ib",
    "low",
    "high",
  ];
  const doubles = [
    "t",
    "norm",
    "x",
    "y",
    "z",
    "minX",
    "minY",
    "minZ",
    "maxX",
    "maxY",
    "maxZ",
  ];
  const f = new FunctionBody(
      ["level", "activeCount", "layer"],
      integers,
      doubles,
      layout,
    ),
    g = (name) => f.get(name);
  const promote = (value) => op("f64.promote_f32", value),
    demote = (value) => op("f32.demote_f64", value);
  for (const [name, array] of [
    ["positions", "positions"],
    ["normals", "normals"],
    ["candidates", "candidates"],
  ]) {
    f.set(
      name,
      select(
        i(layout.segments[array + "0"].offset),
        i(layout.segments[array + "1"].offset),
        op("i32.eqz", g("layer")),
      ),
    );
  }
  f.set("cursor", i(0));
  f.set("candidateCount", i(0));
  for (const axis of ["X", "Y", "Z"]) {
    f.set("min" + axis, d(Infinity));
    f.set("max" + axis, d(-Infinity));
  }
  f.loop("cell", g("activeCount"), () => {
    const outside = op(
      "i32.or",
      op("f64.gt", promote(f.load("activeMin", g("cell"))), g("level")),
      op("f64.lt", promote(f.load("activeMax", g("cell"))), g("level")),
    );
    f.when(op("i32.eqz", outside), () => {
      f.set("n", f.load("activeCells", g("cell")));
      f.loop("tet", i(tets.length), () => {
        f.set("mask", i(0));
        for (let j = 0; j < 4; j++) {
          f.store(
            "ids",
            i(j),
            add(g("n"), f.load("tetOffsets", plus(mul(g("tet"), i(4)), j))),
          );
          f.store(
            "values",
            i(j),
            promote(f.load("field", f.load("ids", i(j)))),
          );
          f.set(
            "mask",
            op(
              "i32.or",
              g("mask"),
              select(
                i(1 << j),
                i(0),
                op("f64.lt", f.load("values", i(j)), g("level")),
              ),
            ),
          );
        }
        f.set("triCount", f.load("triCounts", g("mask")));
        f.when(op("i32.ne", g("triCount"), i(0)), () => {
          f.set("triOffset", f.load("triOffsets", g("mask")));
          f.set("crossCount", f.load("crossCounts", g("mask")));
          f.set("crossOffset", f.load("crossOffsets", g("mask")));
          f.loop("cross", g("crossCount"), () => {
            f.set("e", f.load("crossData", add(g("crossOffset"), g("cross"))));
            f.set("a", f.load("edges", mul(g("e"), i(2))));
            f.set("b", f.load("edges", plus(mul(g("e"), i(2)), 1)));
            f.set("ia", f.load("ids", g("a")));
            f.set("ib", f.load("ids", g("b")));
            const lower = op("i32.lt_u", g("ia"), g("ib"));
            f.set("low", select(g("ia"), g("ib"), lower));
            f.set("high", select(g("ib"), g("ia"), lower));
            f.set(
              "key",
              add(
                mul(g("low"), i(7)),
                f.load("edgeKinds", op("i32.sub", g("high"), g("low"))),
              ),
            );
            f.set("cached", op("i32.sub", f.load("edgeCache", g("key")), i(1)));
            f.store("edgeKeys", g("e"), g("key"));
            f.set("e3", mul(g("e"), i(3)));
            f.when(
              op("i32.ge_s", g("cached"), i(0)),
              () => {
                for (let axis = 0; axis < 3; axis++) {
                  f.store(
                    "ep",
                    plus(g("e3"), axis),
                    promote(
                      f.dynamicLoad(
                        "f32",
                        g("positions"),
                        plus(g("cached"), axis),
                      ),
                    ),
                  );
                  f.store(
                    "en",
                    plus(g("e3"), axis),
                    promote(
                      f.dynamicLoad(
                        "f32",
                        g("normals"),
                        plus(g("cached"), axis),
                      ),
                    ),
                  );
                }
              },
              () => {
                f.set(
                  "t",
                  op(
                    "f64.div",
                    op("f64.sub", g("level"), f.load("values", g("a"))),
                    op(
                      "f64.sub",
                      f.load("values", g("b")),
                      f.load("values", g("a")),
                    ),
                  ),
                );
                f.set("a3", mul(g("ia"), i(3)));
                f.set("b3", mul(g("ib"), i(3)));
                for (let axis = 0; axis < 3; axis++) {
                  for (const [target, source] of [
                    ["ep", "coordinates"],
                    ["en", "gradients"],
                  ]) {
                    f.store(
                      target,
                      plus(g("e3"), axis),
                      op(
                        "f64.add",
                        op(
                          "f64.mul",
                          promote(f.load(source, plus(g("a3"), axis))),
                          op("f64.sub", d(1), g("t")),
                        ),
                        op(
                          "f64.mul",
                          promote(f.load(source, plus(g("b3"), axis))),
                          g("t"),
                        ),
                      ),
                    );
                  }
                }
                f.set(
                  "norm",
                  flat(
                    f.load("en", g("e3")),
                    f.load("en", plus(g("e3"), 1)),
                    f.load("en", plus(g("e3"), 2)),
                    0x10,
                    uleb(0),
                  ),
                );
                f.when(
                  op(
                    "i32.or",
                    op("f64.eq", g("norm"), d(0)),
                    op("f64.ne", g("norm"), g("norm")),
                  ),
                  () => f.set("norm", d(1)),
                );
                for (let axis = 0; axis < 3; axis++)
                  f.store(
                    "en",
                    plus(g("e3"), axis),
                    op("f64.div", f.load("en", plus(g("e3"), axis)), g("norm")),
                  );
              },
            );
          });
          f.loop("tri", g("triCount"), () => {
            f.set("e", f.load("triData", add(g("triOffset"), g("tri"))));
            f.when(
              op("i32.gt_u", plus(g("cursor"), 3), i(grid.capacity * 3)),
              () => {
                f.store("meta", i(0), g("cursor"));
                f.emit(op("i32.sub", i(-1), g("cursor")), 0x0f);
              },
            );
            f.set("key", f.load("edgeKeys", g("e")));
            f.when(op("i32.eqz", f.load("edgeCache", g("key"))), () => {
              f.store("edgeCache", g("key"), plus(g("cursor"), 1));
              f.dynamicStore(
                "u32",
                g("candidates"),
                g("candidateCount"),
                op("i32.div_u", g("cursor"), i(3)),
              );
              f.set("candidateCount", plus(g("candidateCount"), 1));
            });
            f.set("e3", mul(g("e"), i(3)));
            for (let axis = 0; axis < 3; axis++) {
              const name = ["x", "y", "z"][axis];
              f.set(name, f.load("ep", plus(g("e3"), axis)));
              f.dynamicStore(
                "f32",
                g("positions"),
                g("cursor"),
                demote(g(name)),
              );
              f.dynamicStore(
                "f32",
                g("normals"),
                g("cursor"),
                demote(f.load("en", plus(g("e3"), axis))),
              );
              f.set("cursor", plus(g("cursor"), 1));
            }
            for (const [axis, name] of [
              ["X", "x"],
              ["Y", "y"],
              ["Z", "z"],
            ]) {
              f.set("min" + axis, op("f64.min", g("min" + axis), g(name)));
              f.set("max" + axis, op("f64.max", g("max" + axis), g(name)));
            }
          });
        });
      });
    });
  });
  f.store("meta", i(0), g("cursor"));
  f.store("meta", i(1), g("candidateCount"));
  ["minX", "minY", "minZ", "maxX", "maxY", "maxZ"].forEach((name, index) =>
    f.store("bounds", i(index), g(name)),
  );
  f.emit(g("cursor"), 0x0f, 0x0b);
  const body = flat(f.locals, f.code);
  const magnitude = normBody(layout);
  const functionType = (params, result) =>
    flat(0x60, vector(params), vector(result));
  const sections = [
    section(
      1,
      vector([
        functionType([TYPE.f64, TYPE.f64, TYPE.f64], [TYPE.f64]),
        functionType([TYPE.f64, TYPE.i32, TYPE.i32], [TYPE.i32]),
      ]),
    ),
    section(3, vector([uleb(0), uleb(1)])),
    section(5, vector([flat(0x01, uleb(layout.pages), uleb(layout.pages))])),
    section(
      7,
      vector([
        flat(text("memory"), 0x02, uleb(0)),
        flat(text("extract"), 0x00, uleb(1)),
        flat(text("norm3"), 0x00, uleb(0)),
      ]),
    ),
    section(
      10,
      vector([
        flat(uleb(magnitude.length), magnitude),
        flat(uleb(body.length), body),
      ]),
    ),
    section(
      11,
      vector([flat(0x00, i(0), 0x0b, uleb(initial.length), [...initial])]),
    ),
  ];
  const names = vector([
    flat(uleb(0), text("hypot3")),
    flat(uleb(1), text("extractGermMembraneLayer")),
  ]);
  const namePayload = flat(text("name"), 1, uleb(names.length), names);
  sections.push(section(0, namePayload));
  const bytes = Uint8Array.from(
    flat([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0], sections),
  );
  const signature = JSON.stringify([grid, tets, edges, triangles]);
  return {
    bytes,
    layout,
    signature,
    abi: 3,
    sourceSha256: createHash("sha256")
      .update(fs.readFileSync(HERE))
      .digest("hex"),
  };
}

export async function generateKernelSource() {
  const kernel = buildKernelModule();
  const data = {
    ...kernel,
    bytes: undefined,
    wasmBase64: Buffer.from(kernel.bytes).toString("base64"),
  };
  const raw =
    "// Generated by scripts/generate-germ-membrane-kernel.mjs; do not edit.\nexport const kernelData = " +
    JSON.stringify(data, null, 2) +
    ";\n";
  const options = {
    ...(await prettier.resolveConfig(OUTPUT)),
    filepath: OUTPUT,
  };
  return { kernel, source: await prettier.format(raw, options) };
}

export async function prepareKernelSources(artifacts) {
  const sources = [
    HERE,
    "../src/processes/modules/division/germMembraneTopology.js",
    "../src/processes/modules/division/germMembraneKernel.js",
    "../src/processes/modules/division/germCellMembrane.js",
    "../tests/division-membrane-kernel.mjs",
    "verify.mjs",
  ];
  const formatting = [];
  for (const source of sources) {
    const file =
      source === HERE ? HERE : fileURLToPath(new URL(source, import.meta.url));
    const before = fs.readFileSync(file, "utf8");
    const formatted = await prettier.format(before, {
      ...(await prettier.resolveConfig(file)),
      filepath: file,
    });
    fs.writeFileSync(file, formatted);
    formatting.push({
      path: file,
      before: createHash("sha256").update(before).digest("hex"),
      after: createHash("sha256").update(formatted).digest("hex"),
    });
  }
  if (artifacts) {
    fs.mkdirSync(artifacts, { recursive: true });
    fs.writeFileSync(
      path.join(artifacts, "FORMATTING.json"),
      JSON.stringify(formatting, null, 2) + "\n",
    );
  }
  return formatting;
}

async function main() {
  const artifactArg = process.argv.find((v) => v.startsWith("--artifacts="));
  if (process.argv.includes("--prepare"))
    await prepareKernelSources(artifactArg?.slice("--artifacts=".length));
  const { kernel, source } = await generateKernelSource();
  if (artifactArg) {
    const target = artifactArg.slice("--artifacts=".length);
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, "kernel.wasm"), kernel.bytes);
    fs.writeFileSync(
      path.join(target, "layout.json"),
      JSON.stringify(kernel.layout, null, 2) + "\n",
    );
  }
  if (!WebAssembly.validate(kernel.bytes)) {
    new WebAssembly.Module(kernel.bytes); // Preserve the engine's exact validation diagnostic.
    throw Error("Private membrane kernel validation failed");
  }
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, "utf8") !== source)
      throw Error("Generated membrane kernel is stale; regenerate it");
  } else fs.writeFileSync(OUTPUT, source);
  console.log(
    JSON.stringify({
      status: "KERNEL_BINARY_VALID",
      bytes: kernel.bytes.length,
      pages: kernel.layout.pages,
      memoryBytes: kernel.layout.byteLength,
      generatedSource: OUTPUT,
      checkOnly: process.argv.includes("--check"),
    }),
  );
}
if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
)
  await main();
