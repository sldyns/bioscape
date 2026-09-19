// Public assets must work at both / and a GitHub Pages project subdirectory.
export function assetUrl(path, base = import.meta.env?.BASE_URL ?? "./") {
  return `${base.replace(/\/?$/, "/")}${path.replace(/^\/+/, "")}`;
}
