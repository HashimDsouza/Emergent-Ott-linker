import React, { useEffect, useState } from "react";
import { mapApiToCard } from "../utils/mapApiToCard";

const coral = "#FF4F64", mint = "#30E0B2", charcoal = "#0E1514", charcoalSoft = "#173A35";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function HeroFrontCenter({ onInfo }) {
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch hero carousel content from API
  useEffect(() => {
    async function fetchHeroContent() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/content`);
        const data = await response.json();
        const heroItems = data.filter(item => item.category === 'hero').map(mapApiToCard);
        setHeroSlides(heroItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hero content:', error);
        setLoading(false);
      }
    }
    fetchHeroContent();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (heroSlides.length > 0) {
      const timer = setInterval(() => {
        setHeroIndex(i => (i + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroSlides.length]);

  if (loading || heroSlides.length === 0) {
    return (
      <section className="mb-4 md:mb-8">
        <div 
          className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${coral} 0%, ${mint} 55%, ${charcoalSoft} 100%)`,
            height: "200px"
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white/50">
            Loading...
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = heroSlides[heroIndex];

  const handleHeroClick = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/resolve-link?title_id=${currentSlide.id}&provider=${encodeURIComponent(currentSlide.platform)}`
      );
      const data = await response.json();
      
      if (data.scheme_url) {
        window.location.href = data.scheme_url;
        setTimeout(() => {
          window.open(data.url || data.fallback_search_url, '_blank');
        }, 1000);
      } else {
        window.open(data.url || data.fallback_search_url, '_blank');
      }
    } catch (error) {
      console.error('Error resolving hero link:', error);
    }
  };

  return (
    <section className="mb-4 md:mb-8">
      <div
        onClick={handleHeroClick}
        className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-xl cursor-pointer hover:border-white/20 transition hero-container"
        style={{ height: "200px" }}
      >
        <style>{`
          @media (min-width: 768px) {
            .hero-container {
              height: 350px !important;
            }
          }
        `}</style>

        {/* Background image - use backdrop if available, otherwise gradient */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: currentSlide.backdrop_path 
              ? `url(${currentSlide.backdrop_path})` 
              : `linear-gradient(135deg, ${coral} 0%, ${mint} 55%, ${charcoalSoft} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
        
        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: `linear-gradient(180deg, ${charcoal}66, transparent)` }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
        
        {/* Info button - bottom right */}
        <button 
          aria-label="More info"
          onClick={(e) => { 
            e.stopPropagation(); 
            onInfo?.(currentSlide); 
          }} 
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-50 inline-flex items-center justify-center"
        >
          <span 
            className="rounded-full w-[18px] h-[18px] md:w-[24px] md:h-[24px]" 
            style={{ 
              background: mint, 
              boxShadow: "0 0 12px rgba(48,224,178,0.6)" 
            }} 
          />
          <span 
            className="absolute text-[11px] md:text-[14px] font-bold" 
            style={{ color: charcoal }}
          >
            i
          </span>
        </button>

        {/* Text content - bottom left */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 md:px-6 md:pb-4">
          <div className="max-w-lg">
            {/* Line 1: Title */}
            <h1 className="text-base md:text-2xl font-bold leading-tight text-white">
              {currentSlide.title}
            </h1>
            
            {/* Line 2: Front & Center label */}
            <div className="flex items-center gap-1 md:gap-2 opacity-90 mt-0.5 mb-0.5">
              <span className="text-[10px] md:text-xs">🎥</span>
              <span className="uppercase tracking-wider text-[7px] md:text-[9px]">
                Front & Center
              </span>
            </div>
            
            {/* Line 3: Short descriptor */}
            <p className="italic text-white/90 text-[10px] md:text-sm mt-0.5">
              "{currentSlide.descriptor || currentSlide.tagline || "Trending now"}"
            </p>
            
            {/* Line 4: Platform + Rating */}
            <div className="mt-0.5 md:mt-1 flex items-center gap-1 md:gap-2 text-xs">
              <span 
                className="text-[8px] md:text-[10px] font-semibold"
                style={{ color: mint }}
              >
                {currentSlide.platform}
              </span>
              {currentSlide.imdb && currentSlide.imdb !== "N/A" && currentSlide.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${currentSlide.imdb_id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/85 text-[9px] md:text-xs font-semibold hover:opacity-80 transition"
                  style={{ color: '#fbbf24' }}
                >
                  ⭐ {typeof currentSlide.imdb === 'number' ? currentSlide.imdb.toFixed(1) : currentSlide.imdb}
                </a>
              )}
              {currentSlide.imdb && currentSlide.imdb !== "N/A" && !currentSlide.imdb_id && (
                <span className="text-white/85 text-[9px] md:text-xs font-semibold" style={{ color: '#fbbf24' }}>
                  ⭐ {typeof currentSlide.imdb === 'number' ? currentSlide.imdb.toFixed(1) : currentSlide.imdb}
                </span>
              )}
            </div>
            
            {/* Line 5: Buzz Meter */}
            <div className="mt-1 md:mt-1.5 flex items-center gap-1 md:gap-2 text-[7px] md:text-[10px] uppercase tracking-wider opacity-85">
              <span className="md:hidden">BUZZ</span>
              <span className="hidden md:inline">BUZZ METER</span>
              <a 
                href={currentSlide.social_links?.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(currentSlide.title + ' trailer')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Trending on YouTube"
              >
                <svg width="10" height="10" className="md:w-[13px] md:h-[13px]" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41.6 41.6 0 0 0 0 12a41.6 41.6 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41.6 41.6 0 0 0 24 12a41.6 41.6 0 0 0-.5-5.8Z"/><path fill="#fff" d="m10 15 6-3-6-3v6z"/></svg>
              </a>
              <a 
                href={currentSlide.social_links?.twitter || `https://twitter.com/search?q=${encodeURIComponent(currentSlide.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Buzzing on X"
              >
                <svg width="10" height="10" className="md:w-[13px] md:h-[13px]" viewBox="0 0 24 24"><path fill="#ffffff" d="M18.146 2H21l-6.5 7.43L22.5 22h-6.59l-5.16-6.64L4.7 22H2l6.97-7.97L1.5 2H8.09l4.66 6L18.146 2Zm-2.31 18.5h1.71L7.25 3.46H5.43l10.41 17.04Z"/></svg>
              </a>
              <a 
                href={currentSlide.social_links?.reddit || `https://www.reddit.com/search/?q=${encodeURIComponent(currentSlide.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Hot in threads"
              >
                <svg width="10" height="10" className="md:w-[13px] md:h-[13px]" viewBox="0 0 24 24"><path fill="#FF4500" d="M22 12.07c0-1.2-.98-2.18-2.18-2.18-.56 0-1.07.21-1.45.55-1.44-.94-3.23-1.54-5.2-1.61l1.11-3.51 3.06.72a1.64 1.64 0 1 0 .19-1.1l-3.6-.85a.7.7 0 0 0-.84.46l-1.4 4.42c-1.97.05-3.76.64-5.21 1.58a2.18 2.18 0 1 0-2.64 3.45c-.05.24-.08.49-.08.74 0 2.87 3.58 5.2 8 5.2s8-2.33 8-5.2c0-.25-.03-.5-.09-.74.5-.4.84-1 .84-1.73Z"/></svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <button 
          aria-label="Prev" 
          onClick={(e) => { 
            e.stopPropagation(); 
            setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length); 
          }} 
          className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 md:w-9 md:h-9 text-sm md:text-base z-10"
        >
          ‹
        </button>
        <button 
          aria-label="Next" 
          onClick={(e) => { 
            e.stopPropagation(); 
            setHeroIndex(i => (i + 1) % heroSlides.length); 
          }} 
          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 md:w-9 md:h-9 text-sm md:text-base z-10"
        >
          ›
        </button>
        
        {/* Slide indicators */}
        <div className="absolute bottom-1 md:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-2 z-10">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={(e) => { e.stopPropagation(); setHeroIndex(idx); }}
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition ${
                idx === heroIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
