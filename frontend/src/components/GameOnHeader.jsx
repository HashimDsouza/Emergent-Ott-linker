import React, { useState, useEffect } from 'react';
import { primarySports, secondarySports, getRandomGameBroLine } from '../config/sportsConfig';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

export default function GameOnHeader({ onSportChange, onLeagueChange }) {
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [broLine, setBroLine] = useState('');

  useEffect(() => {
    // Set initial Bro line
    setBroLine(getRandomGameBroLine('default'));
    
    // TODO: Fetch live count from APIs
    setLiveCount(3); // Mock for now
  }, []);

  const handlePrimarySportClick = (sport) => {
    if (sport.id === 'live') {
      // Show all live matches
      setSelectedSport('live');
      setSelectedLeague(null);
      onSportChange?.('live');
      onLeagueChange?.(null);
      setBroLine(getRandomGameBroLine('live'));
    } else if (selectedSport === sport.id) {
      // Collapse if clicking same sport
      setSelectedSport(null);
      setSelectedLeague(null);
      onSportChange?.(null);
      onLeagueChange?.(null);
      setBroLine(getRandomGameBroLine('default'));
    } else {
      // Expand new sport
      setSelectedSport(sport.id);
      setSelectedLeague(null);
      onSportChange?.(sport.id);
      onLeagueChange?.(null);
      setBroLine(getRandomGameBroLine(sport.id));
    }
  };

  const handleSecondaryLeagueClick = (league) => {
    setSelectedLeague(league.id);
    onLeagueChange?.(league.id);
  };

  // Filter out live if no live matches
  const visiblePrimarySports = primarySports.filter(sport => {
    if (sport.id === 'live') return liveCount > 0;
    return true;
  });

  return (
    <div className="bg-charcoal">
      {/* Hero Section */}
      <div 
        className="px-3 md:px-6 pt-6 pb-4 text-center"
        style={{ backgroundColor: charcoal }}
      >
        <h1 
          className="text-2xl md:text-4xl font-bold mb-2"
          style={{
            background: `linear-gradient(135deg, ${coral}, ${mint})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Game On
        </h1>
        <p 
          className="text-sm md:text-base mb-3"
          style={{ color: coral }}
        >
          Live Action Real Drama
        </p>
      </div>

      {/* Primary Tier - Sport Categories */}
      <div 
        className="px-3 md:px-6 pb-4"
        style={{ backgroundColor: charcoal }}
      >
        <div className="max-w-[1280px] mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 md:gap-3" style={{ minWidth: 'min-content' }}>
            {visiblePrimarySports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => handlePrimarySportClick(sport)}
                className="flex-shrink-0 px-4 py-2.5 md:px-6 md:py-3 rounded-full transition-all text-sm md:text-base font-semibold whitespace-nowrap"
                style={{
                  background: selectedSport === sport.id 
                    ? mint
                    : `linear-gradient(135deg, ${coral}15, ${mint}15)`,
                  border: `2px solid ${selectedSport === sport.id ? mint : `${mint}40`}`,
                  color: selectedSport === sport.id ? charcoal : 'white',
                  boxShadow: selectedSport === sport.id 
                    ? `0 0 16px ${mint}60` 
                    : 'none'
                }}
              >
                <span className="mr-2">{sport.icon}</span>
                {sport.label}
                {sport.id === 'live' && liveCount > 0 && (
                  <span 
                    className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ 
                      backgroundColor: coral,
                      color: 'white'
                    }}
                  >
                    {liveCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Tier - Leagues (appears when sport selected) */}
      {selectedSport && selectedSport !== 'live' && secondarySports[selectedSport] && (
        <div 
          className="px-3 md:px-6 pb-4 animate-slideDown"
          style={{ backgroundColor: charcoalSoft }}
        >
          <div className="max-w-[1280px] mx-auto overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 md:gap-2.5" style={{ minWidth: 'min-content' }}>
              {secondarySports[selectedSport].map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleSecondaryLeagueClick(league)}
                  className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all text-xs md:text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: selectedLeague === league.id 
                      ? `${mint}30`
                      : `${charcoal}80`,
                    border: `1px solid ${selectedLeague === league.id ? mint : `${mint}20`}`,
                    color: selectedLeague === league.id ? mint : 'white'
                  }}
                >
                  {league.flag && <span className="mr-1.5">{league.flag}</span>}
                  {league.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 200px;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
