import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  annotationNumbers,
  isShortNotation,
  placeLabel,
} from "../src/processes/labelLayout.js";
const annotations = [
  { text: { zh: "人 80S 实验骨架", en: "Human 80S structure" } },
  ...["E", "P", "A", "5′", "3′"].map((text) => ({
    text: { zh: text, en: text },
  })),
  { text: { zh: "已经离开的 tRNA", en: "Departed tRNA" }, active: false },
  { text: { zh: "核糖体蛋白与 rRNA", en: "Ribosomal proteins and rRNA" } },
];
for (const lang of ["zh", "en"]) {
  assert.deepEqual(annotationNumbers(annotations, lang), [
    1,
    null,
    null,
    null,
    null,
    null,
    null,
    2,
  ]);
  annotations[6].active = true;
  assert.deepEqual(annotationNumbers(annotations, lang), [
    1,
    null,
    null,
    null,
    null,
    null,
    2,
    3,
  ]);
  annotations[6].active = false;
}
assert(isShortNotation("5′"));
assert(isShortNotation("ATP"));
for (const symbol of ["Na⁺", "Ca²⁺", "CO₂", "α", "Rpn11"])
  assert(isShortNotation(symbol));
for (const name of ["气孔孔隙", "连续的质膜", "胞质套筒", "蓝光", "细胞核"])
  assert(
    !isShortNotation(name),
    `${name} is anatomical prose, not inline symbolic notation`,
  );
assert(!isShortNotation("RNA 聚合酶 II"));
assert(!isShortNotation("Large-subunit rRNA"));
for (const viewport of [
  { width: 320, height: 260 },
  { width: 700, height: 440 },
]) {
  const occupied = [];
  for (let i = 0; i < 20; i++) {
    const place = placeLabel(
      {
        x: viewport.width / 2 + (i % 3) * 14,
        y: viewport.height / 2 + Math.floor(i / 3) * 13,
      },
      { width: 21, height: 21 },
      viewport,
      occupied,
      true,
    );
    if (!place) continue;
    assert(place.rect.left >= 8 && place.rect.right <= viewport.width - 8);
    assert(place.rect.top >= 8 && place.rect.bottom <= viewport.height - 8);
    assert(
      occupied.every(
        (r) =>
          place.rect.right <= r.left ||
          place.rect.left >= r.right ||
          place.rect.bottom <= r.top ||
          place.rect.top >= r.bottom,
      ),
    );
    occupied.push(place.rect);
  }
  assert(
    occupied.length >= 6,
    "Crowded anchors still offer readable alternatives",
  );
}
assert.equal(
  placeLabel(
    { x: -200, y: -200 },
    { width: 21, height: 21 },
    { width: 320, height: 260 },
    [],
    true,
  ),
  null,
);
// S214 candidate checks. These are prepared source, not evidence of execution.
const viewport = { width: 320, height: 260 };
const markerSize = { width: 21, height: 21 };
const anchor = { x: 160, y: 130 };
const coveredTarget = { x: 180, y: 148 };
const legacy = placeLabel(anchor, markerSize, viewport, [], true);
const protectedPlacement = placeLabel(anchor, markerSize, viewport, [], true, [
  anchor,
  coveredTarget,
]);
assert.deepEqual(
  legacy,
  placeLabel(anchor, markerSize, viewport, [], true, []),
);
assert.notDeepEqual(protectedPlacement, legacy);
const clears = (rect, point, margin = 3) =>
  point.x < rect.left - margin ||
  point.x > rect.right + margin ||
  point.y < rect.top - margin ||
  point.y > rect.bottom + margin;
assert(clears(protectedPlacement.rect, coveredTarget));

// Self identity, rather than coincident coordinates, controls exclusion.
const broadMarker = { width: 40, height: 40 };
assert.deepEqual(
  placeLabel(anchor, broadMarker, viewport, [], true, [anchor]),
  placeLabel(anchor, broadMarker, viewport, [], true),
);
const coincidentOther = { ...anchor };
assert(
  clears(
    placeLabel(anchor, broadMarker, viewport, [], true, [coincidentOther]).rect,
    coincidentOther,
  ),
);

// A target exactly on the clearance boundary rejects that candidate.
const boundaryTarget = { x: legacy.rect.right + 3, y: legacy.y };
assert.notDeepEqual(
  placeLabel(anchor, markerSize, viewport, [], true, [boundaryTarget]),
  legacy,
);
const edgeAnchor = { x: 20, y: 20 };
const edgeTarget = { x: 20, y: 52 };
const edgePlacement = placeLabel(edgeAnchor, markerSize, viewport, [], true, [
  edgeAnchor,
  edgeTarget,
]);
assert(clears(edgePlacement.rect, edgeTarget));
assert(edgePlacement.rect.left >= 8 && edgePlacement.rect.top >= 8);
assert(edgePlacement.rect.right <= viewport.width - 8);
assert(edgePlacement.rect.bottom <= viewport.height - 8);

// Short notation keeps its inline design, even with a nearby protected point.
assert.deepEqual(
  placeLabel(anchor, markerSize, viewport, [], false, [coincidentOther]),
  placeLabel(anchor, markerSize, viewport, [], false),
);

// If every old candidate covers a target, preserve the first locally valid
// candidate. Existing rectangle collisions and viewport limits still apply.
const everyCandidate = [
  [20, 18],
  [-20, 18],
  [20, -18],
  [0, -32],
  [0, 32],
  [-38, 0],
  [38, 0],
].map(([dx, dy]) => ({ x: anchor.x + dx, y: anchor.y + dy }));
assert.deepEqual(
  placeLabel(anchor, markerSize, viewport, [], true, everyCandidate),
  legacy,
);
assert.deepEqual(
  placeLabel(anchor, markerSize, viewport, [legacy.rect], true, everyCandidate),
  placeLabel(anchor, markerSize, viewport, [legacy.rect], true),
);
assert.equal(
  placeLabel(
    anchor,
    markerSize,
    viewport,
    [{ left: 0, top: 0, right: 320, bottom: 260 }],
    true,
    everyCandidate,
  ),
  null,
);

// Saved S209 projection fixtures contain all visible labels for each affected
// frame. No model, camera or browser is instantiated by this pure-layout check.
const fixtures = JSON.parse(
  readFileSync(
    new URL("./fixtures/process-label-anchor-s214.json", import.meta.url),
    "utf8",
  ),
);
for (const fixture of fixtures.cases) {
  const items = fixture.labels.map((label) => ({
    ...label,
    anchor: { ...label.anchor },
  }));
  const points = items.map((label) => label.anchor);
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  const placed = new Map();
  const rectangles = [];
  for (const label of sorted) {
    const placement = placeLabel(
      label.anchor,
      label.size,
      fixture.viewport,
      rectangles,
      true,
      points,
    );
    assert(
      placement,
      `${fixture.caseId}: source ${label.sourceIndex} remains placed`,
    );
    rectangles.push(placement.rect);
    placed.set(label.sourceIndex, placement);
  }
  const target = items.find(
    (label) => label.sourceIndex === fixture.targetSourceIndex,
  );
  const blocker = items.find(
    (label) => label.sourceIndex === fixture.blockerSourceIndex,
  );
  assert(
    !clears(blocker.recordedRect, target.anchor, 0),
    `${fixture.caseId}: retained regression evidence`,
  );
  assert(
    clears(placed.get(blocker.sourceIndex).rect, target.anchor),
    `${fixture.caseId}: candidate clears the known target`,
  );
}
console.log(
  "Process annotations: notation, edges, target clearance, crowded fallback and saved projections PASS",
);
