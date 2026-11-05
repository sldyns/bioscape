const RADIUS = 9;
const INSET = RADIUS + 8;
const SEPARATION = RADIUS * 2 + 4;
const ANCHOR_CLEARANCE = 12;
const GRID_LIMIT = 32;
const EMPTY_TARGETS = [];

// Build nearby candidates once. Ties have a stable order; frames allocate no
// candidate or placement objects, and noncolliding ordinary pins stay put.
const offsets = [];
for (let y = -4; y <= 4; y++)
  for (let x = -4; x <= 4; x++)
    if (x || y) offsets.push({ x, y, distance: x * x + y * y });
offsets.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function available(
  entries,
  index,
  x,
  y,
  zoomBounds,
  zoomRight,
  protectedTargets,
) {
  if (
    zoomBounds &&
    x + RADIUS > zoomBounds.left &&
    x - RADIUS < zoomRight &&
    y + RADIUS > zoomBounds.top &&
    y - RADIUS < zoomBounds.bottom
  )
    return false;
  for (const target of protectedTargets) {
    const dx = x - target.x,
      dy = y - target.y;
    if (dx * dx + dy * dy < ANCHOR_CLEARANCE * ANCHOR_CLEARANCE) return false;
  }
  for (let i = 0; i < entries.length; i++) {
    const other = entries[i];
    if (other.protectAnchor) {
      const dx = x - other.x,
        dy = y - other.y;
      if (dx * dx + dy * dy < ANCHOR_CLEARANCE * ANCHOR_CLEARANCE) return false;
    }
    if (i < index) {
      const dx = x - other.pinX,
        dy = y - other.pinY;
      if (dx * dx + dy * dy < SEPARATION * SEPARATION) return false;
    }
  }
  return true;
}

// Only pinX/pinY are written. x/y remain the physical leader endpoints, while
// protectedTargets expose small unnumbered structures without creating pins.
export function layoutCompactPins(
  entries,
  width,
  height,
  zoomBounds = null,
  protectedTargets = EMPTY_TARGETS,
) {
  width = Number.isFinite(width) ? Math.max(0, width) : 0;
  height = Number.isFinite(height) ? Math.max(0, height) : 0;
  const left = Math.min(INSET, width / 2),
    right = Math.max(left, width - INSET),
    top = Math.min(INSET, height / 2),
    bottom = Math.max(top, height - INSET),
    zoomRight = zoomBounds?.right ?? width;
  if (
    zoomBounds &&
    (!Number.isFinite(zoomBounds.left) ||
      !Number.isFinite(zoomBounds.top) ||
      !Number.isFinite(zoomBounds.bottom) ||
      !Number.isFinite(zoomRight))
  )
    zoomBounds = null;

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index],
      anchorX = Number.isFinite(entry.x) ? entry.x : width / 2,
      anchorY = Number.isFinite(entry.y) ? entry.y : height / 2,
      baseX = clamp(anchorX, left, right),
      baseY = clamp(anchorY, top, bottom);
    entry.pinX = baseX;
    entry.pinY = baseY;
    if (
      available(
        entries,
        index,
        baseX,
        baseY,
        zoomBounds,
        zoomRight,
        protectedTargets,
      )
    )
      continue;

    let placed = false;
    for (const offset of offsets) {
      const x = clamp(baseX + offset.x * SEPARATION, left, right),
        y = clamp(baseY + offset.y * SEPARATION, top, bottom);
      if (
        !available(
          entries,
          index,
          x,
          y,
          zoomBounds,
          zoomRight,
          protectedTargets,
        )
      )
        continue;
      entry.pinX = x;
      entry.pinY = y;
      placed = true;
      break;
    }
    if (placed) continue;

    // A large toolbar or dense cluster can exhaust nearby candidates. Search a
    // bounded canvas grid and choose its nearest free point. If the viewport
    // cannot fit the pins, retain the clamped fallback rather than looping.
    const columns = Math.min(
        GRID_LIMIT,
        Math.floor((right - left) / SEPARATION) + 1,
      ),
      rows = Math.min(GRID_LIMIT, Math.floor((bottom - top) / SEPARATION) + 1);
    let bestDistance = Infinity;
    for (let row = 0; row < rows; row++) {
      const y = rows === 1 ? baseY : top + ((bottom - top) * row) / (rows - 1);
      for (let column = 0; column < columns; column++) {
        const x =
            columns === 1
              ? baseX
              : left + ((right - left) * column) / (columns - 1),
          dx = x - baseX,
          dy = y - baseY,
          distance = dx * dx + dy * dy;
        if (
          distance < bestDistance &&
          available(
            entries,
            index,
            x,
            y,
            zoomBounds,
            zoomRight,
            protectedTargets,
          )
        ) {
          entry.pinX = x;
          entry.pinY = y;
          bestDistance = distance;
        }
      }
    }
  }
  return entries;
}
