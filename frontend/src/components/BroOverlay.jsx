import React, { useState, useEffect } from 'react';
import { broChips } from './BroConfig';
import Tile from './Tile';
import DetailsModal from './DetailsModal';
import { mapApiToCard } from '../utils/mapApiToCard';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function BroOverlay({ isOpen, onClose, xp }) {
  const [selectedChip, setSelectedChip] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [broReply, setBroReply] = useState('');

  // Fetch content based on chip selection
  const handleChipClick = async (chip) => {
    setSelectedChip(chip);
    setBroReply(chip.broReply);
    setLoading(true);

    try {
      // For v1A, we'll use the existing /api/content endpoint and filter
      const response = await fetch(`${BACKEND_URL}/api/content`);
      const data = await response.json();
      
      let filtered = data.filter(item => item.category !== 'game_on').map(mapApiToCard);

      // Apply simple filtering based on chip type
      switch (chip.id) {
        case 'hindi-spicy':
          filtered = filtered.filter(item => 
            item.language?.toLowerCase().includes('hindi') || 
            item.language?.toLowerCase().includes('hi')
          ).slice(0, 6);
          break;
        
        case 'top-10':
          filtered = filtered
            .filter(item => item.imdb && parseFloat(item.imdb) > 7)
            .sort((a, b) => parseFloat(b.imdb || 0) - parseFloat(a.imdb || 0))
            .slice(0, 6);
          break;
        
        case 'feel-good':
          filtered = filtered
            .filter(item => 
              item.genre?.includes('Comedy') || 
              item.genre?.includes('Family') ||
              (item.imdb && parseFloat(item.imdb) > 7.5)
            )
            .slice(0, 6);
          break;
        
        case 'action':
          filtered = filtered
            .filter(item => 
              item.genre?.includes('Action') || 
              item.genre?.includes('Thriller')
            )
            .slice(0, 6);
          break;
        
        case 'trending-shows':
          filtered = filtered
            .filter(item => item.type === 'series' || item.title?.includes('Season'))
            .slice(0, 6);
          break;
        
        case 'new-week':
          filtered = filtered
            .filter(item => item.year === '2024' || item.year === 2024)
            .slice(0, 6);
          break;
        
        case 'surprise':
          // Random selection
          const shuffled = [...filtered].sort(() => Math.random() - 0.5);
          filtered = shuffled.slice(0, 6);
          break;
        
        default:
          filtered = filtered.slice(0, 6);
      }

      setContent(filtered);
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedChip(null);
      setContent([]);
      setBroReply('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      {/* Overlay Content */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
        onClick={onClose}
      >
        <div 
          className="bg-charcoal rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ 
            backgroundColor: charcoalSoft,
            border: `2px solid ${mint}40`,
            boxShadow: `0 0 40px ${mint}20, 0 20px 60px ${charcoal}` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between" 
               style={{ 
                 backgroundColor: charcoal,
                 borderColor: `${mint}30`
               }}>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span style={{ color: coral }}>✦</span>
                Bro
              </h2>
              <p className="text-sm text-white/60 mt-0.5">What are we watching tonight?</p>
            </div>
            <div className="flex items-center gap-3">
              {/* XP Display */}
              <div 
                className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5"
                style={{ 
                  background: `linear-gradient(135deg, ${coral}20, ${mint}20)`,
                  border: `1px solid ${mint}40`
                }}
              >
                <span style={{ color: mint }}>⚡</span>
                <span className="text-white">{xp} XP</span>
              </div>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition"
                style={{ backgroundColor: `${charcoal}80` }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chips Grid */}
          {!selectedChip && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {broChips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
                    className="px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${coral}15, ${mint}15)`,
                      border: `1px solid ${mint}30`,
                      boxShadow: `0 2px 8px ${charcoal}40`
                    }}
                  >
                    <span className="text-white font-medium text-sm md:text-base">
                      {chip.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Fun footer message */}
              <div className="mt-6 text-center">
                <p className="text-sm italic" style={{ color: coral }}>
                  "Pick one. Bro's got your back."
                </p>
              </div>
            </div>
          )}

          {/* Results View */}
          {selectedChip && (
            <div className="p-6">
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedChip(null);
                  setContent([]);
                  setBroReply('');
                }}
                className="mb-4 px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white transition flex items-center gap-2"
                style={{ backgroundColor: `${charcoal}60` }}
              >
                ← Back to chips
              </button>

              {/* Bro Reply */}
              {broReply && (
                <div 
                  className="mb-6 px-4 py-3 rounded-xl text-center animate-fadeIn"
                  style={{ 
                    background: `linear-gradient(135deg, ${coral}20, ${mint}20)`,
                    border: `1px solid ${coral}40`
                  }}
                >
                  <p className="text-lg font-medium italic" style={{ color: coral }}>
                    {broReply}
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin"
                       style={{ 
                         borderColor: `${mint}30`,
                         borderTopColor: mint 
                       }}
                  />
                  <p className="text-white/60 mt-4">Finding the good stuff...</p>
                </div>
              )}

              {/* Content Grid */}
              {!loading && content.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {content.map((item) => (
                    <div key={item.id}>
                      <Tile 
                        item={item} 
                        onInfo={() => setModalItem(item)} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && content.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60">No content found for this vibe.</p>
                  <p className="text-sm italic mt-2" style={{ color: coral }}>
                    "Bro's still loading the good stuff. Try another chip?"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {modalItem && (
        <DetailsModal 
          isOpen={!!modalItem}
          onClose={() => setModalItem(null)}
          item={modalItem}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
