import React from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const coral = "#FF4F64", mint = "#30E0B2";

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
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(780px,90vw)] max-h-[70vh] md:max-h-[85vh] overflow-y-auto rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl transition ${open ? "opacity-100 scale-100" : "opacity-0 scale-95"}`} style={{ background: "linear-gradient(180deg, rgba(15,19,18,0.95), rgba(23,58,53,0.95))" }}>
        <div className="p-3 md:p-5 flex items-start justify-between text-white">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-12 h-16 md:w-14 md:h-20 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
              {item?.thumbnail ? (
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-coral/20 to-mint/20" />
              )}
            </div>
            <div>
              <div className="text-base md:text-lg font-semibold">{item?.title || "Title Name"}</div>
              <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 text-[10px] md:text-xs">
                <span className={badge}>{item?.platform || "JioHotstar"}</span>
                {item?.imdb && <span className={badge}>⭐ {typeof item.imdb === 'number' ? item.imdb.toFixed(1) : item.imdb}</span>}
                {/* Dynamic metadata capsule: year • episodes • language */}
                <span className={badge}>
                  {item?.year || "N/A"}
                  {item?.episodes && ` • ${item.episodes} eps`}
                  {item?.language && ` • ${item.language}`}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/80 hover:text-white text-xl">×</button>
        </div>
        <div className="px-3 md:px-5 pb-3 md:pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 text-white/90">
          <div>
            <div className="text-xs md:text-sm leading-5 md:leading-6">{item?.description || "A compact, cinematic synopsis (3–5 lines) that gives just enough to decide. Crisp, human copy — no clutter."}</div>
            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3">
              {(item?.genres || ["Thriller","Heist","Dark Comedy"]).map((t, idx) => <span key={idx} className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-white/15 bg-white/5">{t}</span>)}
            </div>
            
            {/* Cast Section */}
            {item?.cast && item.cast.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wider opacity-60 mb-2">Cast</div>
                <div className="flex flex-wrap gap-2">
                  {item.cast.slice(0, 5).map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-white/15 bg-white/5">
                      {member.profile_url && (
                        <img 
                          src={member.profile_url} 
                          alt={member.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      )}
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-80">Buzz Meter</div>
            <div className="flex items-center gap-3 mt-1">
              {item?.trailer_url ? (
                <a 
                  href={item.trailer_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  YouTube
                </a>
              ) : (
                <a 
                  href={item?.social_links?.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(item?.title || '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  YouTube
                </a>
              )}
              <a 
                href={item?.social_links?.twitter || `https://twitter.com/search?q=${encodeURIComponent((item?.title || '') + ' movie')}&f=live`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                onClick={(e) => e.stopPropagation()}
              >
                X
              </a>
              <a 
                href={item?.social_links?.reddit || `https://www.reddit.com/search/?q=${encodeURIComponent(item?.title || '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                onClick={(e) => e.stopPropagation()}
              >
                Reddit
              </a>
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