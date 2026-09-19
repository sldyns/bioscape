import assert from "node:assert/strict";
import { assetUrl } from "../src/assetUrl.js";

for (const base of ["./", "/", "/cell-atlas/", "/nested/cell-atlas/"]) {
  const page = new URL(base, "https://example.org/");
  for (const path of [
    "/process-thumbnails/rendered/translation.webp",
    "icon.svg",
  ]) {
    assert.equal(
      new URL(assetUrl(path, base), page).href,
      new URL(path.replace(/^\//, ""), page).href,
    );
  }
}
console.log("Public asset URLs: root, relative and nested project bases PASS");
