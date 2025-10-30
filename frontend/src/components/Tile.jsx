import React from "react";

const coral = "#FF4F64", mint = "#30E0B2", charcoalSoft = "#173A35";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Tile({ item, onInfo }) {
  const badgeCls = "text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15";
  const counter = "text-[8px] md:text-[10px] opacity-75";
  
  // State for interactive buttons
  const [liked, setLiked] = React.useState(false);
  const [disliked, setDisliked] = React.useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    if (!item?.id || !item?.platform) return;
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/resolve-link?title_id=${item.id}&provider=${encodeURIComponent(item.platform)}`
      );
      const data = await response.json();
      
      // Try to open deep link first (for mobile), fallback to web URL
      if (data.scheme_url) {
        window.location.href = data.scheme_url;
        // Fallback to web after 1 second if app doesn't open
        setTimeout(() => {
          window.open(data.url || data.fallback_search_url, '_blank');
        }, 1000);
      } else {
        window.open(data.url || data.fallback_search_url, '_blank');
      }
    } catch (error) {
      console.error('Error resolving link:', error);
      // Fallback: search on the platform
      const platform = item.platform.toLowerCase().replace(' ', '');
      window.open(`https://www.${platform}.com/`, '_blank');
    }
  };

  return (
    <div onClick={handleClick} className="relative block rounded-lg md:rounded-xl overflow-hidden shadow-lg border border-white/10 hover:-translate-y-0.5 transition cursor-pointer">
      {/* Poster - 2:3 aspect ratio to give more vertical space */}
      <div className="relative" style={{ aspectRatio: "2/3", background: `linear-gradient(135deg, ${coral}70 0%, ${mint}45 45%, ${charcoalSoft} 100%)` }}>
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/90 to-transparent" />
      </div>

      {/* Compact overlay - small at bottom, same format as web */}
      <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5 md:p-3 text-white" style={{ fontSize: '7px' }}>
        {/* Line 1: Platform + social icons (heart, thumbs, comments) */}
        <div className="flex items-center gap-0.5 md:gap-2 mb-0.5 md:mb-1">
          <span className="text-[7px] md:text-[10px] px-1 py-0.5 rounded-full bg-white/10 border border-white/15 flex-shrink-0">{item.platform || "JioHotstar"}</span>
          <span className="inline-flex items-center gap-0.5 opacity-90 text-[7px] md:text-xs">❤️ <span>1.2k</span></span>
          <span className="inline-flex items-center gap-0.5 opacity-90 text-[7px] md:text-xs">👎 <span>120</span></span>
          <span className="inline-flex items-center gap-0.5 opacity-90 text-[7px] md:text-xs">💬 <span>320</span></span>
        </div>

        {/* Line 2: BUZZ + social media icons */}
        <div className="flex items-center gap-0.5 md:gap-1.5 uppercase tracking-wide opacity-85 mb-0.5 md:mb-1 text-[7px] md:text-[9px]">
          <span>BUZZ</span>
          <a 
            href={item.buzz?.yt || `https://www.youtube.com/results?search_query=${encodeURIComponent((item.title || 'trending') + ' trailer')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="9" height="9" className="md:w-3 md:h-3" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41.6 41.6 0 0 0 0 12a41.6 41.6 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41.6 41.6 0 0 0 24 12a41.6 41.6 0 0 0-.5-5.8Z"/><path fill="#fff" d="m10 15 6-3-6-3v6z"/></svg>
          </a>
          <a 
            href={item.buzz?.x || `https://twitter.com/search?q=${encodeURIComponent(item.title || 'trending')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="9" height="9" className="md:w-3 md:h-3" viewBox="0 0 24 24"><path fill="#ffffff" d="M18.146 2H21l-6.5 7.43L22.5 22h-6.59l-5.16-6.64L4.7 22H2l6.97-7.97L1.5 2H8.09l4.66 6L18.146 2Zm-2.31 18.5h1.71L7.25 3.46H5.43l10.41 17.04Z"/></svg>
          </a>
          <a 
            href={item.buzz?.reddit || `https://www.reddit.com/search/?q=${encodeURIComponent(item.title || 'trending')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="9" height="9" className="md:w-3 md:h-3" viewBox="0 0 24 24"><path fill="#FF4500" d="M22 12.07c0-1.2-.98-2.18-2.18-2.18-.56 0-1.07.21-1.45.55-1.44-.94-3.23-1.54-5.2-1.61l1.11-3.51 3.06.72a1.64 1.64 0 1 0 .19-1.1l-3.6-.85a.7.7 0 0 0-.84.46l-1.4 4.42c-1.97.05-3.76.64-5.21 1.58a2.18 2.18 0 1 0-2.64 3.45c-.05.24-.08.49-.08.74 0 2.87 3.58 5.2 8 5.2s8-2.33 8-5.2c0-.25-.03-.5-.09-.74.5-.4.84-1 .84-1.73Z"/></svg>
          </a>
        </div>

        {/* Line 3: Trending text + info button */}
        <div className="flex items-center gap-0.5 md:gap-1.5">
          <div className="italic flex-1 line-clamp-1 text-[7px] md:text-[10px]" style={{ color: coral }}>{item.descriptor || "Trending"}</div>
          <button aria-label="More info" onClick={(e) => { e.stopPropagation(); onInfo?.(item); }} className="relative inline-flex items-center justify-center flex-shrink-0">
            <span className="rounded-full" style={{ background: mint, width: 14, height: 14, boxShadow: "0 0 10px rgba(48,224,178,0.4)" }} />
            <span className="absolute text-[8px] md:text-[10px] font-bold" style={{ color: "#0E1514" }}>i</span>
          </button>
        </div>
      </div>
    </div>
  );
}