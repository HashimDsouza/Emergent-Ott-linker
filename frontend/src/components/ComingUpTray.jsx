import React from 'react';
import { comingUpMatches, generateMatchDescriptor } from '../config/sportsConfig';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

export default function ComingUpTray({ selectedSport, selectedLeague }) {
  // Filter matches based on selected sport/league
  const filteredMatches = comingUpMatches.filter(match => {
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

  if (filteredMatches.length === 0) return null;
  return (
    <div className="px-3 md:px-6 pb-6 md:pb-8" style={{ backgroundColor: charcoal }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2" style={{ color: mint }}>
            <span>🔜</span>
            COMING UP
          </h2>
          <p className="text-xs md:text-sm text-white/60 mt-1">Tomorrow & Weekend</p>
        </div>
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {mockComingUp.map((match) => (
              <div key={match.id} className="snap-start flex-shrink-0 w-[180px] rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02]" style={{ backgroundColor: charcoalSoft, border: `1px solid ${mint}30` }}>
                <div className="text-xs text-white/60 mb-2">{match.league}</div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lg">{match.team1.flag}</span>
                  <span className="text-white text-xs font-semibold truncate">{match.team1.name}</span>
                </div>
                {match.team2 && (
                  <>
                    <div className="text-center text-[10px] text-white/40 mb-1">VS</div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-lg">{match.team2.flag}</span>
                      <span className="text-white text-xs font-semibold truncate">{match.team2.name}</span>
                    </div>
                  </>
                )}
                <div className="text-center mb-2">
                  <div className="text-xs font-bold" style={{ color: coral }}>{match.day}</div>
                  <div className="text-sm font-bold" style={{ color: mint }}>{match.time}</div>
                </div>
                <p className="text-[10px] italic text-center mb-2" style={{ color: coral }}>{match.descriptor}</p>
                <button className="w-full py-1.5 rounded text-xs font-semibold" style={{ backgroundColor: `${mint}30`, color: mint }}>🔔 Remind Me</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{".scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }"}</style>
    </div>
  );
}