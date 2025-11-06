import React, { useState, useEffect } from 'react';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

// Mock spotlight data - will be replaced with real API data
const mockSpotlightMatches = [
  {
    id: 1,
    type: 'live',
    sport: 'cricket',
    team1: { name: 'India', flag: '🇮🇳', score: '234/5' },
    team2: { name: 'Australia', flag: '🇦🇺', score: '189' },
    status: 'Live Now',
    venue: 'Mumbai',
    league: 'Test Series',
    time: '34.2 overs'
  },
  {
    id: 2,
    type: 'today',
    sport: 'football',
    team1: { name: 'Real Madrid', flag: '🇪🇸', logo: null },
    team2: { name: 'Barcelona', flag: '🇪🇸', logo: null },
    status: 'Today 8:00 PM',
    venue: 'Santiago Bernabeu',
    league: 'El Clasico - La Liga',
    countdown: '5h 30m'
  },
  {
    id: 3,
    type: 'weekend',
    sport: 'f1',
    team1: { name: 'Abu Dhabi GP', flag: '🇦🇪', logo: null },
    team2: null,
    status: 'Sunday 5:30 PM',
    venue: 'Yas Marina',
    league: 'F1 Championship',
    countdown: '2 days'
  },
  {
    id: 4,
    type: 'today',
    sport: 'football',
    team1: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: null },
    team2: { name: 'Arsenal', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: null },
    status: 'Today 10:30 PM',
    venue: 'Etihad Stadium',
    league: 'Premier League',
    countdown: '8h'
  }
];

export default function SpotlightSection({ selectedSport, selectedLeague }) {
  const [spotlightMatches, setSpotlightMatches] = useState([]);
  const [broMessage, setBroMessage] = useState('');

  useEffect(() => {
    // Filter matches based on selected sport/league
    let filtered = mockSpotlightMatches;
    
    if (selectedSport && selectedSport !== 'live') {
      filtered = filtered.filter(match => match.sport === selectedSport);
    }

    // Set contextual Bro message
    const liveCount = filtered.filter(m => m.type === 'live').length;
    const todayCount = filtered.filter(m => m.type === 'today').length;

    if (liveCount > 0) {
      setBroMessage(`🔴 ${liveCount} match${liveCount > 1 ? 'es' : ''} live. Pick your drama.`);
    } else if (todayCount > 0) {
      setBroMessage(`🔥 ${todayCount} banger${todayCount > 1 ? 's' : ''} today. Couch time confirmed.`);
    } else {
      setBroMessage("⚡ Weekend loaded. Clear your calendar.");
    }

    setSpotlightMatches(filtered);
  }, [selectedSport, selectedLeague]);

  if (spotlightMatches.length === 0) return null;

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
