import React from "react";
import { Camera, Columns2, Share2 } from "lucide-react";

export default function SceneActions({
  lang,
  ready,
  onStudio,
  onShare,
  onCompare,
}) {
  const en = lang === "en";
  return (
    <div
      className="scene-actions"
      role="group"
      aria-label={en ? "Create and explore" : "创作与探索"}
    >
      {onCompare && (
        <button onClick={onCompare}>
          <Columns2 size={15} />
          {en ? "Compare" : "对比"}
        </button>
      )}
      <button onClick={onStudio} disabled={!ready}>
        <Camera size={15} />
        {en ? "Studio" : "影像工作台"}
      </button>
      <button onClick={onShare}>
        <Share2 size={15} />
        {en ? "Share" : "分享"}
      </button>
    </div>
  );
}
