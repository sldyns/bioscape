// Labels are annotations, not opaque panels over the model. Long descriptions
// live in the key; only short notation and small numbered markers enter canvas.
export const isShortNotation = (text) =>
  [...text].length <= 5 && !/[\s\p{Script=Han}]/u.test(text);

// Count displayed annotations, not source slots: symbols and inactive labels
// must not leave holes in the marker/key sequence.
export function annotationNumbers(labels, lang) {
  let number = 0;
  return labels.map((label) => {
    const text = label.text[lang] ?? label.text.zh ?? label.text.en ?? "";
    return label.active !== false && !isShortNotation(text) ? ++number : null;
  });
}

export function placeLabel(
  anchor,
  size,
  viewport,
  occupied,
  numbered,
  protectedAnchors = [],
) {
  const signX = anchor.x < viewport.width / 2 ? -1 : 1;
  const signY = anchor.y < viewport.height / 2 ? -1 : 1;
  const candidates = numbered
    ? [
        [signX * 20, signY * 18],
        [-signX * 20, signY * 18],
        [signX * 20, -signY * 18],
        [0, -32],
        [0, 32],
        [-38, 0],
        [38, 0],
      ]
    : [
        [0, 0],
        [0, -24],
        [0, 24],
        [-28, 0],
        [28, 0],
      ];
  let fallback = null;
  for (const [dx, dy] of candidates) {
    const x = anchor.x + dx,
      y = anchor.y + dy;
    const rect = {
      left: x - size.width / 2,
      right: x + size.width / 2,
      top: y - size.height / 2,
      bottom: y + size.height / 2,
    };
    if (
      rect.left < 8 ||
      rect.right > viewport.width - 8 ||
      rect.top < 8 ||
      rect.bottom > viewport.height - 8
    )
      continue;
    if (
      occupied.some(
        (other) =>
          rect.left < other.right + 5 &&
          rect.right > other.left - 5 &&
          rect.top < other.bottom + 5 &&
          rect.bottom > other.top - 5,
      )
    )
      continue;
    const placement = { x, y, rect };
    // Keep a valid position when every existing candidate covers a target.
    // This preserves the old local fallback, not a global visibility guarantee.
    fallback ??= placement;
    // Short notation keeps its existing placement. Numbered markers leave a
    // small gap around other active targets so their leader ends stay legible.
    if (
      numbered &&
      protectedAnchors.some(
        (other) =>
          other !== anchor &&
          other.x >= rect.left - 3 &&
          other.x <= rect.right + 3 &&
          other.y >= rect.top - 3 &&
          other.y <= rect.bottom + 3,
      )
    )
      continue;
    return placement;
  }
  return fallback;
}
