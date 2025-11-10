import React, { useState, useEffect } from 'react';
import { liveMatches as configLiveMatches } from '../config/sportsConfig';
import FlagIcon from './FlagIcon';
import TrayHeader from './TrayHeader';
import { fetchSportsImages } from '../utils/sportsImageFetcher';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

// Mock live matches - will be replaced with API data
const mockLiveMatches = configLiveMatches.length > 0 ? configLiveMatches : [
  {
    id: 1,
    sport: 'cricket',
    team1: { name: 'India', flag: '🇮🇳', score: '234/5', overs: '34.2' },
    team2: { name: 'Australia', flag: '🇦🇺', score: '189', overs: '45' },
    status: 'LIVE',
    venue: 'Mumbai',
    league: 'Test Series',
    descriptor: 'Run chase drama. 45 needed in 6 overs.',
    isChasing: true,
    target: 190
  },
  {
    id: 2,
    sport: 'football',
    team1: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: '2' },
    team2: { name: 'Arsenal', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: '2' },
    status: 'LIVE',
    venue: 'Etihad',
    league: 'Premier League',
    descriptor: 'Title race thriller. 87th minute.',
    minute: 87
  },
  {
    id: 3,
    sport: 'tennis',
    team1: { name: 'Djokovic', flag: '🇷🇸', score: '2' },
    team2: { name: 'Alcaraz', flag: '🇪🇸', score: '1' },
    status: 'LIVE',
    venue: 'Melbourne',
    league: 'Australian Open',
    descriptor: '5th set decider. Break point.',
    sets: 'Sets 2-1'
  },
  {
    id: 4,
    sport: 'cricket',
    team1: { name: 'MI', flag: '🔵', score: '178/4', overs: '17.3' },
    team2: { name: 'CSK', flag: '🟡', score: '180/6', overs: '20' },
    status: 'LIVE',
    venue: 'Wankhede',
    league: 'IPL 2024',
    descriptor: 'MI needs 3 runs in 15 balls.',
    isChasing: true,
    target: 181
  }
];

export default function LiveMatchesTray({ selectedSport, selectedLeague }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [sportsImages, setSportsImages] = useState({});

  useEffect(() => {
    // Fetch team logos from backend
    const loadSportsImages = async () => {
      const images = await fetchSportsImages();
      setSportsImages(images);
    };
    loadSportsImages();

    // TODO: Fetch live matches from API
    setLiveMatches(mockLiveMatches);
  }, []);

  // Filter matches based on selected sport/league
  const filteredMatches = liveMatches.filter(match => {
    if (!selectedSport || selectedSport === 'live') return true;
    if (selectedSport === 'more') {
      return ['nba', 'f1', 'golf', 'badminton', 'ufc', 'kabaddi', 'esports'].includes(match.sport);
    }
    if (match.sport !== selectedSport) return false;
    if (selectedLeague && selectedLeague !== `all-${selectedSport}`) {
      return match.league === selectedLeague;
    }
    return true;
  });

  if (filteredMatches.length === 0) {
    return null; // Don't show tray if no live matches
  }

  return (
    <div 
      className="px-3 md:px-6 py-8 md:py-10"
      style={{ 
        background: `linear-gradient(180deg, ${charcoal} 0%, ${charcoalSoft} 100%)`,
        borderTop: `2px solid ${coral}40`,
        borderBottom: `2px solid ${coral}40`
      }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Standardized Tray Header */}
        <TrayHeader 
          emoji="🔴"
          title="LIVE RIGHT NOW"
          subline={`${filteredMatches.length} match${filteredMatches.length > 1 ? 'es' : ''} happening now`}
        />

        {/* Live Match Tiles - Larger & Prominent */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-4 md:gap-5" style={{ width: 'max-content' }}>
            {filteredMatches.map((match) => (
              <LiveMatchTile key={match.id} match={match} />
            ))}
          </div>
        </div>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

function LiveMatchTile({ match }) {
  return (
    <div
      className="snap-start flex-shrink-0 w-[200px] md:w-[240px] rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
      style={{ 
        backgroundColor: charcoal,
        border: `2px solid ${coral}60`,
        boxShadow: `0 4px 20px ${coral}40`
      }}
    >
      {/* Live Badge & League */}
      <div 
        className="px-4 py-2 flex items-center justify-between"
        style={{ 
          background: `linear-gradient(135deg, ${coral}30, ${coral}10)`,
          borderBottom: `1px solid ${coral}40`
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: coral }}
          />
          <span 
            className="text-xs md:text-sm font-bold"
            style={{ color: coral }}
          >
            🔴 {match.status}
          </span>
        </div>
        <span className="text-xs text-white/60">{match.league}</span>
      </div>

      {/* Match Content */}
      <div className="p-3 md:p-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.team1.logo && typeof match.team1.logo === 'object' ? (
              <div 
                className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold"
                style={{ backgroundColor: match.team1.logo.color, color: '#fff' }}
              >
                {match.team1.logo.initials}
              </div>
            ) : match.team1.logo ? (
              <div 
                className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: match.team1.logo }}
              />
            ) : (
              <FlagIcon flagCode={match.team1.flagCode} emoji={match.team1.flag} size="lg" />
            )}
            <span className="text-white font-semibold text-sm md:text-base truncate">
              {match.team1.name}
            </span>
          </div>
          <div className="text-right">
            <div 
              className="text-xl md:text-2xl font-bold"
              style={{ color: mint }}
            >
              {match.team1.score}
            </div>
            {match.team1.overs && (
              <div className="text-xs text-white/50">({match.team1.overs})</div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div 
          className="text-center text-xs font-semibold mb-3"
          style={{ color: coral }}
        >
          VS
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.team2.logo && typeof match.team2.logo === 'object' ? (
              <div 
                className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold"
                style={{ backgroundColor: match.team2.logo.color, color: '#fff' }}
              >
                {match.team2.logo.initials}
              </div>
            ) : match.team2.logo ? (
              <div 
                className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: match.team2.logo }}
              />
            ) : (
              <FlagIcon flagCode={match.team2.flagCode} emoji={match.team2.flag} size="lg" />
            )}
            <span className="text-white font-semibold text-sm md:text-base truncate">
              {match.team2.name}
            </span>
          </div>
          <div className="text-right">
            <div 
              className="text-xl md:text-2xl font-bold"
              style={{ color: mint }}
            >
              {match.team2.score}
            </div>
            {match.team2.overs && (
              <div className="text-xs text-white/50">({match.team2.overs})</div>
            )}
          </div>
        </div>

        {/* Descriptor - Fun Smart Line */}
        <div 
          className="px-3 py-2 rounded-lg"
          style={{ 
            backgroundColor: `${mint}10`,
            border: `1px solid ${mint}30`
          }}
        >
          <p 
            className="text-xs md:text-sm italic text-center"
            style={{ color: coral }}
          >
            {match.descriptor}
          </p>
        </div>
      </div>

      {/* Watch Button */}
      <div className="px-3 pb-3 md:px-4 md:pb-4">
        <button
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${coral}, ${coral}E0)`,
            color: 'white',
            boxShadow: `0 4px 12px ${coral}40`
          }}
        >
          🔴 Watch Live
        </button>
      </div>
    </div>
  );
}
