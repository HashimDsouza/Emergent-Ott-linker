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

        {/* Spotlight Cards */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3 md:gap-4 pb-2" style={{ width: 'max-content' }}>
            {spotlightMatches.map((match) => (
              <SpotlightCard key={match.id} match={match} />
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

function SpotlightCard({ match }) {
  const isLive = match.type === 'live';
  const isToday = match.type === 'today';

  const getCardGlow = () => {
    if (isLive) return `${coral}60`;
    if (isToday) return `${mint}40`;
    return `${mint}20`;
  };

  const getStatusColor = () => {
    if (isLive) return coral;
    if (isToday) return mint;
    return '#FFA500'; // orange for weekend
  };

  return (
    <div
      className="snap-start flex-shrink-0 w-[280px] md:w-[320px] rounded-2xl p-4 md:p-5 transition-all hover:scale-[1.02] cursor-pointer"
      style={{
        backgroundColor: charcoal,
        border: `2px solid ${getCardGlow()}`,
        boxShadow: `0 4px 20px ${getCardGlow()}`
      }}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="px-3 py-1 rounded-full text-xs md:text-sm font-bold flex items-center gap-1.5"
          style={{
            backgroundColor: `${getStatusColor()}20`,
            color: getStatusColor(),
            border: `1px solid ${getStatusColor()}`
          }}
        >
          {isLive && <span className="animate-pulse">🔴</span>}
          {match.status}
        </span>
        <span className="text-xs text-white/60">{match.league}</span>
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{match.team1.flag}</span>
            <span className="text-white font-semibold text-base md:text-lg">
              {match.team1.name}
            </span>
          </div>
          {match.team1.score && (
            <span 
              className="text-lg md:text-xl font-bold"
              style={{ color: mint }}
            >
              {match.team1.score}
            </span>
          )}
        </div>

        {/* VS or Single Event */}
        {match.team2 ? (
          <>
            <div className="text-center text-white/40 text-xs font-semibold">VS</div>
            
            {/* Team 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{match.team2.flag}</span>
                <span className="text-white font-semibold text-base md:text-lg">
                  {match.team2.name}
                </span>
              </div>
              {match.team2.score && (
                <span 
                  className="text-lg md:text-xl font-bold"
                  style={{ color: mint }}
                >
                  {match.team2.score}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-white/80 text-sm">{match.venue}</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: `${getStatusColor()}20` }}>
        <div className="text-xs text-white/60">
          {match.venue && match.team2 && `📍 ${match.venue}`}
          {match.time && ` • ${match.time}`}
        </div>
        {match.countdown && (
          <div 
            className="px-2 py-1 rounded text-xs font-semibold"
            style={{ 
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor() 
            }}
          >
            {match.countdown}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        className="w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]"
        style={{
          background: isLive 
            ? `linear-gradient(135deg, ${coral}, ${coral}E0)`
            : `linear-gradient(135deg, ${mint}, ${mint}E0)`,
          color: charcoal,
          boxShadow: `0 4px 12px ${isLive ? `${coral}40` : `${mint}40`}`
        }}
      >
        {isLive ? '🔴 Watch Live' : '🔔 Set Reminder'}
      </button>

      {/* Live pulse animation */}
      {isLive && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      )}
    </div>
  );
}
