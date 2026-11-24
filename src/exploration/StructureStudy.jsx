import React, { useState } from "react";
import ObservationPlate, {
  plateAspect,
} from "../components/ObservationPlate.jsx";
import { turnedView } from "../scene/specimenViews.js";
import specimenAngles from "../scene/specimenAngles.json" with { type: "json" };

export default function StructureStudy({
  nodeId,
  apiRef,
  ready,
  mode,
  lang,
  name,
  stopRotation,
  onView,
  onReset,
}) {
  const [plate, setPlate] = useState(null);
  const [selected, setSelected] = useState("");
  const en = lang === "en";
  const api = ready ? apiRef.current : null;
  const targets = api?.getObservationTargets?.(mode, lang) ?? [];
  const openPlate = () => {
    if (!api?.ready) return;
    stopRotation();
    const view = api.getView();
    if (!view) return;
    const labels = en
      ? ["Current view", "Quarter turn", "Opposite view", "Oblique detail"]
      : ["当前视角", "侧面", "背面", "形态斜视"];
    const angles = [
      [0, 0],
      [90, 0],
      [180, 0],
      specimenAngles[nodeId] ?? [-65, 32],
    ];
    setPlate({
      scene: api,
      title: en ? "Specimen views" : "标本视角",
      subtitle: name,
      frames: angles.map(([yaw, pitch], i) => {
        const frameView = turnedView(
          view,
          (yaw * Math.PI) / 180,
          (pitch * Math.PI) / 180,
        );
        const framed = api.getObservationFrame(view, frameView, plateAspect);
        const detail = pitch
          ? en
            ? `${yaw}° · tilt ${pitch}°`
            : `${yaw}° · 仰角偏移 ${pitch}°`
          : yaw + "°";
        return {
          key: i,
          label: labels[i],
          detail,
          options: { view: framed.captureView },
          view: framed.view,
        };
      }),
    });
  };
  return (
    <section
      className="structure-study"
      aria-label={en ? "Inspect the specimen" : "观察标本"}
    >
      <button
        className="study-action"
        type="button"
        onClick={openPlate}
        disabled={!api?.ready}
      >
        {en ? "Compare four views" : "四面视角对照"}
      </button>
      {targets.length > 0 && (
        <label>
          <span>{en ? "Locate in this model" : "在模型中定位"}</span>
          <select
            value={selected}
            onChange={(event) => {
              const key = event.target.value;
              stopRotation();
              if (!key) {
                setSelected("");
                onReset();
                return;
              }
              if (api.focusObservation(key)) {
                setSelected(key);
                onView(api.getView());
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
      )}
      {plate && plate.scene === api && (
        <ObservationPlate
          plate={plate}
          lang={lang}
          onClose={() => setPlate(null)}
          onChoose={(frame) => {
            if (
              apiRef.current === plate.scene &&
              plate.scene.setView(frame.view)
            )
              onView(plate.scene.getView());
            setPlate(null);
          }}
        />
      )}
    </section>
  );
}
