import React, { useState, useEffect } from "react";
import { mapApiToCard } from "../utils/mapApiToCard";
import Tile from "../components/Tile";
import DetailsModal from "../components/DetailsModal";

const coral = "#FF4F64", mint = "#30E0B2", charcoal = "#0E1514", charcoalSoft = "#173A35";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function WatchOn() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  // Platform capsules configuration (text-only)
  const platforms = [
    { name: "JioHotstar", color: coral },
    { name: "Netflix", color: "#E50914" },
    { name: "Prime Video", color: "#00A8E1" },
    { name: "Sony Liv", color: "#FF6B00" },
    { name: "Zee5", color: "#9C27B0" },
    { name: "Apple TV+", color: "#000000" },
    { name: "Fancode", color: mint },
    { name: "Dazn", color: "#F8B500" }
  ];

  // State for "Go Deeper" trays (Phase 1B will expand with more content)
  const [expandedNetflix, setExpandedNetflix] = useState(false);
  const [expandedJioHotstar, setExpandedJioHotstar] = useState(false);
  const [expandedPrime, setExpandedPrime] = useState(false);
  const [expandedSonyLiv, setExpandedSonyLiv] = useState(false);
  
  // State for hiding trays
  const [visibleNetflix, setVisibleNetflix] = useState(true);
  const [visibleJioHotstar, setVisibleJioHotstar] = useState(true);
  const [visiblePrime, setVisiblePrime] = useState(true);
  const [visibleSonyLiv, setVisibleSonyLiv] = useState(true);

  // Fetch content
  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/content`);
        const data = await response.json();
        
        // Filter out only sports content (game_on), include hero and regular content
        const contentItems = data
          .filter(item => item.category !== 'game_on')
          .map(mapApiToCard);
        
        setContent(contentItems);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching content:", error);
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  // Handle platform icon click
  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform.name);
    
    // Visual feedback: scroll to trays
    const traysSection = document.getElementById('trays-section');
    if (traysSection) {
      traysSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Show toast
    const toast = document.createElement('div');
    toast.textContent = `${platform.name} filter coming soon! Showing all platforms for now.`;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${charcoalSoft};
      color: ${mint};
      padding: 12px 24px;
      border-radius: 8px;
      border: 1px solid ${mint}40;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      font-size: 14px;
      animation: slideDown 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Platform-specific Top 10 content (filter by platform)
  const getTopByPlatform = (platformName, count = 6) => {
    return [...content]
      .filter(item => item.platform?.toLowerCase().includes(platformName.toLowerCase()))
      .filter(item => item.imdb && item.imdb !== "N/A")
      .sort((a, b) => {
        const ratingA = typeof a.imdb === 'number' ? a.imdb : parseFloat(a.imdb) || 0;
        const ratingB = typeof b.imdb === 'number' ? b.imdb : parseFloat(b.imdb) || 0;
        return ratingB - ratingA;
      })
      .slice(0, count);
  };

  const netflixTop10 = getTopByPlatform('Netflix', 6);
  const jioHotstarTop10 = getTopByPlatform('JioHotstar', 6);
  const primeTop10 = getTopByPlatform('Prime', 6);
  const sonyLivTop10 = getTopByPlatform('Sony', 6);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: charcoal }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: charcoal }}>
      {/* Header */}
      <div className="px-3 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
            Watch On
          </h1>
          <p className="text-base md:text-lg text-white/80 mb-1">
            All your apps. One tap away.
          </p>
          <p 
            className="text-sm md:text-base italic"
            style={{ color: coral }}
          >
            "Netflix, Prime, Hotstar — they all play nice here."
          </p>
        </div>
      </div>

      {/* Platform Capsules - 2 Rows, 4 Per Row */}
      <div className="px-3 md:px-6 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Row 1: First 4 platforms */}
          <div className="flex justify-center gap-2 md:gap-3 mb-2 md:mb-3">
            {platforms.slice(0, 4).map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformClick(platform)}
                className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all hover:scale-105 text-xs md:text-sm font-semibold text-white"
                style={{
                  background: selectedPlatform === platform.name 
                    ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                    : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                  boxShadow: selectedPlatform === platform.name ? `0 0 16px ${mint}60` : 'none',
                  opacity: selectedPlatform === platform.name ? 1 : 0.85
                }}
              >
                {platform.name}
              </button>
            ))}
          </div>
          {/* Row 2: Last 4 platforms */}
          <div className="flex justify-center gap-2 md:gap-3">
            {platforms.slice(4).map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformClick(platform)}
                className="group relative px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all hover:scale-105 text-xs md:text-sm font-semibold text-white"
                style={{
                  background: selectedPlatform === platform.name 
                    ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                    : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                  boxShadow: selectedPlatform === platform.name ? `0 0 16px ${mint}60` : 'none',
                  opacity: selectedPlatform === platform.name ? 1 : 0.85
                }}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trays Section - Horizontal Scroll */}
      <div id="trays-section" className="pb-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {/* Tray 1: Trending Across Platforms */}
          <section>
            <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                  <span>🔥</span> Trending Across Platforms
                </h2>
                {!visibleTrending ? null : (
                  <p className="text-[10px] md:text-sm text-white/60">
                    What's hot right now on every app
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                {!visibleTrending ? (
                  <button onClick={() => setVisibleTrending(true)} className="hover:text-white">Show</button>
                ) : (
                  <>
                    <button 
                      onClick={() => setExpandedTrending(!expandedTrending)} 
                      className="hover:text-white"
                    >
                      {expandedTrending ? "Collapse" : "Go Deeper"}
                    </button>
                    <button onClick={() => setVisibleTrending(false)} className="hover:text-white">Hide</button>
                  </>
                )}
              </div>
            </div>
            {visibleTrending && (
              <div 
                className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                  {content.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: '140px', maxWidth: '140px' }}>
                      <Tile 
                        item={item} 
                        onInfo={() => setModalItem(item)} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Tray 2: Top 10 Right Now */}
          <section>
            <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                  <span>⭐</span> Top 10 Right Now
                </h2>
                {!visibleTop10 ? null : (
                  <p className="text-[10px] md:text-sm italic" style={{ color: coral }}>
                    "Consensus chaos — everyone's watching these."
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                {!visibleTop10 ? (
                  <button onClick={() => setVisibleTop10(true)} className="hover:text-white">Show</button>
                ) : (
                  <>
                    <button 
                      onClick={() => setExpandedTop10(!expandedTop10)} 
                      className="hover:text-white"
                    >
                      {expandedTop10 ? "Collapse" : "Go Deeper"}
                    </button>
                    <button onClick={() => setVisibleTop10(false)} className="hover:text-white">Hide</button>
                  </>
                )}
              </div>
            </div>
            {visibleTop10 && (
              <div 
                className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                  {top10.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: '140px', maxWidth: '140px' }}>
                      <Tile 
                        item={item} 
                        onInfo={() => setModalItem(item)} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Tray 3: Bro Recommends */}
          {broRecommends.length > 0 && (
            <section>
              <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                <div>
                  <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                    <span style={{ color: mint }}>✨</span> Bro Recommends
                  </h2>
                  {!visibleBroRecommends ? null : (
                    <p className="text-[10px] md:text-sm text-white/60">
                      Handpicked for your chaos
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                  {!visibleBroRecommends ? (
                    <button onClick={() => setVisibleBroRecommends(true)} className="hover:text-white">Show</button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setExpandedBroRecommends(!expandedBroRecommends)} 
                        className="hover:text-white"
                      >
                        {expandedBroRecommends ? "Collapse" : "Go Deeper"}
                      </button>
                      <button onClick={() => setVisibleBroRecommends(false)} className="hover:text-white">Hide</button>
                    </>
                  )}
                </div>
              </div>
              {visibleBroRecommends && (
                <div 
                  className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                    {broRecommends.slice(0, 6).map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: '140px', maxWidth: '140px' }}>
                        <Tile 
                          item={item} 
                          onInfo={() => setModalItem(item)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      {/* Details Modal */}
      {modalItem && (
        <DetailsModal 
          isOpen={!!modalItem}
          onClose={() => setModalItem(null)}
          item={modalItem}
        />
      )}

      {/* CSS for toast animation and scrollbar hiding */}
      <style>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}
