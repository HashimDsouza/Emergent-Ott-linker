import React, { useState } from "react";
import Tile from "./Tile";

export default function Tray({ icon, title, subline, items, onInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return (
    <section className="mb-6">
      <div className="flex items-center gap-3 text-sm text-white/85">
        <button onClick={() => setVisible(true)} className="hover:text-white underline">Show {title}</button>
      </div>
    </section>
  );

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">{icon} {title}</div>
          {subline && <div className="text-sm" style={{ color: "#FF4F64" }}>{subline}</div>}
        </div>
        <div className="flex items-center gap-4 text-sm text-white/85">
          <button onClick={() => setExpanded(v => !v)} className="hover:text-white">{expanded ? "Hide" : "Go Deeper"}</button>
          <button onClick={() => setVisible(false)} className="hover:text-white">Collapse</button>
        </div>
      </div>

      <div className={expanded ? "overflow-x-auto pb-2" : ""}>
        <div className={expanded ? "flex gap-4 min-w-[1100px]" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"}>
          {items?.map(it => (
            <div key={it.id} className="min-w-[320px]">
              <Tile item={it} onInfo={onInfo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}