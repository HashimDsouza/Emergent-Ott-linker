import React, { useState, useMemo } from 'react';
import { ConnectorHeader, ConnectorFooter } from '../components/ConnectorLayout';
import Tile from '../components/Tile';
import DetailsModal from '../components/DetailsModal';
import { mapApiToCard } from '../utils/mapApiToCard';

const coral = '#FF4F64';
const mint = '#30E0B2';

/**
 * HappeningNow Page - Dedicated page for time-sensitive content
 * 
 * Layout:
 * 1. LIVE NOW section (horizontal scroll, 1.5x tiles) - only shows if live content exists
 * 2. TODAY section (grid layout)
 * 3. TOMORROW/THIS WEEK section (grid layout)
 */

export default function HappeningNow({ apiData, onShare }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const onInfo = (item) => {
    setModalItem(item);
    setModalOpen(true);
  };

  // Convert API data to cards
  const allCards = useMemo(() => (apiData?.items || []).map(mapApiToCard), [apiData]);

  // Mock: Filter cards for "live" content (in real Phase B, this comes from API with isLive flag)
  // For now, let's take first 2 items as "live"
  const liveCards = useMemo(() => {
    return allCards.slice(0, 2).map((card, idx) => ({
      ...card,
      timeLabel: idx === 0 ? 'LIVE NOW' : 'LIVE NOW',
      isLive: true
    }));
  }, [allCards]);

  // Today's content (next 6 items)
  const todayCards = useMemo(() => {
    return allCards.slice(2, 8).map((card, idx) => ({
      ...card,
      timeLabel: ['3:00 PM', '5:30 PM', '7:00 PM', '8:30 PM', '6:00 PM', '4:30 PM'][idx] || '8:00 PM',
      category: ['Sports', 'Premiere', 'Event', 'Sports', 'Premiere', 'Sports'][idx] || 'Entertainment'
    }));
  }, [allCards]);

  // Tomorrow/This Week content (next 6 items)
  const upcomingCards = useMemo(() => {
    return allCards.slice(8, 14).map((card, idx) => ({
      ...card,
      timeLabel: 'Tomorrow',
      category: ['Sports', 'Premiere', 'Event', 'Sports', 'Premiere', 'Event'][idx] || 'Entertainment'
    }));
  }, [allCards]);

  return (
    <div className="min-h-screen pb-20 md:pb-24 landing-v23-bg text-white">
      <ConnectorHeader />

      <div className="px-3 md:px-6 pt-4 md:pt-6">
        <div className="max-w-7xl mx-auto">
          
          {/* LIVE NOW Section - Horizontal Scroll, 1.5x Tiles */}
          {liveCards.length > 0 && (
            <div className="mb-6 md:mb-8">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl md:text-2xl font-bold text-white">LIVE NOW</h2>
              </div>

              {/* Horizontal Scrolling Container */}
              <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                {liveCards.map((card) => (
                  <div key={card.id} className="flex-shrink-0 w-[55%] md:w-[280px] relative">
                    {/* Time Badge with Dark Background + White Text + Coral Glow */}
                    <div 
                      className="absolute top-2 left-2 z-10 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'rgba(14, 21, 20, 0.85)',
                        border: `1px solid ${coral}`,
                        boxShadow: `0 0 16px ${coral}80, 0 0 8px ${coral}40`
                      }}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs md:text-sm font-bold">
                        {card.timeLabel}
                      </span>
                    </div>
                    
                    {/* Use existing Tile component for consistency */}
                    <Tile 
                      item={{
                        ...card,
                        // Add category to descriptor
                        descriptor: `${card.category || 'Live'} • ${card.descriptor || 'Watch now'}`
                      }} 
                      onInfo={onInfo} 
                      onShare={onShare} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TODAY Section - Grid Layout */}
          <div className="mb-6 md:mb-8">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📅</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">TODAY</h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {todayCards.map((card) => (
                <div key={card.id} className="relative">
                  {/* Time Badge */}
                  <div 
                    className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(14, 21, 20, 0.85)',
                      border: `1px solid ${coral}`,
                      boxShadow: `0 0 12px ${coral}60, 0 0 6px ${coral}30`
                    }}
                  >
                    <span className="text-white text-xs font-bold">
                      {card.timeLabel}
                    </span>
                  </div>

                  <Tile 
                    item={{
                      ...card,
                      descriptor: `${card.category || 'Entertainment'} • ${card.descriptor || 'Catch it today'}`
                    }} 
                    onInfo={onInfo} 
                    onShare={onShare} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* TOMORROW / THIS WEEK Section - Grid Layout */}
          <div className="mb-6 md:mb-8">
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📆</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">TOMORROW</h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {upcomingCards.map((card) => (
                <div key={card.id} className="relative">
                  {/* Time Badge */}
                  <div 
                    className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: 'rgba(14, 21, 20, 0.75)',
                      border: `1px solid ${mint}50`,
                      boxShadow: `0 0 10px ${mint}40`
                    }}
                  >
                    <span className="text-white text-xs font-semibold">
                      {card.timeLabel}
                    </span>
                  </div>

                  <Tile 
                    item={{
                      ...card,
                      descriptor: `${card.category || 'Entertainment'} • ${card.descriptor || 'Coming soon'}`
                    }} 
                    onInfo={onInfo} 
                    onShare={onShare} 
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <ConnectorFooter />
      <DetailsModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} />

      {/* CSS for scrollbar hide */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
