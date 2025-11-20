import React, { useState, useMemo, useEffect } from 'react';
import { ConnectorHeader, ConnectorFooter } from '../components/ConnectorLayout';
import Tile from '../components/Tile';
import DetailsModal from '../components/DetailsModal';
import { Bell, BellRing } from 'lucide-react';
import { mapApiToCard } from '../utils/mapApiToCard';
import { liveMatches, todayMatches, comingUpMatches } from '../config/sportsConfig';

const coral = '#FF4F64';
const mint = '#30E0B2';

/**
 * Enhanced Tile with Type Capsule and Remind Me
 */
function EnhancedTile({ item, onInfo, onShare, timeLabel, typeCapsule, dayLabel }) {
  const [reminded, setReminded] = useState(() => {
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    return reminders.includes(item.id);
  });

  const handleRemindMe = (e) => {
    e.stopPropagation();
    const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
    
    if (reminded) {
      const updated = reminders.filter(id => id !== item.id);
      localStorage.setItem('reminders', JSON.stringify(updated));
      setReminded(false);
    } else {
      reminders.push(item.id);
      localStorage.setItem('reminders', JSON.stringify(reminders));
      setReminded(true);
    }
  };

  return (
    <div className="relative">
      {/* Time Badge - Top Left */}
      {timeLabel && (
        <div 
          className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: 'rgba(14, 21, 20, 0.85)',
            border: `1px solid ${timeLabel.includes('LIVE') ? coral : mint}`,
            boxShadow: `0 0 12px ${timeLabel.includes('LIVE') ? coral : mint}60`
          }}
        >
          {timeLabel.includes('LIVE') && (
            <div className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1.5"></div>
          )}
          <span className="text-white text-xs font-bold">
            {timeLabel}
          </span>
        </div>
      )}

      {/* Standard Tile - wrapped to add overlays */}
      <div className="relative group">
        {/* Type Capsule - ON IMAGE, bottom edge, just above gradient (positioned from bottom) */}
        {typeCapsule && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-center pointer-events-none"
            style={{
              bottom: '0',  // Start from the very bottom of the container
              transform: 'translate(-50%, calc(-100% - 4px - 3.5rem))', // Move up by: capsule height + 3px gradient + metadata height
              zIndex: 20,
              backgroundColor: 'rgba(14, 21, 20, 0.92)',
              border: `1px solid ${coral}60`,
              boxShadow: `0 0 10px ${coral}40`,
              maxWidth: '80%'
            }}
          >
            <span className="text-white text-[8px] md:text-[9px] font-semibold uppercase tracking-wide truncate block">
              {typeCapsule}
            </span>
          </div>
        )}
        
        <Tile item={item} onInfo={onInfo} onShare={onShare} />

        {/* Remind Me Icon - In metadata section, Line 1 (title), right-aligned */}
        {dayLabel !== 'LIVE' && (
          <button
            onClick={handleRemindMe}
            className="absolute transition-all hover:scale-110 flex items-center justify-center"
            style={{
              bottom: 'calc(3.5rem - 0.5rem)', // Position in title line (metadata height - offset)
              right: '8px',
              zIndex: 20,
              width: '14px',
              height: '14px',
              background: 'transparent',
              border: 'none',
              padding: 0
            }}
          >
            {reminded ? (
              <BellRing className="w-3.5 h-3.5" style={{ color: coral }} />
            ) : (
              <Bell className="w-3.5 h-3.5" style={{ color: mint }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * HappeningNow Page
 * Mobile: Horizontal sections (LIVE/TODAY/TOMORROW)
 * Desktop: Vertical calendar (5 columns for 5 days)
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

  // Get league/tournament name for sports
  const getLeagueName = (match) => {
    const leagueMap = {
      'premier': 'Premier League',
      'champions': 'Champions League',
      'laliga': 'La Liga',
      'ipl': 'IPL 2025',
      'india': 'Border-Gavaskar Trophy',
      'australia': 'Test Series',
      'nba': 'NBA',
      'f1': 'Formula 1',
      'atp': 'ATP Tour',
      'grandslam': 'Grand Slam'
    };
    return leagueMap[match.league] || match.league || 'Live Match';
  };

  // Convert sports matches to card format
  const convertSportsToCard = (matches) => {
    return matches.slice(0, 5).map(match => {
      const title = match.team2 
        ? `${match.team1.name} vs ${match.team2.name}`
        : match.team1.name;
      
      return {
        id: `sport-${match.id}`,
        title,
        platform: match.sport === 'cricket' ? 'Jiohotstar' : match.sport === 'football' ? 'Sony Liv' : 'Fancode',
        thumbnail: `https://images.unsplash.com/photo-${match.sport === 'cricket' ? '1531415074968-036ba1b575da' : match.sport === 'football' ? '1574629810360-7efbbe195018' : '1546519638-68e109498ffc'}?w=600&h=900&fit=crop&q=80`,
        descriptor: match.descriptor,
        category: 'sports',
        leagueName: getLeagueName(match),
        time: match.time || 'TBD',
        day: match.day || 'Today',
        imdb: match.status === 'live' ? 'LIVE' : null,
        isLive: match.status === 'live'
      };
    });
  };

  // LIVE content (first 2 catalog + live sports)
  const liveCards = useMemo(() => {
    const catalogLive = allCards.slice(0, 2).map((card) => ({
      ...card,
      timeLabel: 'LIVE NOW',
      typeCapsule: card.category === 'series' ? 'New Episode' : 'LIVE EVENT',
      isLive: true
    }));
    
    const sportsLive = convertSportsToCard(liveMatches.filter(m => m.status === 'live')).map(card => ({
      ...card,
      timeLabel: 'LIVE NOW',
      typeCapsule: card.leagueName,
      isLive: true
    }));

    return [...catalogLive, ...sportsLive];
  }, [allCards]);

  // Helper to get type capsule
  const getTypeCapsule = (card, cardIndex) => {
    // For sports - show league/tournament name
    if (card.category === 'sports') {
      return card.leagueName || 'Match';
    }
    
    // For series/shows - rotate through episode types
    if (card.category === 'series' || card.genres?.includes('Drama') || card.genres?.includes('Thriller') || card.genres?.includes('Comedy')) {
      const variations = ['New Episode', 'Series Premiere', 'Season Finale'];
      return variations[cardIndex % variations.length];
    }
    
    // For events
    if (card.category === 'event') {
      return 'Award Show';
    }
    
    // For movies/other content
    return 'Premiere';
  };

  // Get next 5 days
  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        label: i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : dayNames[date.getDay()].toUpperCase(),
        shortLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()],
        date: date,
        dayIndex: i
      });
    }
    return days;
  };

  const days = useMemo(() => getDaysArray(), []);

  // Distribute content across 5 days
  const dayContent = useMemo(() => {
    const content = {};
    
    // Get catalog content and sports
    const catalogCards = allCards.slice(2, 20); // Skip first 2 (used in LIVE)
    const sportsCards = convertSportsToCard([...todayMatches, ...comingUpMatches]);
    
    // Mix catalog and sports
    const mixedContent = [];
    let catalogIndex = 0;
    let sportsIndex = 0;
    
    // Alternate: 2 catalog, 1 sport, 2 catalog, 1 sport...
    while (catalogIndex < catalogCards.length || sportsIndex < sportsCards.length) {
      if (catalogIndex < catalogCards.length) mixedContent.push(catalogCards[catalogIndex++]);
      if (catalogIndex < catalogCards.length) mixedContent.push(catalogCards[catalogIndex++]);
      if (sportsIndex < sportsCards.length) mixedContent.push(sportsCards[sportsIndex++]);
    }
    
    // Distribute across 5 days (6 items per day)
    days.forEach((day, dayIndex) => {
      const startIdx = dayIndex * 6;
      const dayCards = mixedContent.slice(startIdx, startIdx + 6);
      
      // Add time labels and type capsules
      content[day.label] = dayCards.map((card, idx) => {
        const baseTime = dayIndex === 0 ? 15 : 14; // Start at 3 PM for today, 2 PM for others
        const hour = baseTime + idx * 2; // 2-hour intervals
        const time12h = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
        
        // Use global index for capsule variation (not just day index)
        const globalIndex = dayIndex * 6 + idx;
        
        return {
          ...card,
          timeLabel: card.isLive ? 'LIVE NOW' : time12h,
          typeCapsule: getTypeCapsule(card, globalIndex),
          dayLabel: day.shortLabel
        };
      });
    });
    
    return content;
  }, [allCards, days]);

  // Sort by time
  const sortByTime = (cards) => {
    return cards.sort((a, b) => {
      if (a.isLive) return -1;
      if (b.isLive) return 1;
      
      const getHour = (label) => {
        if (!label) return 0;
        const match = label.match(/(\d+):(\d+)\s*(AM|PM)/);
        if (!match) return 0;
        let hour = parseInt(match[1]);
        if (match[3] === 'PM' && hour !== 12) hour += 12;
        if (match[3] === 'AM' && hour === 12) hour = 0;
        return hour;
      };
      
      return getHour(a.timeLabel) - getHour(b.timeLabel);
    });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-24 landing-v23-bg text-white">
      <ConnectorHeader />

      <div className="px-3 md:px-6 pt-4 md:pt-6">
        <div className="max-w-[1800px] mx-auto">
          
          {/* MOBILE VIEW - Horizontal Sections */}
          <div className="block lg:hidden">
            {/* LIVE NOW Section */}
            {liveCards.length > 0 && (
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">LIVE NOW</h2>
                </div>
                <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {liveCards.map((card) => (
                    <div key={card.id} className="flex-shrink-0 w-[55%] md:w-[280px]">
                      <EnhancedTile 
                        item={card}
                        onInfo={onInfo}
                        onShare={onShare}
                        timeLabel={card.timeLabel}
                        typeCapsule={card.typeCapsule}
                        dayLabel="LIVE"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TODAY Section */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📅</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">TODAY</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {sortByTime(dayContent['TODAY'] || []).map((card) => (
                  <EnhancedTile 
                    key={card.id}
                    item={card}
                    onInfo={onInfo}
                    onShare={onShare}
                    timeLabel={card.timeLabel}
                    typeCapsule={card.typeCapsule}
                    dayLabel="Today"
                  />
                ))}
              </div>
            </div>

            {/* TOMORROW Section */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📆</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">TOMORROW</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {sortByTime(dayContent['TOMORROW'] || []).map((card) => (
                  <EnhancedTile 
                    key={card.id}
                    item={card}
                    onInfo={onInfo}
                    onShare={onShare}
                    timeLabel={card.timeLabel}
                    typeCapsule={card.typeCapsule}
                    dayLabel="Tomorrow"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW - Vertical Calendar (5 columns) */}
          <div className="hidden lg:block">
            {/* LIVE NOW Section - Full Width on Desktop */}
            {liveCards.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-white">LIVE NOW</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {liveCards.map((card) => (
                    <div key={card.id} className="flex-shrink-0 w-[280px]">
                      <EnhancedTile 
                        item={card}
                        onInfo={onInfo}
                        onShare={onShare}
                        timeLabel={card.timeLabel}
                        typeCapsule={card.typeCapsule}
                        dayLabel="LIVE"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Column Vertical Calendar */}
            <div className="grid grid-cols-5 gap-4">
              {days.map((day) => (
                <div key={day.label} className="flex flex-col">
                  {/* Day Header */}
                  <div className="sticky top-0 z-20 py-3 mb-4" style={{ backgroundColor: '#0E1514' }}>
                    <h3 className="text-lg font-bold text-center" style={{ color: day.dayIndex === 0 ? coral : mint }}>
                      {day.label}
                    </h3>
                    <div className="text-xs text-center text-white/60 mt-1">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  {/* Day Content - Vertical Scroll */}
                  <div className="space-y-4">
                    {sortByTime(dayContent[day.label] || []).map((card) => (
                      <EnhancedTile 
                        key={card.id}
                        item={card}
                        onInfo={onInfo}
                        onShare={onShare}
                        timeLabel={card.timeLabel}
                        typeCapsule={card.typeCapsule}
                        dayLabel={day.shortLabel}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <ConnectorFooter />
      <DetailsModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} />

      {/* CSS */}
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
