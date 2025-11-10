import React, { useState, useEffect } from 'react';
import { todayMatches, generateMatchDescriptor } from '../config/sportsConfig';
import FlagIcon from './FlagIcon';
import TrayHeader from './TrayHeader';
import { fetchSportsImages } from '../utils/sportsImageFetcher';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

export default function TodaysMatchesTray({ selectedSport, selectedLeague }) {
  const [sportsImages, setSportsImages] = useState({});

  useEffect(() => {
    const loadSportsImages = async () => {
      const images = await fetchSportsImages();
      setSportsImages(images);
    };
    loadSportsImages();
  }, []);

  // Filter matches based on selected sport/league
  const filteredMatches = todayMatches.filter(match => {
    if (!selectedSport || selectedSport === 'live') return true;
    if (selectedSport === 'more') {
      // Show NBA, F1, golf, badminton, etc.
      return ['nba', 'f1', 'golf', 'badminton', 'ufc', 'kabaddi', 'esports'].includes(match.sport);
    }
    if (match.sport !== selectedSport) return false;
    if (selectedLeague && selectedLeague !== `all-${selectedSport}`) {
      return match.league === selectedLeague;
    }
    return true;
  });

  if (filteredMatches.length === 0) return null;
  return (
    <div className="px-3 md:px-6 pb-6 md:pb-8" style={{ backgroundColor: charcoal }}>
      <div className="max-w-[1280px] mx-auto">
        <TrayHeader 
          emoji="📅"
          title="TODAY'S MATCHES"
          subline="Upcoming matches today"
        />
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3 md:gap-3" style={{ width: 'max-content' }}>
            {filteredMatches.map((match) => (
              <TodayMatchTile key={match.id} match={{ ...match, descriptor: generateMatchDescriptor(match) }} sportsImages={sportsImages} />
            ))}
          </div>
        </div>
      </div>
      <style>{".scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }"}</style>
    </div>
  );
}

function TodayMatchTile({ match, sportsImages }) {
  const [imageErrors, setImageErrors] = useState({ team1: false, team2: false });

  const handleImageError = (team) => {
    setImageErrors(prev => ({ ...prev, [team]: true }));
  };

  const getTeamImage = (teamName, teamLogo, teamKey) => {
    if (sportsImages[teamName] && !imageErrors[teamKey]) {
      return (
        <img 
          src={sportsImages[teamName]} 
          alt={teamName}
          className="w-5 h-5 rounded-full flex-shrink-0 object-contain"
          onError={() => handleImageError(teamKey)}
        />
      );
    }

    if (teamLogo && typeof teamLogo === 'object') {
      return (
        <div 
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold"
          style={{ backgroundColor: teamLogo.color, color: '#fff' }}
        >
          {teamLogo.initials}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="snap-start flex-shrink-0 w-[180px] rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02]" style={{ backgroundColor: charcoalSoft, border: `1px solid ${mint}30` }}>
      <div className="text-xs text-white/60 mb-2">{match.league}</div>
      <div className="flex items-center gap-1.5 mb-2">
        {getTeamImage(match.team1.name, match.team1.logo, 'team1') || (
          <FlagIcon flagCode={match.team1.flagCode} emoji={match.team1.flag} size="md" />
        )}
        <span className="text-white text-xs font-semibold truncate">{match.team1.name}</span>
      </div>
      <div className="text-center text-[10px] text-white/40 mb-1">VS</div>
      <div className="flex items-center gap-1.5 mb-3">
        {getTeamImage(match.team2.name, match.team2.logo, 'team2') || (
          <FlagIcon flagCode={match.team2.flagCode} emoji={match.team2.flag} size="md" />
        )}
        <span className="text-white text-xs font-semibold truncate">{match.team2.name}</span>
      </div>
      <div className="text-center mb-2">
        <div className="text-sm font-bold" style={{ color: mint }}>{match.time}</div>
      </div>
      <p className="text-[10px] italic text-center mb-2" style={{ color: coral }}>{match.descriptor}</p>
      <button className="w-full py-1.5 rounded text-xs font-semibold" style={{ backgroundColor: `${mint}30`, color: mint }}>🔔 Remind Me</button>
    </div>
  );
}