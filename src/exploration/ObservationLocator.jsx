import React, { useState } from "react";

export default function ObservationLocator({
  api,
  mode,
  lang,
  onReset,
  onFocus,
  onSelect,
}) {
  const [selected, setSelected] = useState("");
  const targets = api?.getObservationTargets?.(mode, lang) ?? [];
  if (!targets.length) return null;
  const en = lang === "en";
  return (
    <label className="observation-locator">
      <span>{en ? "Locate in this model" : "在模型中定位"}</span>
      <select
        value={selected}
        onChange={(event) => {
          const key = event.target.value;
          onSelect?.();
          if (!key) {
            setSelected("");
            onReset();
          } else if (api.focusObservation(key)) {
            setSelected(key);
            onFocus(api.getView());
          }
        }}
      >
        <option value="">{en ? "Entire specimen" : "完整视野"}</option>
        {targets.map((target) => (
          <option key={target.key} value={target.key}>
            {target.label}
          </option>
        ))}
      </select>
    </label>
  );
}
