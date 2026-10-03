// Completed worker payloads contain CPU data only. Geometry/texture arrays are
// immutable after construction and can be shared by independent scene wrappers.
// Bound retention: the full-resolution animal cell alone uses about 177 MiB.
export function createPreparedModelCache({
  maxBytes = 224 * 1024 * 1024,
  maxEntries = 8,
} = {}) {
  const entries = new Map();
  let bytes = 0;
  const remove = (key) => {
    const entry = entries.get(key);
    if (!entry) return;
    bytes -= entry.bytes;
    entries.delete(key);
  };
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      entries.delete(key);
      entries.set(key, entry);
      return entry.payload;
    },
    set(key, payload) {
      const buffers = new Set(),
        visited = new Set();
      function visit(value) {
        if (!value || typeof value !== "object" || visited.has(value)) return;
        visited.add(value);
        if (ArrayBuffer.isView(value)) buffers.add(value.buffer);
        else if (value instanceof ArrayBuffer) buffers.add(value);
        else for (const child of Object.values(value)) visit(child);
      }
      visit(payload);
      const size = [...buffers].reduce(
        (sum, buffer) => sum + buffer.byteLength,
        0,
      );
      // An oversized result must not evict the useful existing working set.
      if (size > maxBytes || maxEntries < 1) return false;
      remove(key);
      while (entries.size >= maxEntries || bytes + size > maxBytes)
        remove(entries.keys().next().value);
      entries.set(key, { payload, bytes: size });
      bytes += size;
      return true;
    },
    clear() {
      entries.clear();
      bytes = 0;
    },
    get size() {
      return entries.size;
    },
    get byteLength() {
      return bytes;
    },
  };
}

export const preparedModelCache = createPreparedModelCache();
