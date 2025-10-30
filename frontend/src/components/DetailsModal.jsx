import React from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function DetailsModal({ open, onClose, item }) {
  const badge = "text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15";
  
  const handleWatchNow = async () => {
    if (!item?.id || !item?.platform) return;
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/resolve-link?title_id=${item.id}&provider=${encodeURIComponent(item.platform)}`
      );
      const data = await response.json();
      
      // Try deep link first, fallback to web
      if (data.scheme_url) {
        window.location.href = data.scheme_url;
        setTimeout(() => {
          window.open(data.url || data.fallback_search_url, '_blank');
        }, 1000);
      } else {
        window.open(data.url || data.fallback_search_url, '_blank');
      }
    } catch (error) {
      console.error('Error resolving link:', error);
    }
  };
  
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(780px,92vw)] rounded-3xl border border-white/10 shadow-2xl transition ${open ? "opacity-100 scale-100" : "opacity-0 scale-95"}`} style={{ background: "linear-gradient(180deg, rgba(15,19,18,0.95), rgba(23,58,53,0.95))" }}>
        <div className="p-5 flex items-start justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-20 rounded-lg bg-white/5 border border-white/10" />
            <div>
              <div className="text-lg font-semibold">{item?.title || "Title Name"}</div>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className={badge}>{item?.platform || "JioHotstar"}</span>
                {item?.imdb && <span className={badge}>⭐ {item.imdb}</span>}
                <span className={badge}>2025 • 8 eps • Hindi</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/80 hover:text-white text-xl">×</button>
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white/90">
          <div>
            <div className="text-sm leading-6">A compact, cinematic synopsis (3–5 lines) that gives just enough to decide. Crisp, human copy — no clutter.</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Thriller","Heist","Dark Comedy"].map(t => <span key={t} className="text-xs px-2 py-1 rounded-full border border-white/15 bg-white/5">{t}</span>)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-80">Buzz Meter</div>
            <div className="flex items-center gap-3 mt-1">
              <a href="#yt" className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5">YouTube</a>
              <a href="#x" className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5">X</a>
              <a href="#rd" className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5">Reddit</a>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-white/10 bg-white/5">❤️</button>
              <button className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-white/10 bg-white/5">👎</button>
              <button className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-white/10 bg-white/5">💬</button>
              <button onClick={handleWatchNow} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"><span className="text-xs">Watch on {item?.platform || "JioHotstar"} ↗</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}