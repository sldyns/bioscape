import { isShortNotation } from "./labelLayout.js";

const numberCaches = new WeakMap();
const labelText = (label, lang) =>
  label.text[lang] ?? label.text.zh ?? label.text.en ?? "";

// Sources keep their numbering order even when placement sorts items by priority.
// Read text and active on every frame: models may mutate either in place.
function prepareNumbers(sources, lang) {
  let cache = numberCaches.get(sources);
  if (!cache) {
    cache = { texts: [], notation: [], numbers: [] };
    numberCaches.set(sources, cache);
  }
  let number = 0;
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const text = labelText(source, lang);
    if (cache.texts[i] !== text) {
      cache.texts[i] = text;
      cache.notation[i] = isShortNotation(text);
    }
    cache.numbers[i] =
      source.active !== false && !cache.notation[i] ? ++number : null;
  }
  cache.texts.length =
    cache.notation.length =
    cache.numbers.length =
      sources.length;
  return cache.numbers;
}

// Keep DOM writes, layout reads, and projected placement in separate passes.
// Rotation changes anchors only; text metrics stay cached until text or viewport
// changes. This avoids a forced browser layout for every label on every frame.
export function prepareAnnotationLabels(items, sources, lang, viewportKey) {
  const numbers = prepareNumbers(sources, lang);
  for (const item of items) {
    const text = labelText(item.source, lang);
    const active = item.source.active !== false;
    const number = numbers[item.sourceIndex];
    if (
      item.preparedText === text &&
      item.active === active &&
      item.preparedNumber === number &&
      item.preparedViewport === viewportKey
    )
      continue;
    const numbered =
      item.preparedText === text ? item.numbered : !isShortNotation(text);
    const numberText = number === null ? "" : String(number);
    const marker = numbered ? numberText : text;
    const ariaLabel = numbered && active ? `${number}. ${text}` : text;
    if (item.numberElement.textContent !== numberText)
      item.numberElement.textContent = numberText;
    if (item.key.hidden !== (!active || !numbered))
      item.key.hidden = !active || !numbered;
    if (item.wording.textContent !== text) item.wording.textContent = text;
    if (item.ariaLabel !== ariaLabel) {
      item.key.setAttribute("aria-label", ariaLabel);
      item.ariaLabel = ariaLabel;
    }
    if (item.element.textContent !== marker) item.element.textContent = marker;
    if (item.numbered !== numbered)
      item.element.classList.toggle("numbered", numbered);
    item.numbered = numbered;
    item.active = active;
    item.measureKey = `${viewportKey}|${numbered}|${marker}`;
    item.preparedText = text;
    item.preparedNumber = number;
    item.preparedViewport = viewportKey;
  }
  for (const item of items) {
    if (!item.active || item.measuredKey === item.measureKey) continue;
    item.size = {
      width: item.element.offsetWidth,
      height: item.element.offsetHeight,
    };
    item.measuredKey = item.measureKey;
  }
}
