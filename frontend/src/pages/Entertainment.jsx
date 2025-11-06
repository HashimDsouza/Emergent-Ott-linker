import React, { useState, useEffect } from "react";
import { mapApiToCard } from "../utils/mapApiToCard";
import Tile from "../components/Tile";
import DetailsModal from "../components/DetailsModal";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import BroMicroline from "../components/BroMicroline";
import BuzzMoment from "../components/BuzzMoment";

const coral = "#FF4F64", mint = "#30E0B2", charcoal = "#0E1514", charcoalSoft = "#173A35";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Entertainment() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [hoveredCapsule, setHoveredCapsule] = useState(null);
  const [capsuleTooltip, setCapsuleTooltip] = useState(null);

  // Capsule tooltip messages
  const capsuleMessages = {
    'comfort': '"Patience, young Padawan — this feature awakens soon."',
    'chaos': '"Hold on, hero — Bro\'s still assembling the features."',
    'feels': '"One click to rule them all… coming soon."',
    'laugh': '"The features are coming."',
    'blockbusters': '"Accio features! (Still loading in the Room of Requirement.)"',
    'bro-picks': '"Your next feature mission is classified. Stand by."'
  };

  // State for tray visibility
  const [visibleNewNoted, setVisibleNewNoted] = useState(true);
  const [visibleBroRecommends, setVisibleBroRecommends] = useState(true);
  const [visibleAdrenaline, setVisibleAdrenaline] = useState(true);
  const [visibleHidden, setVisibleHidden] = useState(true);

  // State for "Go Deeper" expansion
  const [expandedNewNoted, setExpandedNewNoted] = useState(false);
  const [expandedBroRecommends, setExpandedBroRecommends] = useState(false);
  const [expandedAdrenaline, setExpandedAdrenaline] = useState(false);
  const [expandedHidden, setExpandedHidden] = useState(false);

  // Mood capsules (2×3 grid)
  const capsules = [
    { id: 'comfort', emoji: '😌', label: 'Comfort' },
    { id: 'chaos', emoji: '😱', label: 'Chaos' },
    { id: 'feels', emoji: '💔', label: 'Feels' },
    { id: 'laugh', emoji: '😂', label: 'Laugh' },
    { id: 'blockbusters', emoji: '🎬', label: 'Blockbusters' },
    { id: 'bro-picks', emoji: '🎯', label: "Bro's Picks" },
  ];

  // Bro Recommends (static curated list)
  const broRecommends = [
    'Fighter',
    '12th Fail',
    'House of the Dragon',
    'Slow Horses Season 5',
    'The Great Indian Kapil Show',
    'Maharaja'
  ];

  // Fetch content from API
  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/content`);
        const data = await response.json();
        
        // Filter out game_on category
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

  // Tray data filtering
  const newNoted = content.slice(0, 12); // First 12 items (simulating "Now Playing")
  const broRecommendsData = content.filter(item => 
    broRecommends.includes(item.title)
  ).slice(0, 12);
  const adrenalineRush = content.filter(item => 
    item.genre?.includes('Action') || item.genre?.includes('Thriller')
  ).slice(0, 12);
  const hiddenGems = content.filter(item => 
    item.imdb && parseFloat(item.imdb) >= 7.8
  ).slice(0, 12);

  const handleCapsuleClick = (capsule) => {
    setSelectedCapsule(selectedCapsule === capsule.id ? null : capsule.id);
    
    // Show tooltip for 2.5 seconds
    setCapsuleTooltip(capsule.id);
    setTimeout(() => {
      setCapsuleTooltip(null);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: charcoal }}>
        <div className="text-white text-xl">Loading Entertainment...</div>
      </div>
    );
  }

  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen" style={{ backgroundColor: charcoal }}>
        {/* Header */}
        <div className="px-3 md:px-6 pt-6 md:pt-8 pb-4 md:pb-6">
          <div className="max-w-[1280px] mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Entertainment
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-1">
              Everything worth watching, sorted.
            </p>
            <p 
              className="text-sm md:text-base italic"
              style={{ color: coral }}
            >
              "Whatever your vibe, I've got the perfect watchlist."
            </p>
            <BroMicroline />
          </div>
        </div>

        {/* Mood Capsules - 2×3 Grid */}
        <div className="px-3 md:px-6 pb-6 md:pb-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {capsules.map((capsule) => (
                <div key={capsule.id} className="relative">
                  <button
                    onClick={() => handleCapsuleClick(capsule)}
                    onMouseEnter={() => setHoveredCapsule(capsule.id)}
                    onMouseLeave={() => setHoveredCapsule(null)}
                    className="w-full px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-semibold text-white flex items-center justify-center gap-1"
                    style={{
                      background: capsuleTooltip === capsule.id || selectedCapsule === capsule.id 
                        ? `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)`
                        : `linear-gradient(135deg, ${coral}80 0%, ${mint}60 100%)`,
                      boxShadow: hoveredCapsule === capsule.id || capsuleTooltip === capsule.id ? `0 0 16px ${mint}60` : 'none',
                      opacity: selectedCapsule === capsule.id || capsuleTooltip === capsule.id ? 1 : 0.85
                    }}
                  >
                    <span className="text-xs md:text-sm">{capsule.emoji}</span>
                    <span>{capsule.label}</span>
                  </button>
                  
                  {/* Tooltip */}
                  {capsuleTooltip === capsule.id && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 -top-12 md:-top-14 z-50 px-3 py-2 rounded-lg text-xs md:text-sm text-white italic whitespace-nowrap animate-fadeIn"
                      style={{ 
                        background: `${charcoalSoft}F0`,
                        color: coral,
                        boxShadow: `0 4px 12px ${charcoal}60`
                      }}
                    >
                      {capsuleMessages[capsule.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trays Section */}
        <div className="pb-8">
          <div className="max-w-[1280px] mx-auto space-y-3 md:space-y-4">

            {/* Tray 1: New & Noted */}
            {newNoted.length > 0 && (
              <section>
                <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                  <div>
                    <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2 mb-2">
                      <span>✨</span> New & Noted
                    </h2>
                    {!visibleNewNoted && <BuzzMoment />}
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                    {!visibleNewNoted ? (
                      <button onClick={() => setVisibleNewNoted(true)} className="hover:text-white">Show</button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setExpandedNewNoted(!expandedNewNoted)} 
                          className="hover:text-white"
                        >
                          {expandedNewNoted ? "Collapse" : "Go Deeper"}
                        </button>
                        <button onClick={() => setVisibleNewNoted(false)} className="hover:text-white">Hide</button>
                      </>
                    )}
                  </div>
                </div>
                {visibleNewNoted && (
                  <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                    <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                      {(expandedNewNoted ? newNoted : newNoted.slice(0, 6)).map((item) => (
                        <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[180px]">
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

            {/* Tray 2: Bro Recommends */}
            {broRecommendsData.length > 0 && (
              <section>
                <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                  <div>
                    <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                      <span style={{ color: mint }}>🎯</span> Bro Recommends
                    </h2>
                    {!visibleBroRecommends ? null : (
                      <p className="text-[10px] md:text-sm text-white/60">
                        Trust me on these.
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
                  <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                    <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                      {(expandedBroRecommends ? broRecommendsData : broRecommendsData.slice(0, 6)).map((item) => (
                        <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[180px]">
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

            {/* Tray 3: Adrenaline Rush */}
            {adrenalineRush.length > 0 && (
              <section>
                <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                  <div>
                    <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                      <span>⚡</span> Adrenaline Rush
                    </h2>
                    {!visibleAdrenaline ? null : (
                      <p className="text-[10px] md:text-sm text-white/60">
                        Edge-of-seat picks for tonight.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                    {!visibleAdrenaline ? (
                      <button onClick={() => setVisibleAdrenaline(true)} className="hover:text-white">Show</button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setExpandedAdrenaline(!expandedAdrenaline)} 
                          className="hover:text-white"
                        >
                          {expandedAdrenaline ? "Collapse" : "Go Deeper"}
                        </button>
                        <button onClick={() => setVisibleAdrenaline(false)} className="hover:text-white">Hide</button>
                      </>
                    )}
                  </div>
                </div>
                {visibleAdrenaline && (
                  <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                    <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                      {(expandedAdrenaline ? adrenalineRush : adrenalineRush.slice(0, 6)).map((item) => (
                        <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[180px]">
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

            {/* Tray 4: Hidden Gems */}
            {hiddenGems.length > 0 && (
              <section>
                <div className="px-3 md:px-6 mb-2 flex items-end justify-between">
                  <div>
                    <h2 className="text-base md:text-xl font-semibold text-white flex items-center gap-1.5 md:gap-2">
                      <span>💎</span> Hidden Gems
                    </h2>
                    {!visibleHidden ? null : (
                      <p className="text-[10px] md:text-sm text-white/60">
                        Critics love them. You might too.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-white/85">
                    {!visibleHidden ? (
                      <button onClick={() => setVisibleHidden(true)} className="hover:text-white">Show</button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setExpandedHidden(!expandedHidden)} 
                          className="hover:text-white"
                        >
                          {expandedHidden ? "Collapse" : "Go Deeper"}
                        </button>
                        <button onClick={() => setVisibleHidden(false)} className="hover:text-white">Hide</button>
                      </>
                    )}
                  </div>
                </div>
                {visibleHidden && (
                  <div className="overflow-x-auto scrollbar-hide px-3 md:px-6 pb-2 snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                    <div className="flex gap-2 md:gap-3" style={{ width: 'max-content' }}>
                      {(expandedHidden ? hiddenGems : hiddenGems.slice(0, 6)).map((item) => (
                        <div key={item.id} className="flex-shrink-0 snap-start w-[130px] md:w-[180px]">
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
        <DetailsModal 
          open={!!modalItem}
          onClose={() => setModalItem(null)}
          item={modalItem}
        />

        {/* CSS for scrollbar hiding and animations */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
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
        `}</style>
      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
    </>
  );
}
