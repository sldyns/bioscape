// Native browser instrumentation. Does not replace event callbacks or controls.
// Prepared as source only in S214; not imported, syntax-checked or executed.
export function nativeListenerLedger() {
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  const rows = [];
  const capture = (options) =>
    typeof options === "boolean" ? options : Boolean(options?.capture);
  const relevant = (target, type, options) =>
    ((target === document || target instanceof ShadowRoot) &&
      ["keydown", "keyup"].includes(type) &&
      capture(options)) ||
    target instanceof HTMLCanvasElement;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    const result = add.call(this, type, listener, options);
    if (
      listener &&
      relevant(this, type, options) &&
      !rows.some(
        (row) =>
          row.target === this &&
          row.type === type &&
          row.listener === listener &&
          row.capture === capture(options),
      )
    ) {
      rows.push({ target: this, type, listener, capture: capture(options) });
    }
    return result;
  };
  EventTarget.prototype.removeEventListener = function (
    type,
    listener,
    options,
  ) {
    const result = remove.call(this, type, listener, options);
    const index = rows.findIndex(
      (row) =>
        row.target === this &&
        row.type === type &&
        row.listener === listener &&
        row.capture === capture(options),
    );
    if (index !== -1) rows.splice(index, 1);
    return result;
  };
  return {
    entries(target) {
      return rows
        .filter((row) => row.target === target)
        .map((row) => ({ ...row }));
    },
    count(target, type) {
      return rows.filter(
        (row) => row.target === target && (!type || row.type === type),
      ).length;
    },
    has(target, type, listener, useCapture = true) {
      return rows.some(
        (row) =>
          row.target === target &&
          row.type === type &&
          row.listener === listener &&
          row.capture === useCapture,
      );
    },
    // Invoke only after recording evidence. This is harness hygiene, not a pass.
    restore() {
      for (const row of rows)
        remove.call(row.target, row.type, row.listener, row.capture);
      rows.length = 0;
      EventTarget.prototype.addEventListener = add;
      EventTarget.prototype.removeEventListener = remove;
    },
  };
}

export function controlKey(root, type) {
  root.dispatchEvent(
    new KeyboardEvent(type, {
      key: "Control",
      code: "ControlLeft",
      ctrlKey: type === "keydown",
      bubbles: true,
      composed: true,
    }),
  );
}
