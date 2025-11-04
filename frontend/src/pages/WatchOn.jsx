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

  // State for "Go Deeper" trays
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [showAllTop10, setShowAllTop10] = useState(false);
  const [showAllBroRecommends, setShowAllBroRecommends] = useState(false);

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

  // Curated "Bro Recommends" titles
  const broRecommends = content.filter(item => 
    ['Fighter', '12th Fail', 'House of the Dragon', 'Slow Horses Season 5', 'The Great Indian Kapil Show', 'Maharaja'].includes(item.title)
  ).slice(0, 6);

  // Top 10 by IMDb rating
  const top10 = [...content]
    .filter(item => item.imdb && item.imdb !== "N/A")
    .sort((a, b) => {
      const ratingA = typeof a.imdb === 'number' ? a.imdb : parseFloat(a.imdb) || 0;
      const ratingB = typeof b.imdb === 'number' ? b.imdb : parseFloat(b.imdb) || 0;
      return ratingB - ratingA;
    })
    .slice(0, 10);

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

      {/* Platform Icons Row */}
      <div className="px-3 md:px-6 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformClick(platform)}
                className="group relative flex flex-col items-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl transition-all hover:scale-105"
                style={{
                  backgroundColor: selectedPlatform === platform.name ? `${platform.color}20` : charcoalSoft,
                  border: `2px solid ${selectedPlatform === platform.name ? platform.color : 'transparent'}`,
                  boxShadow: selectedPlatform === platform.name ? `0 0 20px ${platform.color}40` : 'none'
                }}
              >
                <span className="text-2xl md:text-3xl">{platform.icon}</span>
                <span 
                  className="text-xs md:text-sm font-medium text-white/90 group-hover:text-white"
                >
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trays Section */}
      <div id="trays-section" className="px-3 md:px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {/* Tray 1: Trending Across Platforms */}
          <section>
            <div className="mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <span>🔥</span> Trending Across Platforms
              </h2>
              <p className="text-sm md:text-base text-white/60 mt-1">
                What's hot right now on every app
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {content.slice(0, 6).map((item) => (
                <Tile 
                  key={item.id} 
                  item={item} 
                  onInfo={() => setModalItem(item)} 
                />
              ))}
            </div>
          </section>

          {/* Tray 2: Top 10 Right Now */}
          <section>
            <div className="mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <span>⭐</span> Top 10 Right Now
              </h2>
              <p className="text-sm md:text-base italic" style={{ color: coral }}>
                "Consensus chaos — everyone's watching these."
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {top10.slice(0, 6).map((item) => (
                <Tile 
                  key={item.id} 
                  item={item} 
                  onInfo={() => setModalItem(item)} 
                />
              ))}
            </div>
          </section>

          {/* Tray 3: Bro Recommends */}
          {broRecommends.length > 0 && (
            <section>
              <div className="mb-3 md:mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <span style={{ color: mint }}>✨</span> Bro Recommends
                </h2>
                <p className="text-sm md:text-base text-white/60 mt-1">
                  Handpicked for your chaos
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {broRecommends.map((item) => (
                  <Tile 
                    key={item.id} 
                    item={item} 
                    onInfo={() => setModalItem(item)} 
                  />
                ))}
              </div>
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

      {/* CSS for toast animation */}
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
      `}</style>
    </div>
  );
}
