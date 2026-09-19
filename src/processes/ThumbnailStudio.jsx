import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import ProcessScene from "./ProcessScene.jsx";
import { processCatalog, processesByRoot } from "./catalog.js";
import { processLoaders } from "./loaders.js";
const query = new URLSearchParams(location.search);
function Studio() {
  const [id, setId] = useState(query.get("process") || "transcription");
  const [progress, setProgress] = useState(Number(query.get("frame") || 0.55));
  const [definition, setDefinition] = useState(null);
  const [parameters, setParameters] = useState({});
  const [error, setError] = useState("");
  const rootId =
    query.get("root") ||
    Object.keys(processesByRoot).find((r) => processesByRoot[r].includes(id));
  const contextualDefinition = useMemo(
    () => definition && { ...definition, ...definition.contexts?.[rootId] },
    [definition, rootId],
  );
  useEffect(() => {
    let active = true;
    setDefinition(null);
    setError("");
    const load = processLoaders[id];
    if (!load) {
      setError(`Unknown process: ${id}`);
      return;
    }
    load()
      .then((m) => {
        if (active) {
          const contextual = { ...m.default, ...m.default.contexts?.[rootId] };
          setParameters(
            Object.fromEntries(
              (contextual.controls ?? []).map((c) => {
                const requested = query.get(c.id);
                return [
                  c.id,
                  c.options.some((o) => o.value === requested)
                    ? requested
                    : c.default,
                ];
              }),
            ),
          );
          setDefinition(m.default);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, rootId]);
  return (
    <>
      <div className="studio-frame">
        {definition ? (
          <ProcessScene
            key={`${rootId}:${id}`}
            definition={contextualDefinition}
            annotations={false}
            rootId={rootId}
            progress={progress}
            lang="en"
            parameters={parameters}
          />
        ) : (
          <p>{error || "Preparing model…"}</p>
        )}
      </div>
      <div className="studio-controls">
        <label>
          Model{" "}
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {Object.values(processCatalog).map((e) => (
              <option key={e.id} value={e.id}>
                {e.title.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          Frame{" "}
          <input
            type="range"
            min="0"
            max="1"
            step=".001"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
        </label>
        <output>
          {id} · {progress}
        </output>
        {(contextualDefinition?.controls ?? []).map((control) => (
          <label key={control.id}>
            {control.label.en}
            <select
              value={parameters[control.id]}
              onChange={(event) => {
                const value = event.target.value;
                setParameters((current) => ({
                  ...current,
                  [control.id]: value,
                }));
              }}
            >
              {control.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label.en}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </>
  );
}
const style = document.createElement("style");
style.textContent = `*{box-sizing:border-box}body{margin:0;background:#f5f5f7;font:13px system-ui;color:#333}.studio-frame{width:640px;height:640px;margin:0 auto;position:relative}.process-scene-shell{position:absolute;inset:0}.process-annotation-key{display:none}.process-canvas{position:absolute;inset:0;overflow:hidden}.process-canvas>canvas{display:block;width:100%;height:100%}.process-model-labels{display:none}.studio-controls{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px}select{max-width:240px}label{display:flex;gap:8px;align-items:center}`;
document.head.append(style);
createRoot(document.getElementById("root")).render(<Studio />);
