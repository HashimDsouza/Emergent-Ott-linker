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
    <section className="mb-5 md:mb-6">
      <div className="flex items-end justify-between mb-3 md:mb-4">
        <div>
          <div className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 md:gap-2.5">
            <span className="text-xl md:text-2xl">{icon}</span> 
            <span>{title}</span>
          </div>
          {subline && (
            <div className="text-xs md:text-sm italic mt-0.5 md:mt-1" style={{ color: "#FF4F64", opacity: 0.9 }}>
              {subline}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          <button 
            onClick={() => setExpanded(v => !v)} 
            className="text-white/70 hover:text-white transition-colors duration-200 font-medium"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.3)"
            }}
          >
            {expanded ? "Collapse" : "Go Deeper"}
          </button>
          <button 
            onClick={() => setVisible(false)} 
            className="text-white/60 hover:text-white/80 transition-colors duration-200"
          >
            Hide
          </button>
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