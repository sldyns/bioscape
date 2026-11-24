import React, { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { searchComparisonEntries } from "../compare/catalog.js";
import { getNode } from "../hierarchy.js";
import { exploreSceneHash } from "./routes.js";

export default function StructureMatches({ query, lang, follow }) {
  const entries = useMemo(() => searchComparisonEntries(query), [query]);
  const [limit, setLimit] = useState(12);
  const en = lang === "en";
  return (
    <div className="home-structure-results">
      <p role="status">
        {entries.length
          ? en
            ? `${entries.length} matching paths`
            : `找到 ${entries.length} 条结构路径`
          : en
            ? "No matching structure. Try its Chinese or English name."
            : "未找到结构，可尝试中文名或英文名。"}
      </p>
      {entries.length > 0 && (
        <ul>
          {entries.slice(0, limit).map((entry) => {
            const path = [...entry.trail, entry.id];
            const href = "#/" + path.join("/");
            return (
              <li key={href}>
                <a
                  href={exploreSceneHash(href, lang)}
                  onClick={(event) => follow(event, href)}
                >
                  <span>
                    <strong>{entry[lang]}</strong>
                    <small>
                      {entry.trail.length
                        ? entry.trail
                            .map((id) => getNode(id, lang).name)
                            .join(" › ")
                        : en
                          ? "Whole specimen"
                          : "整体标本"}
                    </small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {entries.length > limit && (
        <button
          type="button"
          className="home-browse-all"
          onClick={() => setLimit(limit + 12)}
        >
          {en ? "Show more paths" : "显示更多路径"}
        </button>
      )}
    </div>
  );
}
