import { annotationNumbers, isShortNotation } from "./labelLayout.js";

// Keep DOM writes, layout reads, and projected placement in separate passes.
// Rotation changes anchors only; text metrics stay cached until text or viewport
// changes. This avoids a forced browser layout for every label on every frame.
export function prepareAnnotationLabels(items, sources, lang, viewportKey) {
  const numbers = annotationNumbers(sources, lang);
  for (const item of items) {
    const text =
      item.source.text[lang] ??
      item.source.text.zh ??
      item.source.text.en ??
      "";
    const numbered = !isShortNotation(text);
    const active = item.source.active !== false;
    const number = numbers[item.sourceIndex];
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
