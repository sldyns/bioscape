export function resolveStageCopy(stage, parameters) {
  const copy = stage.conditionCopy?.find(({ when }) =>
    Object.entries(when).every(([key, value]) => parameters[key] === value),
  );
  return copy
    ? { ...stage, title: copy.title, description: copy.description }
    : stage;
}
