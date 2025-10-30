import React, { useMemo, useEffect, useState } from "react";

const coral = "#FF4F64", mint = "#30E0B2", charcoal = "#0E1514", charcoalSoft = "#173A35";

export default function HeroFrontCenter() {
  const hero = useMemo(() => ({
    title: "Fighter",
    tagline: "Sky is the limit",
    platform: "JioHotstar",
    rating: 8.2,
    slides: [1,2,3,4,5].map(i => ({
      id: i,
      poster: `linear-gradient(135deg, ${coral} 0%, ${mint} 55%, ${charcoalSoft} 100%)`
    }))
  }), []);

  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % hero.slides.length), 5000);
    return () => clearInterval(t);
  }, [hero.slides.length]);

  return (
    <section className="mb-8">
      <div
        className="relative rounded-3xl overflow-hidden border border-white/10 shadow-xl"
        style={{ background: hero.slides[heroIndex].poster }}
      >
        <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: `linear-gradient(180deg, ${charcoal}66, transparent)` }} />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="relative p-6 md:p-10 text-white">
          <div className="flex items-center gap-2 opacity-90 mb-1">
            <span>🎥</span><span className="uppercase tracking-wider text-xs">Front & Center</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{hero.title}</h1>
          <p className="italic text-white/90 mt-1 md:text-lg">“{hero.tagline}”</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15">{hero.platform}</span>
            <span className="text-white/85">⭐ {hero.rating}</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[12px] uppercase tracking-wider opacity-85">
            <span>Buzz Meter</span>
            <a 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(hero.title + ' trailer')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Trending on YouTube"
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41.6 41.6 0 0 0 0 12a41.6 41.6 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41.6 41.6 0 0 0 24 12a41.6 41.6 0 0 0-.5-5.8Z"/><path fill="#fff" d="m10 15 6-3-6-3v6z"/></svg>
            </a>
            <a 
              href={`https://twitter.com/search?q=${encodeURIComponent(hero.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Buzzing on X"
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#ffffff" d="M18.146 2H21l-6.5 7.43L22.5 22h-6.59l-5.16-6.64L4.7 22H2l6.97-7.97L1.5 2H8.09l4.66 6L18.146 2Zm-2.31 18.5h1.71L7.25 3.46H5.43l10.41 17.04Z"/></svg>
            </a>
            <a 
              href={`https://www.reddit.com/search/?q=${encodeURIComponent(hero.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Hot in threads"
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#FF4500" d="M22 12.07c0-1.2-.98-2.18-2.18-2.18-.56 0-1.07.21-1.45.55-1.44-.94-3.23-1.54-5.2-1.61l1.11-3.51 3.06.72a1.64 1.64 0 1 0 .19-1.1l-3.6-.85a.7.7 0 0 0-.84.46l-1.4 4.42c-1.97.05-3.76.64-5.21 1.58a2.18 2.18 0 1 0-2.64 3.45c-.05.24-.08.49-.08.74 0 2.87 3.58 5.2 8 5.2s8-2.33 8-5.2c0-.25-.03-.5-.09-.74.5-.4.84-1 .84-1.73Z"/></svg>
            </a>
          </div>
        </div>
        <button aria-label="Prev" onClick={() => setHeroIndex(i => (i - 1 + hero.slides.length) % hero.slides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9">‹</button>
        <button aria-label="Next" onClick={() => setHeroIndex(i => (i + 1) % hero.slides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9">›</button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {hero.slides.map((s, idx) => <span key={s.id} className={`w-2 h-2 rounded-full ${idx === heroIndex ? "bg-white" : "bg-white/50"}`} />)}
        </div>
      </div>
    </section>
  );
}