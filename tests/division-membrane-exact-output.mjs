import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { sceneKit, ease } from "../src/processes/kit.js";
import { germCellMembrane } from "../src/processes/modules/division/germCellMembrane.js";

// Complete fixed-capacity buffers and exact bounds/ranges from published a5dc.
// Source SHA256: ab3c520603a6ed05ce1371c450156d582b9b657b0c1ffb2931dbf34a8fa30f41
// Original18 plus10 selective tail/reverse/repeat states; generated only from
// frozen a5dc by QA division-tail-2026-10-16/agents/membrane-tail/generate-tail-regression.mjs.
const expected = [
  [0, "7f39157596d72f4a5f74ed3d95c2e702ac8b2fae7dabd85932f7ebc4e1bd0589"],
  [
    0.429999999999,
    "7f39157596d72f4a5f74ed3d95c2e702ac8b2fae7dabd85932f7ebc4e1bd0589",
  ],
  [0.43, "7f39157596d72f4a5f74ed3d95c2e702ac8b2fae7dabd85932f7ebc4e1bd0589"],
  [
    0.430000000001,
    "7a8c062f5a2691403a18d63684ed3cb6bafb0d45d0a651d9258a5df5dc7ee739",
  ],
  [0.495, "a2b01e42440d66a9e82874bd8a3f4d678b8c3896441fb912c14aa29f19c9ab7d"],
  [0.56, "8c7d53be32a0dbefe2867d4a7a948eb87b6c6220ed95a58b06260fdde5f14316"],
  [
    0.799999999999,
    "8c7d53be32a0dbefe2867d4a7a948eb87b6c6220ed95a58b06260fdde5f14316",
  ],
  [0.8, "8c7d53be32a0dbefe2867d4a7a948eb87b6c6220ed95a58b06260fdde5f14316"],
  [
    0.800000000001,
    "f9c17ff6ecfff24fd9b172961a86001c7b9fce80419e951e9810022b6cb7bed7",
  ],
  [0.865, "200c58b74bbcad7f977bbe864b60746f89e07ad319769759c08595fd6c06f894"],
  [
    0.929999999999,
    "fc45dba54050b5d9eaea26e7d0f943147c6dcfde410e7f157f1c534cf9a95087",
  ],
  [0.93, "fc45dba54050b5d9eaea26e7d0f943147c6dcfde410e7f157f1c534cf9a95087"],
  [
    0.930000000001,
    "fc45dba54050b5d9eaea26e7d0f943147c6dcfde410e7f157f1c534cf9a95087",
  ],
  [0.865, "8878c9e6f6aebfcf575bc4abbd7918916f432d4a3332e3e859c6ad6c51974cd8"],
  [0.8, "4592fdec1ef53730ba0dbbdf46d16986430db7d944b7ed3ca02ec51f112ecd00"],
  [0.8, "4592fdec1ef53730ba0dbbdf46d16986430db7d944b7ed3ca02ec51f112ecd00"],
  [1, "a2421ce24e324fbd17563e4646db0c9b690ccf7388783c49b4579465a01aa1ca"],
  [0, "790acb0cd6326effbef37a8b6e18f606bbf17090f6af19190c4dc5719405b28e"],
  [0.8, "c61dab4b37d5f889d06d6258a00679d6c04aafba6132f4a2ef554054cd05d66f"],
  [0.80031, "7b189b527a928e1ea9a1d298e62c261d419ddc7ce3b6fc022cea197c972dbe65"],
  [
    0.8004658,
    "46c39c4a11afa7abbeb0c7c8e7788581f2c9d94ed8932890b28c9d40ce0133c9",
  ],
  [
    0.80090263,
    "0559f36ac7f16f86d247421229c03931be97a8b06e1eafc9ce0f15b423f3eab3",
  ],
  [0.80134, "cee0455e676fd8dd584ff2a991140da1b2a9f3e5f3471c38464f3085a9050184"],
  [
    0.8004658,
    "ce4478904ddc35012ca66e73e7cc3c05479e1174fa3c8395df722271d79138d0",
  ],
  [0.8, "5506635498d9060a487560e9453cb86f0d670440079822e0288271fb729f4d96"],
  [
    0.80090263,
    "8f49d9716c40ed3e31f747c9e581f98aef864fce0a3fbe6133cfee96697d2349",
  ],
  [
    0.80090263,
    "8f49d9716c40ed3e31f747c9e581f98aef864fce0a3fbe6133cfee96697d2349",
  ],
  [0, "046c1b5619ac61455040ce2ae66753d58600ab86dfd738e87b95c2dbbe0d3c48"],
];

function digest(group) {
  const hash = createHash("sha256"),
    numbers = (values) =>
      hash.update(Buffer.from(new Float64Array(values).buffer));
  for (const { geometry } of group.children) {
    for (const key of ["position", "normal"]) {
      const attr = geometry.attributes[key];
      hash.update(
        Buffer.from(
          attr.array.buffer,
          attr.array.byteOffset,
          attr.array.byteLength,
        ),
      );
      numbers([attr.itemSize, attr.count, attr.version]);
      hash.update(JSON.stringify(attr.updateRanges));
    }
    numbers([
      geometry.drawRange.start,
      geometry.drawRange.count,
      ...geometry.boundingBox.min.toArray(),
      ...geometry.boundingBox.max.toArray(),
      ...geometry.boundingSphere.center.toArray(),
      geometry.boundingSphere.radius,
    ]);
  }
  return hash.digest("hex");
}

const membrane = germCellMembrane(
  Object.assign(sceneKit(), { materials: new Set() }),
);
for (const [p, sha256] of expected) {
  membrane.update(ease(p, 0.43, 0.56), ease(p, 0.8, 0.93));
  assert.equal(
    digest(membrane.group),
    sha256,
    `published membrane output at p=${p}`,
  );
}
console.log(`Division membrane exact output: ${expected.length} states passed`);
