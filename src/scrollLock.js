const activeLocks = new WeakMap();

export function lockPageScroll(doc = document) {
  let state = activeLocks.get(doc);
  if (!state) {
    const { body, defaultView } = doc;
    const style = body.style;
    const saved = ["overflow-x", "overflow-y", "padding-right"].map(
      (property) => [
        property,
        style.getPropertyValue(property),
        style.getPropertyPriority(property),
      ],
    );
    const width = body.getBoundingClientRect().width;
    const padding =
      parseFloat(defaultView.getComputedStyle(body).paddingRight) || 0;
    style.setProperty("overflow", "hidden");
    // Compensate only the space actually released by a classic scrollbar.
    const addedWidth = Math.max(0, body.getBoundingClientRect().width - width);
    if (addedWidth)
      style.setProperty("padding-right", `${padding + addedWidth}px`);
    state = {
      count: 0,
      restore() {
        for (const [property, value, priority] of saved) {
          if (value) style.setProperty(property, value, priority);
          else style.removeProperty(property);
        }
      },
    };
    activeLocks.set(doc, state);
  }
  state.count += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--state.count === 0) {
      state.restore();
      activeLocks.delete(doc);
    }
  };
}
