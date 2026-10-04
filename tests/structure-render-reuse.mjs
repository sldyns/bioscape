import assert from "node:assert/strict";
import { test } from "node:test";
import { createPickingCandidates } from "../src/scene/pickingCandidates.js";
import {
  setStyleIfChanged,
  setAttributeIfChanged,
  setHiddenIfChanged,
} from "../src/scene/structureDomUpdates.js";

function object(hitId, parent = null) {
  return { userData: { hitId }, visible: true, parent };
}

test("picking keeps mesh order and foreground precedence in every whole model", () => {
  const membrane = object("membrane");
  const first = object("ribosomes");
  const wall = object("cellWall");
  const second = object("nucleus");
  const surface = object("paraSurface");
  const head = object("phageHead");
  const meshes = [membrane, first, wall, second, surface, head];
  for (const nodeId of [
    "cell",
    "cytoplasm",
    "plant",
    "bacterium",
    "yeast",
    "paramecium",
    "phage",
  ]) {
    const collect = createPickingCandidates(meshes, nodeId);
    const result = collect();
    assert.deepEqual(result.primary, [first, second]);
    assert.deepEqual(result.fallback, [membrane, wall, surface, head]);
    const primary = result.primary;
    const fallback = result.fallback;
    assert.equal(collect(), result);
    assert.equal(result.primary, primary);
    assert.equal(result.fallback, fallback);
    assert.deepEqual(
      primary,
      [first, second],
      "Scratch arrays cannot accumulate",
    );
  }
  const detail = createPickingCandidates(meshes, "nucleus")();
  assert.deepEqual(detail.primary, meshes);
  assert.deepEqual(detail.fallback, []);
});

test("picking rechecks self, ancestor and interactivity changes on each call", () => {
  const ancestor = object("container");
  const parent = object("group", ancestor);
  const front = object("nucleus", parent);
  const back = object("membrane", parent);
  const other = object("ribosomes");
  const collect = createPickingCandidates([back, front, other], "cell");
  const result = collect();
  assert.deepEqual(result.primary, [front, other]);
  assert.deepEqual(result.fallback, [back]);

  ancestor.visible = false;
  collect();
  assert.deepEqual(result.primary, [other]);
  assert.deepEqual(result.fallback, []);

  ancestor.visible = true;
  front.visible = false;
  back.userData.nonInteractive = true;
  collect();
  assert.deepEqual(result.primary, [other]);
  assert.deepEqual(result.fallback, []);

  front.visible = true;
  back.userData.nonInteractive = false;
  other.userData.nonInteractive = true;
  collect();
  assert.deepEqual(result.primary, [front]);
  assert.deepEqual(result.fallback, [back]);

  front.parent = object("hidden", null);
  front.parent.visible = false;
  collect();
  assert.deepEqual(result.primary, []);
  assert.deepEqual(result.fallback, [back]);

  front.parent = parent;
  other.userData.nonInteractive = false;
  collect();
  assert.deepEqual(result.primary, [front, other]);
  assert.deepEqual(result.fallback, [back]);
});

test("new presentations rebuild classification without retaining old meshes", () => {
  const first = object("membrane");
  const collectFirst = createPickingCandidates([first], "cell");
  assert.deepEqual(collectFirst().fallback, [first]);
  const replacement = object("nucleus");
  const collectNext = createPickingCandidates([replacement], "cell");
  assert.deepEqual(collectNext().primary, [replacement]);
  assert.deepEqual(collectNext().fallback, []);
  const empty = createPickingCandidates([], null)();
  assert.deepEqual(empty, { primary: [], fallback: [] });
});

test("unchanged label writes are skipped and external DOM changes are repaired", () => {
  const writes = [];
  const attributes = new Map();
  let hidden = false;
  const element = {
    style: new Proxy(
      { display: "", left: "", top: "" },
      {
        set(style, key, value) {
          writes.push(["style", key, value]);
          style[key] = value;
          return true;
        },
      },
    ),
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      writes.push(["attribute", name, value]);
      attributes.set(name, String(value));
    },
    get hidden() {
      return hidden;
    },
    set hidden(value) {
      writes.push(["hidden", value]);
      hidden = value;
    },
  };
  const apply = () => {
    setStyleIfChanged(element, "display", "block");
    setStyleIfChanged(element, "left", "123.456789px");
    setStyleIfChanged(element, "top", "0px");
    setAttributeIfChanged(element, "x1", 0);
    setAttributeIfChanged(element, "y1", 0.123456789);
    setHiddenIfChanged(element, true);
  };
  apply();
  assert.equal(writes.length, 6);
  assert.equal(element.style.left, "123.456789px");
  assert.equal(element.getAttribute("y1"), "0.123456789");
  writes.length = 0;
  apply();
  assert.deepEqual(writes, []);

  element.style.display = "none";
  attributes.set("x1", "42");
  element.hidden = false;
  writes.length = 0;
  apply();
  assert.deepEqual(writes, [
    ["style", "display", "block"],
    ["attribute", "x1", "0"],
    ["hidden", true],
  ]);
  setStyleIfChanged(element, "left", "");
  setHiddenIfChanged(element, false);
  assert.equal(element.style.left, "");
  assert.equal(element.hidden, false);
});
