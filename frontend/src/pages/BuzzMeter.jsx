import React, { useState, useEffect } from "react";
import { mapApiToCard } from "../utils/mapApiToCard";
import Tile from "../components/Tile";
import DetailsModal from "../components/DetailsModal";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";

const coral = "#FF4F64", mint = "#30E0B2", charcoal = "#0E1514", charcoalSoft = "#173A35";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function BuzzMeter() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [visibleFromTheFeeds, setVisibleFromTheFeeds] = useState(true);
  const [expandedFromTheFeeds, setExpandedFromTheFeeds] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState(null);

  // Platform icons configuration (text-based for now, logos to be added)
  const platforms = [
    { name: "All", label: "All" },
    { name: "YouTube", label: "YT" },
    { name: "X", label: "X" },
    { name: "Reddit", label: "Reddit" },
    { name: "IMDb", label: "IMDb" },
  ];

  // Static curated Buzz Meter moments (Phase 1A) - Using gradient placeholders
  const buzzMoments = [
    {
      id: 'buzz-1',
      title: 'Fighter Trailer',
      platform: 'YouTube',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23FF4F64;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%2330E0B2;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g1)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EFighter%3C/text%3E%3C/svg%3E',
      headline: 'Fighter Trailer hits 25M views in 12 hours',
      buzzScore: 95,
      tags: ['OTT', 'Bollywood'],
      stats: { views: '25M', comments: '45K', shares: '120K' },
      summary: 'Hrithik Roshan and Deepika Padukone starrer Fighter trailer breaks YouTube records with massive viewership spike.',
      broQuip: "Fighter broke YouTube — and the internet's patience.",
      ctaLink: 'https://www.youtube.com/watch?v=T6T0ouFer2A',
      category: 'hero'
    },
    {
      id: 'buzz-2',
      title: 'ICC World Cup Final',
      platform: 'YouTube',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2330E0B2;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%23FF4F64;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g2)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EICC%20Final%3C/text%3E%3C/svg%3E',
      headline: 'India vs Australia Final - Last Over Drama',
      buzzScore: 88,
      tags: ['Sports', 'Cricket'],
      stats: { views: '12M', comments: '89K', shares: '200K' },
      summary: 'The most thrilling cricket final in years. Last-over six seals India\'s victory.',
      broQuip: "This clip is everywhere — except your WhatsApp group chat (so far).",
      ctaLink: 'https://www.youtube.com/results?search_query=ICC+World+Cup+Final',
      category: 'hero'
    },
    {
      id: 'buzz-3',
      title: 'Kapil Sharma Goes Viral',
      platform: 'X',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23FF8C42;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%2330E0B2;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g3)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EKapil%20Sharma%3C/text%3E%3C/svg%3E',
      headline: 'Kapil\'s Akshay Kumar roast becomes #1 trending',
      buzzScore: 82,
      tags: ['Comedy', 'Entertainment'],
      stats: { views: '5M', comments: '450K', shares: '89K' },
      summary: 'Kapil Sharma\'s hilarious roast of Akshay Kumar goes viral on X with 450K likes.',
      broQuip: "Kapil clips, and dragon drama — all trending harder than deadlines.",
      ctaLink: 'https://twitter.com/search?q=Kapil+Sharma',
      category: 'hot_drop'
    },
    {
      id: 'buzz-4',
      title: 'House of the Dragon S2 Finale',
      platform: 'Reddit',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g4" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23FF4F64;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%23FF8C42;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g4)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EHOTD%3C/text%3E%3C/svg%3E',
      headline: 'HOTD fans debate shocking finale twist',
      buzzScore: 90,
      tags: ['OTT', 'Fantasy'],
      stats: { views: '8M', comments: '15K', shares: '45K' },
      summary: 'Reddit goes wild as House of the Dragon Season 2 finale leaves fans with burning questions.',
      broQuip: "Reddit has theories. X has opinions. We have popcorn.",
      ctaLink: 'https://www.reddit.com/r/HouseOfTheDragon/',
      category: 'hot_drop'
    },
    {
      id: 'buzz-5',
      title: '12th Fail IMDb Spike',
      platform: 'IMDb',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g5" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2330E0B2;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%23FF8C42;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g5)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3E12th%20Fail%3C/text%3E%3C/svg%3E',
      headline: '12th Fail added to 120K+ watchlists this week',
      buzzScore: 85,
      tags: ['Bollywood', 'Drama'],
      stats: { views: '3M', comments: '25K', shares: '67K' },
      summary: 'Vidhu Vinod Chopra\'s 12th Fail sees massive IMDb watchlist surge after OTT release.',
      broQuip: "This film is breaking IMDb — one watchlist at a time.",
      ctaLink: 'https://www.imdb.com/title/tt23849204/',
      category: 'hot_drop'
    },
    {
      id: 'buzz-6',
      title: 'Maharaja Social Storm',
      platform: 'X',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Cdefs%3E%3ClinearGradient id="g6" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23FF4F64;stop-opacity:1"/%3E%3Cstop offset="100%25" style="stop-color:%2330E0B2;stop-opacity:1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23g6)"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EMaharaja%3C/text%3E%3C/svg%3E',
      headline: '2M tweets about Maharaja in 24 hours',
      buzzScore: 92,
      tags: ['Bollywood', 'OTT'],
      stats: { views: '18M', comments: '2M', shares: '340K' },
      summary: 'Maharaja dominates social media conversations with 2 million tweets and counting.',
      broQuip: "Maharaja is everywhere. Like, literally everywhere.",
      ctaLink: 'https://twitter.com/search?q=Maharaja+movie',
      category: 'hot_drop'
    }
  ];

  // Filter moments by selected platform
  const filteredMoments = selectedPlatform === "All" 
    ? buzzMoments 
    : buzzMoments.filter(m => m.platform === selectedPlatform);

  // Handle platform icon click (client-side filtering)
  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform.name);
  };

  // Calculate Buzz Score flames
  const getBuzzFlames = (score) => {
    if (score >= 76) return "🔥🔥🔥🔥";
    if (score >= 51) return "🔥🔥🔥";
    if (score >= 26) return "🔥🔥";
    return "🔥";
  };

  // Buzz Score color gradient
  const getBuzzColor = (score) => {
    if (score >= 76) return mint;
    if (score >= 51) return "#FFB84D";
    if (score >= 26) return "#FF8C42";
    return coral;
  };

  // Auto-hide loading after mount
  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: charcoal }}>
        <div className="text-white text-xl">Loading Buzz...</div>
      </div>
    );
  }

  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen" style={{ backgroundColor: charcoal }}>
        {/* Header - Same format as Watch On */}
        <div className="px-3 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Buzz Meter
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-1">
              The Internet is Talking About…
            </p>
            <p 
              className="text-sm md:text-base italic"
              style={{ color: coral }}
            >
              "Fighter trailer, Kapil clips, and dragon drama — all trending harder than deadlines."
            </p>
          </div>
        </div>

      {/* Platform Capsules - Single Row (same as Watch On) */}
      <div className="px-3 md:px-6 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformClick(platform)}
                onMouseEnter={() => setHoveredPlatform(platform.name)}
                onMouseLeave={() => setHoveredPlatform(null)}
                className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white"
                style={{
                  background: selectedPlatform === platform.name 
                    ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                    : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                  boxShadow: hoveredPlatform === platform.name || selectedPlatform === platform.name ? `0 0 16px ${mint}60` : 'none',
                  opacity: selectedPlatform === platform.name ? 1 : 0.85
                }}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Right Now Section - 1×6 Horizontal Scroll (like Watch On) */}
      <div className="pb-6 md:pb-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
            <div>
              <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                <span>🔥</span> Trending Right Now
              </h2>
              <p className="text-[10px] md:text-sm text-white/60">
                Live entertainment moments
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
              <button className="hover:text-white">Go Deeper</button>
              <button className="hover:text-white">Hide</button>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
            <div className="flex gap-2 md:gap-4" style={{ width: 'max-content' }}>
              {filteredMoments.map((moment) => (
                <div 
                  key={moment.id} 
                  className="flex-shrink-0 snap-start cursor-pointer w-[130px] md:w-[14%]"
                  onClick={() => setModalItem(moment)}
                >
                  <div className="relative rounded-lg md:rounded-xl overflow-hidden shadow-lg border border-white/10 hover:-translate-y-0.5 transition">
                    {/* Thumbnail with gradient background */}
                    <div 
                      className="relative aspect-[2/3] flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        background: moment.id === 'buzz-1' ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` :
                                   moment.id === 'buzz-2' ? `linear-gradient(135deg, ${mint} 0%, ${coral} 100%)` :
                                   moment.id === 'buzz-3' ? `linear-gradient(135deg, #FF8C42 0%, ${mint} 100%)` :
                                   moment.id === 'buzz-4' ? `linear-gradient(135deg, ${coral} 0%, #FF8C42 100%)` :
                                   moment.id === 'buzz-5' ? `linear-gradient(135deg, ${mint} 0%, #FF8C42 100%)` :
                                   `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                      }}
                    >
                      <span className="opacity-80">{moment.title}</span>
                      {/* Platform badge */}
                      <div 
                        className="absolute top-2 left-2 px-2 py-1 rounded-full text-[8px] md:text-[10px] font-semibold"
                        style={{ background: `${charcoalSoft}CC`, color: mint }}
                      >
                        {moment.platform}
                      </div>
                      {/* Buzz Score */}
                      <div 
                        className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1"
                        style={{ background: `${charcoalSoft}CC`, color: getBuzzColor(moment.buzzScore) }}
                      >
                        <span>{getBuzzFlames(moment.buzzScore)}</span>
                        <span>{moment.buzzScore}</span>
                      </div>
                    </div>
                    {/* Info panel */}
                    <div className="p-2 md:p-2.5" style={{ backgroundColor: charcoalSoft }}>
                      <p className="text-[10px] md:text-xs text-white font-medium line-clamp-2">
                        {moment.headline}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {moment.tags.map((tag, i) => (
                          <span 
                            key={i}
                            className="text-[8px] px-1.5 py-0.5 rounded-full"
                            style={{ background: `${mint}20`, color: mint }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* From the Feeds Tray - Horizontal Scroll (same as Watch On) */}
      <div className="pb-8">
        <div className="max-w-[1280px] mx-auto space-y-3 md:space-y-4">
          <section>
            <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                  <span>📱</span> From the Feeds
                </h2>
                {!visibleFromTheFeeds ? null : (
                  <p className="text-[10px] md:text-sm text-white/60">
                    What's buzzing on social
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                {!visibleFromTheFeeds ? (
                  <button onClick={() => setVisibleFromTheFeeds(true)} className="hover:text-white">Show</button>
                ) : (
                  <>
                    <button 
                      onClick={() => setExpandedFromTheFeeds(!expandedFromTheFeeds)} 
                      className="hover:text-white"
                    >
                      {expandedFromTheFeeds ? "Collapse" : "Go Deeper"}
                    </button>
                    <button onClick={() => setVisibleFromTheFeeds(false)} className="hover:text-white">Hide</button>
                  </>
                )}
              </div>
            </div>
            {visibleFromTheFeeds && (
              <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex gap-2 md:gap-4" style={{ width: 'max-content' }}>
                  {filteredMoments.slice(0, 6).map((moment) => (
                    <div 
                      key={`feed-${moment.id}`} 
                      className="flex-shrink-0 snap-start cursor-pointer w-[120px] md:w-[14%]"
                      onClick={() => setModalItem(moment)}
                    >
                      <div className="relative rounded-lg overflow-hidden shadow-lg border border-white/10 hover:-translate-y-0.5 transition">
                        <div 
                          className="relative aspect-[2/3] flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            background: moment.id === 'buzz-1' ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` :
                                       moment.id === 'buzz-2' ? `linear-gradient(135deg, ${mint} 0%, ${coral} 100%)` :
                                       moment.id === 'buzz-3' ? `linear-gradient(135deg, #FF8C42 0%, ${mint} 100%)` :
                                       moment.id === 'buzz-4' ? `linear-gradient(135deg, ${coral} 0%, #FF8C42 100%)` :
                                       moment.id === 'buzz-5' ? `linear-gradient(135deg, ${mint} 0%, #FF8C42 100%)` :
                                       `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                          }}
                        >
                          <span className="opacity-70 text-center px-2">{moment.title}</span>
                          <div 
                            className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                            style={{ background: `${charcoalSoft}CC`, color: getBuzzColor(moment.buzzScore) }}
                          >
                            {getBuzzFlames(moment.buzzScore)} {moment.buzzScore}
                          </div>
                        </div>
                        <div className="p-1.5" style={{ backgroundColor: charcoalSoft }}>
                          <p className="text-[9px] text-white font-medium line-clamp-2">
                            {moment.headline}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Detail Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto" style={{ backgroundColor: `${charcoal}E6` }} onClick={() => setModalItem(null)}>
          <div className="relative max-w-2xl w-full my-4 rounded-xl md:rounded-2xl shadow-2xl border max-h-[85vh] overflow-y-auto" style={{ backgroundColor: charcoalSoft, borderColor: `${mint}40` }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setModalItem(null)}
              className="sticky top-2 right-2 ml-auto w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all z-10 text-sm md:text-base"
              style={{ background: `${charcoal}CC`, color: mint }}
            >
              ✕
            </button>

            <div className="p-4 md:p-8 pt-0">
              {/* Platform icon + title */}
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-semibold"
                  style={{ background: `${mint}20`, color: mint }}
                >
                  {modalItem.platform}
                </div>
                <h2 className="text-lg md:text-3xl font-bold text-white flex-1">
                  {modalItem.title}
                </h2>
              </div>

              {/* Headline */}
              <p className="text-sm md:text-xl text-white/90 mb-3">
                {modalItem.headline}
              </p>

              {/* Buzz Score with tooltip */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl md:text-3xl">{getBuzzFlames(modalItem.buzzScore)}</span>
                  <span className="text-xl md:text-2xl font-bold" style={{ color: getBuzzColor(modalItem.buzzScore) }}>
                    {modalItem.buzzScore}
                  </span>
                </div>
                <div className="text-[9px] md:text-[10px] text-white/60 italic">
                  Views + Engagement + Speed
                </div>
              </div>

              {/* Tag pills */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {modalItem.tags?.map((tag, i) => (
                  <span 
                    key={i}
                    className="text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium"
                    style={{ background: `${coral}20`, color: coral }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Summary */}
              <p className="text-xs md:text-base text-white/80 mb-3 leading-relaxed">
                {modalItem.summary}
              </p>

              {/* Stats bar */}
              <div className="flex gap-2 md:gap-4 mb-4 text-xs md:text-sm flex-wrap">
                <div>
                  <span className="text-white/60">Views: </span>
                  <span className="text-white font-semibold">{modalItem.stats?.views}</span>
                </div>
                <div>
                  <span className="text-white/60">Comments: </span>
                  <span className="text-white font-semibold">{modalItem.stats?.comments}</span>
                </div>
                <div>
                  <span className="text-white/60">Shares: </span>
                  <span className="text-white font-semibold">{modalItem.stats?.shares}</span>
                </div>
              </div>

              {/* Bro quip */}
              <p 
                className="text-xs md:text-sm italic mb-4 px-3 md:px-4 py-2 md:py-3 rounded-lg"
                style={{ background: `${coral}15`, color: coral, borderLeft: `3px solid ${coral}` }}
              >
                "{modalItem.broQuip}"
              </p>

              {/* CTA button with gradient */}
              <a
                href={modalItem.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 md:py-3 rounded-lg md:rounded-xl text-center text-sm md:text-base text-white font-semibold transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` }}
              >
                See on {modalItem.platform}
              </a>
            </div>
          </div>
        </div>
      )}

        {/* CSS for scrollbar hiding */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
      <ConnectorFooter />
    </>
  );
}
