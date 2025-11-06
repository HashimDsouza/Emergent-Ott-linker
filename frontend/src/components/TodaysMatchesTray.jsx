import React from 'react';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

const mockTodayMatches = [
  {
    id: 1,
    sport: 'cricket',
    team1: { name: 'India', flag: '🇮🇳' },
    team2: { name: 'Australia', flag: '🇦🇺' },
    time: '2:00 PM',
    venue: 'Mumbai',
    league: 'Test Match',
    descriptor: 'Series decider. History awaits.'
  },
  {
    id: 2,
    sport: 'football',
    team1: { name: 'Real Madrid', flag: '🇪🇸' },
    team2: { name: 'Barcelona', flag: '🇪🇸' },
    time: '8:00 PM',
    venue: 'Bernabeu',
    league: 'El Clasico',
    descriptor: '285th battle. Rivalry renewed.'
  },
  {
    id: 3,
    sport: 'football',
    team1: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    team2: { name: 'Arsenal', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    time: '10:30 PM',
    venue: 'Etihad',
    league: 'Premier League',
    descriptor: 'Title race heats up.'
  },
  {
    id: 4,
    sport: 'cricket',
    team1: { name: 'MI', flag: '🔵' },
    team2: { name: 'CSK', flag: '🟡' },
    time: '7:30 PM',
    venue: 'Wankhede',
    league: 'IPL',
    descriptor: 'Classic rivalry. Yellow vs Blue.'
  },
  {
    id: 5,
    sport: 'nba',
    team1: { name: 'Lakers', flag: '🟣' },
    team2: { name: 'Warriors', flag: '🟠' },
    time: '9:00 AM',
    venue: 'LA',
    league: 'NBA',
    descriptor: 'LeBron vs Curry. Legends duel.'
  },
  {
    id: 6,
    sport: 'tennis',
    team1: { name: 'Djokovic', flag: '🇷🇸' },
    team2: { name: 'Alcaraz', flag: '🇪🇸' },
    time: '3:00 PM',
    venue: 'Melbourne',
    league: 'Australian Open',
    descriptor: 'Generational clash.'
  }
];

export default function TodaysMatchesTray() {
  return (
    <div className="px-3 md:px-6 pb-6 md:pb-8" style={{ backgroundColor: charcoal }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2" style={{ color: mint }}>
            <span>📅</span>
            TODAY'S MATCHES
          </h2>
          <p className="text-xs md:text-sm text-white/60 mt-1">Upcoming matches today</p>
        </div>
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-3 md:gap-3" style={{ width: 'max-content' }}>
            {mockTodayMatches.map((match) => (
              <TodayMatchTile key={match.id} match={match} />
            ))}
          </div>
        </div>
      </div>
      <style>{".scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }"}</style>
    </div>
  );
}

function TodayMatchTile({ match }) {
  return (
    <div className="snap-start flex-shrink-0 w-[180px] rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02]" style={{ backgroundColor: charcoalSoft, border: `1px solid ${mint}30` }}>
      <div className="text-xs text-white/60 mb-2">{match.league}</div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-lg">{match.team1.flag}</span>
        <span className="text-white text-xs font-semibold truncate">{match.team1.name}</span>
      </div>
      <div className="text-center text-[10px] text-white/40 mb-1">VS</div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-lg">{match.team2.flag}</span>
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