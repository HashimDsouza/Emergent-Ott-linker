import React, { useState, useEffect } from 'react';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

// Mock spotlight data - LEAGUES/TOURNAMENTS ONLY (not individual matches)
const mockSpotlightLeagues = [
  {
    id: 1,
    type: 'series',
    sport: 'cricket',
    leagueName: 'IND vs AUS Test Series',
    trophy: 'Border-Gavaskar Trophy',
    status: 'Series 2-1 (India leads)',
    nextMatch: 'Final Test - Today in Mumbai',
    descriptor: 'Trophy decider. All on the line.',
    relevance: 'india',
    logo: '🏏',
    flag: '🇮🇳🆚🇦🇺'
  },
  {
    id: 2,
    type: 'league',
    sport: 'football',
    leagueName: 'Premier League 2024-25',
    trophy: null,
    status: 'Matchday 12 This Weekend',
    nextMatch: '10 matches: City vs Arsenal highlight',
    descriptor: 'Title race heats up.',
    relevance: 'international',
    logo: '⚽',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  },
  {
    id: 3,
    type: 'league',
    sport: 'football',
    leagueName: 'UEFA Champions League',
    trophy: 'European Cup',
    status: 'Round of 16 Starting',
    nextMatch: 'Knockout rounds begin Tuesday',
    descriptor: 'Europe's elite battle.',
    relevance: 'international',
    logo: '🏆',
    flag: '🇪🇺'
  },
  {
    id: 4,
    type: 'league',
    sport: 'football',
    leagueName: 'Indian Super League',
    trophy: 'ISL Trophy',
    status: 'League Stage - Week 8',
    nextMatch: 'Bengaluru vs Mumbai - Tonight',
    descriptor: 'Indian football rising.',
    relevance: 'india',
    logo: '⚽',
    flag: '🇮🇳'
  },
  {
    id: 5,
    type: 'championship',
    sport: 'f1',
    leagueName: 'F1 World Championship',
    trophy: null,
    status: 'Abu Dhabi GP This Weekend',
    nextMatch: 'Final race - Sunday 5:30 PM',
    descriptor: 'Season finale. Verstappen leads.',
    relevance: 'international',
    logo: '🏎️',
    flag: '🏁'
  },
  {
    id: 6,
    type: 'tournament',
    sport: 'tennis',
    leagueName: 'Australian Open 2025',
    trophy: 'Grand Slam',
    status: 'Starts Next Monday',
    nextMatch: 'Draw announced tomorrow',
    descriptor: 'Grand Slam season kicks off.',
    relevance: 'international',
    logo: '🎾',
    flag: '🇦🇺'
  }
];

export default function SpotlightSection({ selectedSport, selectedLeague }) {
  const [spotlightLeagues, setSpotlightLeagues] = useState([]);
  const [broMessage, setBroMessage] = useState('');

  useEffect(() => {
    // Filter leagues based on selected sport
    let filtered = mockSpotlightLeagues;
    
    if (selectedSport && selectedSport !== 'live') {
      filtered = filtered.filter(league => league.sport === selectedSport);
    }

    // Prioritize India-relevant content
    filtered.sort((a, b) => {
      if (a.relevance === 'india' && b.relevance !== 'india') return -1;
      if (a.relevance !== 'india' && b.relevance === 'india') return 1;
      return 0;
    });

    // Set contextual Bro message
    const indiaCount = filtered.filter(l => l.relevance === 'india').length;
    
    if (indiaCount > 0) {
      setBroMessage(`🇮🇳 ${indiaCount} Indian ${indiaCount > 1 ? 'tournaments' : 'tournament'} live. Nation watching.`);
    } else {
      setBroMessage("🌟 Top tournaments happening now.");
    }

    setSpotlightLeagues(filtered);
  }, [selectedSport, selectedLeague]);

  if (spotlightLeagues.length === 0) return null;

  return (
    <div 
      className="px-3 md:px-6 py-6 md:py-8"
      style={{ backgroundColor: charcoalSoft }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 
            className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2"
            style={{ color: mint }}
          >
            <span>🌟</span>
            SPOTLIGHT
          </h2>
          <p className="text-sm md:text-base italic" style={{ color: coral }}>
            {broMessage}
          </p>
        </div>

        {/* Spotlight Cards - LEAGUES/TOURNAMENTS */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3 md:gap-4 pb-2" style={{ width: 'max-content' }}>
            {spotlightLeagues.map((league) => (
              <LeagueSpotlightCard key={league.id} league={league} />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollbar Hide */}
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
  );
}

function LeagueSpotlightCard({ league }) {
  const isIndiaRelevant = league.relevance === 'india';

  return (
    <div
      className="snap-start flex-shrink-0 w-[320px] md:w-[360px] rounded-2xl p-5 md:p-6 transition-all hover:scale-[1.02] cursor-pointer"
      style={{
        backgroundColor: charcoal,
        border: `2px solid ${isIndiaRelevant ? `${coral}60` : `${mint}40`}`,
        boxShadow: `0 4px 20px ${isIndiaRelevant ? `${coral}40` : `${mint}30`}`
      }}
    >
      {/* League Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{league.logo}</span>
          <div>
            <h3 
              className="text-lg md:text-xl font-bold"
              style={{ color: isIndiaRelevant ? coral : mint }}
            >
              {league.leagueName}
            </h3>
            {league.trophy && (
              <p className="text-xs text-white/60 mt-0.5">{league.trophy}</p>
            )}
          </div>
        </div>
        <span className="text-2xl">{league.flag}</span>
      </div>

      {/* League Status */}
      <div 
        className="px-4 py-3 rounded-lg mb-4"
        style={{ 
          backgroundColor: `${mint}10`,
          border: `1px solid ${mint}30`
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">
            {league.status}
          </span>
          {isIndiaRelevant && (
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ 
                backgroundColor: `${coral}30`,
                color: coral 
              }}
            >
              🇮🇳 INDIA
            </span>
          )}
        </div>
        <p className="text-xs text-white/70">
          {league.nextMatch}
        </p>
      </div>

      {/* Descriptor */}
      <div className="mb-4">
        <p 
          className="text-sm md:text-base italic text-center"
          style={{ color: coral }}
        >
          "{league.descriptor}"
        </p>
      </div>

      {/* CTA Button */}
      <button
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${mint}, ${mint}E0)`,
          color: charcoal,
          boxShadow: `0 4px 12px ${mint}40`
        }}
      >
        📊 View League Hub
      </button>
    </div>
  );
}
