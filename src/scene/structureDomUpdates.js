// Compare against the actual DOM rather than a separate cache: external style
// changes, hidden views and reused labels cannot leave a stale cached value.
export function setStyleIfChanged(element, property, value) {
  if (element.style[property] !== value) element.style[property] = value;
}

export function setAttributeIfChanged(element, name, value) {
  const text = String(value);
  if (element.getAttribute(name) !== text) element.setAttribute(name, text);
}

export function setHiddenIfChanged(element, hidden) {
  if (element.hidden !== hidden) element.hidden = hidden;
}
