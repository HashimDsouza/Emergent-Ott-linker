import React, { useState } from "react";
import Tile from "./Tile";

export default function Tray({ icon, title, subline, items, onInfo, onShare, onAddToWatchlist }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return (
    <section className="mb-4 md:mb-6">
      <div className="flex items-end justify-between mb-2 md:mb-3">
        <div>
          <div className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">{icon} {title}</div>
          {subline && <div className="text-[10px] md:text-sm italic" style={{ color: "#FF4F64" }}>{subline}</div>}
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
          <button onClick={() => setVisible(true)} className="hover:text-white">Show</button>
        </div>
      </div>
    </section>
  );

  return (
    <section className="mb-3 md:mb-3">
      <div className="flex items-end justify-between mb-1.5 md:mb-2">
        <div>
          <div className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">{icon} {title}</div>
          {subline && <div className="text-[10px] md:text-sm italic" style={{ color: "#FF4F64" }}>{subline}</div>}
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
          <button onClick={() => setExpanded(v => !v)} className="hover:text-white">{expanded ? "Collapse" : "Go Deeper"}</button>
          <button onClick={() => setVisible(false)} className="hover:text-white">Hide</button>
        </div>
      </div>

      <div className={expanded 
        ? "flex gap-2 md:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" 
        : "grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3"
      }>
        {items?.map(it => (
          <div 
            key={it.id} 
            className={expanded ? "flex-none w-[30%] md:w-[18%] snap-start" : ""}
          >
            <Tile item={it} onInfo={onInfo} onShare={onShare} onAddToWatchlist={onAddToWatchlist} />
          </div>
        ))}
      </div>
    </section>
  );
}