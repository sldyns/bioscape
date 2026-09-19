import { rootIds } from "./catalog/cellTypes";
import { children } from "./hierarchy";
import { processesByRoot, resolveProcess } from "./processes/catalog";
export function parsePath(hash) {
  const values = hash
      .split("?")[0]
      .replace(/^#\/?/, "")
      .split("/")
      .filter(Boolean),
    result = [rootIds.includes(values[0]) ? values.shift() : "cell"];
  for (const id of values) {
    if (!children[result.at(-1)]?.includes(id)) break;
    result.push(id);
  }
  return result;
}
export const pathHash = (path) => "#/" + path.join("/");
export const processRoots = new Set(Object.keys(processesByRoot));
export function parseProcess(hash) {
  if (parseExperience(hash) !== "process") return null;
  return resolveProcess(
    parsePath(hash)[0],
    new URLSearchParams(hash.split("?")[1] || "").get("process"),
  );
}
export function parseExperience(hash) {
  return processRoots.has(parsePath(hash)[0]) &&
    new URLSearchParams(hash.split("?")[1] || "").get("view") === "process"
    ? "process"
    : "structure";
}
export const experienceHash = (path, experience, processId) =>
  pathHash(path) +
  (experience === "process" && processRoots.has(path[0])
    ? "?view=process" +
      (resolveProcess(path[0], processId)
        ? "&process=" + resolveProcess(path[0], processId)
        : "")
    : "");
