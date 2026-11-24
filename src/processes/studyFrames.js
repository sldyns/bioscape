import moments from "./studyMoments.json" with { type: "json" };

export function sceneTime(progress, duration) {
  const seconds = Math.round(progress * duration);
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

export function stageFrames(
  definition,
  stages,
  rootId,
  parameters,
  lang,
  view,
  reference = false,
) {
  const entry = moments.processes[definition.id];
  const defaults = (definition.controls ?? []).every(
    (c) => parameters[c.id] === c.default,
  );
  const fractions = defaults
    ? (entry?.roots?.[rootId] ?? entry?.default)
    : null;
  return stages.map((stage, index) => {
    const end = stages[index + 1]?.at ?? 1;
    const percent =
      fractions?.[index] ?? (index === stages.length - 1 ? 100 : 50);
    const progress = stage.at + ((end - stage.at) * percent) / 100;
    const label = reference
      ? (lang === "en" ? "Observation " : "观察时刻 ") + (index + 1)
      : stage.title[lang];
    return {
      key: index,
      label,
      detail: sceneTime(progress, definition.duration),
      options: { progress, view },
    };
  });
}

export function stageStop(stages, index) {
  const next = stages[index + 1];
  // The live chapter changes at at − 1e-5 to absorb numeric drift. Keep the
  // paused pose and its caption in the chapter the visitor chose to study.
  return next ? Math.max(stages[index].at, next.at - 0.00002) : 1;
}
