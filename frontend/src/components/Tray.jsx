import React, { useState } from "react";
import Tile from "./Tile";

export default function Tray({ icon, title, subline, items, onInfo }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return (
    <section className="mb-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">{icon} {title}</div>
          {subline && <div className="text-sm" style={{ color: "#FF4F64" }}>{subline}</div>}
        </div>
        <div className="flex items-center gap-4 text-sm text-white/85">
          <button onClick={() => setVisible(true)} className="hover:text-white">Show</button>
        </div>
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
          <button onClick={() => setExpanded(v => !v)} className="hover:text-white">{expanded ? "Collapse" : "Go Deeper"}</button>
          <button onClick={() => setVisible(false)} className="hover:text-white">Hide</button>
        </div>
      </div>

      <div className={expanded 
        ? "flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" 
        : "grid grid-cols-3 gap-2 md:gap-3"
      }>
        {items?.map(it => (
          <div 
            key={it.id} 
            className={expanded ? "flex-none w-[30%] snap-start" : ""}
          >
            <Tile item={it} onInfo={onInfo} />
          </div>
        ))}
      </div>
    </section>
  );
}