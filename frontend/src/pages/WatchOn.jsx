import React, { useState, useEffect } from "react";
import { mapApiToCard } from "../utils/mapApiToCard";
import Tile from "../components/Tile";
import DetailsModal from "../components/DetailsModal";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";

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
  const [hoveredPlatform, setHoveredPlatform] = useState(null);
  const [platformTooltip, setPlatformTooltip] = useState(null);

  // Platform tooltip messages (similar to Entertainment capsules)
  const platformMessages = {
    'JioHotstar': '"Patience, young Padawan — this feature awakens soon."',
    'Netflix': '"Hold on, hero — Bro\'s still assembling the features."',
    'Prime Video': '"One click to rule them all… coming soon."',
    'Sony Liv': '"The features are coming."',
    'Zee5': '"Accio features! (Still loading in the Room of Requirement.)"',
    'Apple TV+': '"Your next feature mission is classified. Stand by."',
    'Fancode': '"Features loading. Game on soon."',
    'Dazn': '"Almost there. The features are warming up."'
  };

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
    
    // Show tooltip for 2.5 seconds
    setPlatformTooltip(platform.name);
    setTimeout(() => {
      setPlatformTooltip(null);
    }, 2500);
    
    // Smooth scroll to trays section
    setTimeout(() => {
      document.getElementById('trays-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
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
    <>
      <ConnectorHeader />
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
                {platform.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Tooltip */}
      {platformTooltip && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm md:text-base font-medium italic transition-all duration-300 animate-fadeIn"
             style={{
               background: `${charcoalSoft}F0`,
               color: coral,
               border: `1px solid ${mint}40`,
               boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 8px ${mint}20`
             }}>
          {platformMessages[platformTooltip]}
        </div>
      )}

      {/* Trays Section - Grid Layout (3 cols mobile, 6 cols desktop) */}
      <div id="trays-section" className="pb-8">
        <div className="max-w-[1280px] mx-auto space-y-3 md:space-y-4">
          
          {/* Tray 1: Top 10 on Netflix */}
          {netflixTop10.length > 0 && (
            <section>
              <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                <div>
                  <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                    Top 10 on Netflix
                  </h2>
                  {!visibleNetflix ? null : (
                    <p className="text-[10px] md:text-sm text-white/60">
                      Trending right now
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                  {!visibleNetflix ? (
                    <button onClick={() => setVisibleNetflix(true)} className="hover:text-white">Show</button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setExpandedNetflix(!expandedNetflix)} 
                        className="hover:text-white"
                      >
                        {expandedNetflix ? "Collapse" : "Go Deeper"}
                      </button>
                      <button onClick={() => setVisibleNetflix(false)} className="hover:text-white">Hide</button>
                    </>
                  )}
                </div>
              </div>
              {visibleNetflix && (
                <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                  <div className="flex gap-2 md:gap-2" style={{ width: 'max-content' }}>
                    {netflixTop10.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[190px] md:max-w-[15%]">
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

          {/* Tray 2: Top 10 on JioHotstar */}
          {jioHotstarTop10.length > 0 && (
            <section>
              <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                <div>
                  <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                    Top 10 on JioHotstar
                  </h2>
                  {!visibleJioHotstar ? null : (
                    <p className="text-[10px] md:text-sm text-white/60">
                      Trending right now
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                  {!visibleJioHotstar ? (
                    <button onClick={() => setVisibleJioHotstar(true)} className="hover:text-white">Show</button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setExpandedJioHotstar(!expandedJioHotstar)} 
                        className="hover:text-white"
                      >
                        {expandedJioHotstar ? "Collapse" : "Go Deeper"}
                      </button>
                      <button onClick={() => setVisibleJioHotstar(false)} className="hover:text-white">Hide</button>
                    </>
                  )}
                </div>
              </div>
              {visibleJioHotstar && (
                <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                  <div className="flex gap-2 md:gap-2" style={{ width: 'max-content' }}>
                    {jioHotstarTop10.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[190px] md:max-w-[15%]">
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

          {/* Tray 3: Top 10 on Prime Video */}
          {primeTop10.length > 0 && (
            <section>
              <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                <div>
                  <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                    Top 10 on Prime Video
                  </h2>
                  {!visiblePrime ? null : (
                    <p className="text-[10px] md:text-sm text-white/60">
                      Trending right now
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                  {!visiblePrime ? (
                    <button onClick={() => setVisiblePrime(true)} className="hover:text-white">Show</button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setExpandedPrime(!expandedPrime)} 
                        className="hover:text-white"
                      >
                        {expandedPrime ? "Collapse" : "Go Deeper"}
                      </button>
                      <button onClick={() => setVisiblePrime(false)} className="hover:text-white">Hide</button>
                    </>
                  )}
                </div>
              </div>
              {visiblePrime && (
                <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                  <div className="flex gap-2 md:gap-2" style={{ width: 'max-content' }}>
                    {primeTop10.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[190px] md:max-w-[15%]">
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

          {/* Tray 4: Top 10 on Sony Liv */}
          {sonyLivTop10.length > 0 && (
            <section>
              <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                <div>
                  <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                    Top 10 on Sony Liv
                  </h2>
                  {!visibleSonyLiv ? null : (
                    <p className="text-[10px] md:text-sm text-white/60">
                      Trending right now
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                  {!visibleSonyLiv ? (
                    <button onClick={() => setVisibleSonyLiv(true)} className="hover:text-white">Show</button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setExpandedSonyLiv(!expandedSonyLiv)} 
                        className="hover:text-white"
                      >
                        {expandedSonyLiv ? "Collapse" : "Go Deeper"}
                      </button>
                      <button onClick={() => setVisibleSonyLiv(false)} className="hover:text-white">Hide</button>
                    </>
                  )}
                </div>
              </div>
              {visibleSonyLiv && (
                <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                  <div className="flex gap-2 md:gap-2" style={{ width: 'max-content' }}>
                    {sonyLivTop10.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[190px] md:max-w-[15%]">
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

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -10px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
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
      <ConnectorFooter />
    </>
  );
}
