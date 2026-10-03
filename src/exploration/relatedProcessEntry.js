// A structure may belong to one particular branch of a process. Preserve a
// previous visit unless its branch differs from the selected anatomical entry.
export function prepareRelatedProcessEntry(previous, item) {
  const parameters = { ...previous?.parameters, ...item.entryParameters };
  const branchChanged = Object.entries(item.entryParameters || {}).some(
    ([key, value]) => previous?.parameters?.[key] !== value,
  );
  return {
    ...previous,
    progress:
      !previous || branchChanged ? item.entryProgress || 0 : previous.progress,
    ...(Object.keys(parameters).length ? { parameters } : {}),
  };
}
