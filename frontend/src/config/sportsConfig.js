// Sports Configuration for Game On
// Primary and secondary tiers, seasonal events, priority rules

export const primarySports = [
  { id: 'live', label: 'LIVE Now', icon: '🔴', dynamic: true },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'more', label: 'More Sports', icon: '➕' }
];

export const secondarySports = {
  cricket: [
    { id: 'ipl', label: 'IPL', flag: '🇮🇳' },
    { id: 'india', label: 'India', flag: '🇮🇳' },
    { id: 'australia', label: 'Australia', flag: '🇦🇺' },
    { id: 'england', label: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 't20wc', label: 'T20 WC', flag: '🏆' },
    { id: 'all-cricket', label: 'All Cricket', flag: null }
  ],
  football: [
    { id: 'premier', label: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'champions', label: 'Champions League', flag: '🏆' },
    { id: 'laliga', label: 'La Liga', flag: '🇪🇸' },
    { id: 'seriea', label: 'Serie A', flag: '🇮🇹' },
    { id: 'bundesliga', label: 'Bundesliga', flag: '🇩🇪' },
    { id: 'europa', label: 'Europa League', flag: '🏆' },
    { id: 'isl', label: 'ISL', flag: '🇮🇳' },
    { id: 'all-football', label: 'All Football', flag: null }
  ],
  tennis: [
    { id: 'grandslam', label: 'Grand Slams', flag: '🏆' },
    { id: 'atp', label: 'ATP Tour', flag: '🎾' },
    { id: 'wta', label: 'WTA Tour', flag: '🎾' },
    { id: 'all-tennis', label: 'All Tennis', flag: null }
  ],
  more: [
    { id: 'nba', label: 'NBA', flag: '🏀' },
    { id: 'golf', label: 'Golf', flag: '⛳' },
    { id: 'badminton', label: 'Badminton', flag: '🏸' },
    { id: 'ufc', label: 'UFC/MMA', flag: '🥊' },
    { id: 'f1', label: 'F1/Motorsports', flag: '🏎️' },
    { id: 'kabaddi', label: 'Kabaddi', flag: '🤼' },
    { id: 'esports', label: 'Esports', flag: '🎮' },
    { id: 'all-sports', label: 'All Sports', flag: null }
  ]
};

// Seasonal events configuration (dynamic additions based on dates)
export const seasonalEvents = {
  'fifa_worldcup': {
    active_period: ['2026-06-01', '2026-07-31'],
    position: 'primary',
    replaces: 'more',
    label: 'FIFA World Cup',
    icon: '🏆'
  },
  'uefa_euros': {
    active_period: ['2024-06-01', '2024-07-31'],
    position: 'secondary',
    sport: 'football',
    index: 0,
    label: 'UEFA Euros',
    flag: '🏆'
  },
  't20_worldcup': {
    active_period: ['2024-06-01', '2024-07-31'],
    position: 'secondary',
    sport: 'cricket',
    index: 0,
    label: 'T20 World Cup',
    flag: '🏆'
  }
};

// Spotlight priority configuration
export const spotlightPriority = {
  always_show: [
    'India Cricket',
    'El Clasico',
    'Manchester Derby',
    'Champions League Final'
  ],
  recurring_weekly: {
    'Saturday': ['Premier League', 'La Liga', 'Bundesliga'],
    'Sunday': ['Serie A', 'F1', 'NBA']
  }
};

// Bro microlines for Game On
export const gameBroLines = {
  live: [
    "Live action. Real drama.",
    "Matches on. Snacks ready?",
    "3 matches live. Pick your poison."
  ],
  cricket: [
    "Pitch perfect vibes tonight.",
    "Six incoming. Watch the skies.",
    "Cricket's on. Nation's watching."
  ],
  football: [
    "Goals incoming. Drama guaranteed.",
    "Kickoff soon. Clear your calendar.",
    "90 minutes of pure chaos."
  ],
  tennis: [
    "Aces. Sets. Match point energy.",
    "Clay court drama loading.",
    "Game, set, binge."
  ],
  more: [
    "Beyond the usual. Worth the watch.",
    "Alternative adrenaline hits.",
    "Unexpected vibes ahead."
  ],
  default: [
    "Live action. Real drama.",
    "Game recognizes game.",
    "Your next sports obsession starts here."
  ]
};

export const getRandomGameBroLine = (sportId = 'default') => {
  const lines = gameBroLines[sportId] || gameBroLines.default;
  return lines[Math.floor(Math.random() * lines.length)];
};

// Helper to get flag image URL from flagcdn.com
export const getFlagUrl = (countryCode) => {
  if (!countryCode) return null;
  // Convert country code to lowercase for API
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`;
};

// Helper to get team logo (placeholder for now, can be replaced with actual logo URLs)
export const getTeamLogo = (teamName, sport) => {
  // Placeholder colored circles for teams without country flags
  const teamColors = {
    'MI': '#004BA0', 'CSK': '#FDB913', 'RCB': '#EC1C24', 'KKR': '#3A225D',
    'Lakers': '#552583', 'Warriors': '#1D428A', 'Celtics': '#007A33', 'Heat': '#98002E',
    'Man City': '#6CABDD', 'Arsenal': '#EF0107', 'Liverpool': '#C8102E', 'Chelsea': '#034694',
    'Real Madrid': '#FEBE10', 'Barcelona': '#A50044', 'Bayern': '#DC052D'
  };
  return teamColors[teamName] || '#30E0B2';
};

// Mock data for all trays
export const liveMatches = [
  { id: 'l1', sport: 'cricket', league: 'ipl', team1: { name: 'MI', flag: '🔵', flagCode: null, logo: getTeamLogo('MI') }, team2: { name: 'CSK', flag: '🟡', flagCode: null, logo: getTeamLogo('CSK') }, score: '145/3 (18.2)', status: 'LIVE', venue: 'Wankhede', descriptor: 'Classic rivalry. Yellow vs Blue.' },
  { id: 'l2', sport: 'football', league: 'premier', team1: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb-eng', logo: getTeamLogo('Man City') }, team2: { name: 'Arsenal', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb-eng', logo: getTeamLogo('Arsenal') }, score: '2-1', status: '78\'', venue: 'Etihad', descriptor: 'Title race heats up.' },
  { id: 'l3', sport: 'tennis', league: 'grandslam', team1: { name: 'Djokovic', flag: '🇷🇸', flagCode: 'rs', logo: null }, team2: { name: 'Alcaraz', flag: '🇪🇸', flagCode: 'es', logo: null }, score: '6-4, 3-5', status: 'Set 2', venue: 'Melbourne', descriptor: 'Generational clash.' },
  { id: 'l4', sport: 'nba', league: 'nba', team1: { name: 'Lakers', flag: '🟣', flagCode: null, logo: getTeamLogo('Lakers') }, team2: { name: 'Warriors', flag: '🟠', flagCode: null, logo: getTeamLogo('Warriors') }, score: '98-95', status: 'Q4 2:45', venue: 'LA', descriptor: 'LeBron vs Curry. Legends duel.' }
];

export const todayMatches = [
  { id: 't1', sport: 'cricket', league: 'india', team1: { name: 'India', flag: '🇮🇳', flagCode: 'in', logo: null }, team2: { name: 'Australia', flag: '🇦🇺', flagCode: 'au', logo: null }, time: '2:00 PM', venue: 'Mumbai', descriptor: 'Series decider. History awaits.' },
  { id: 't2', sport: 'football', league: 'laliga', team1: { name: 'Real Madrid', flag: '🇪🇸', flagCode: null, logo: getTeamLogo('Real Madrid') }, team2: { name: 'Barcelona', flag: '🇪🇸', flagCode: null, logo: getTeamLogo('Barcelona') }, time: '8:00 PM', venue: 'Bernabeu', descriptor: '285th battle. Rivalry renewed.' },
  { id: 't3', sport: 'football', league: 'premier', team1: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb-eng', logo: getTeamLogo('Man City') }, team2: { name: 'Arsenal', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb-eng', logo: getTeamLogo('Arsenal') }, time: '10:30 PM', venue: 'Etihad', descriptor: 'Title race heats up.' },
  { id: 't4', sport: 'cricket', league: 'ipl', team1: { name: 'MI', flag: '🔵', flagCode: null, logo: getTeamLogo('MI') }, team2: { name: 'CSK', flag: '🟡', flagCode: null, logo: getTeamLogo('CSK') }, time: '7:30 PM', venue: 'Wankhede', descriptor: 'Classic rivalry. Yellow vs Blue.' },
  { id: 't5', sport: 'nba', league: 'nba', team1: { name: 'Lakers', flag: '🟣', flagCode: null, logo: getTeamLogo('Lakers') }, team2: { name: 'Warriors', flag: '🟠', flagCode: null, logo: getTeamLogo('Warriors') }, time: '9:00 AM', venue: 'LA', descriptor: 'LeBron vs Curry. Legends duel.' },
  { id: 't6', sport: 'tennis', league: 'grandslam', team1: { name: 'Djokovic', flag: '🇷🇸', flagCode: 'rs', logo: null }, team2: { name: 'Alcaraz', flag: '🇪🇸', flagCode: 'es', logo: null }, time: '3:00 PM', venue: 'Melbourne', descriptor: 'Generational clash.' }
];

export const comingUpMatches = [
  { id: 'c1', sport: 'football', league: 'premier', team1: { name: 'Liverpool', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, team2: { name: 'Chelsea', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, day: 'Tomorrow', time: '10:00 PM', descriptor: 'Derby day drama.' },
  { id: 'c2', sport: 'f1', league: 'f1', team1: { name: 'Abu Dhabi GP', flag: '🇦🇪' }, team2: null, day: 'Sunday', time: '5:30 PM', descriptor: 'Season finale. Title shot.' },
  { id: 'c3', sport: 'cricket', league: 'england', team1: { name: 'Pakistan', flag: '🇵🇰' }, team2: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, day: 'Saturday', time: '2:00 PM', descriptor: 'Rivalry continues.' },
  { id: 'c4', sport: 'nba', league: 'nba', team1: { name: 'Celtics', flag: '🟢' }, team2: { name: 'Heat', flag: '🔴' }, day: 'Sunday', time: '8:00 AM', descriptor: 'East Conference clash.' },
  { id: 'c5', sport: 'tennis', league: 'atp', team1: { name: 'Federer', flag: '🇨🇭' }, team2: { name: 'Nadal', flag: '🇪🇸' }, day: 'Saturday', time: '4:00 PM', descriptor: 'Legends return.' },
  { id: 'c6', sport: 'football', league: 'bundesliga', team1: { name: 'Bayern', flag: '🇩🇪' }, team2: { name: 'Dortmund', flag: '🇩🇪' }, day: 'Tomorrow', time: '9:30 PM', descriptor: 'Der Klassiker.' }
];

// Auto-descriptor generator for matches
export const generateMatchDescriptor = (match) => {
  const descriptors = {
    cricket: {
      india: ['Border-Gavaskar trophy.', 'Nation watches.', 'History beckons.', 'Rivalry renewed.'],
      ipl: ['Classic rivalry.', 'Yellow vs Blue.', 'Trophy race heats up.', 'Playoff push.'],
      australia: ['Down under battles.', 'Ashes energy.'],
      england: ['Test of legends.', 'Rivalry continues.'],
      t20wc: ['World stage awaits.', 'Glory calling.']
    },
    football: {
      premier: ['Title race heats up.', 'Derby day drama.', 'Six-pointer alert.'],
      laliga: ['El Clasico magic.', '285th battle.', 'Rivalry renewed.'],
      champions: ['European nights.', 'Glory awaits.'],
      bundesliga: ['Der Klassiker.', 'Bayern dominance?'],
      seriea: ['Italian excellence.', 'Derby della Madonnina.']
    },
    tennis: {
      grandslam: ['Generational clash.', 'Grand slam glory.', 'History awaits.'],
      atp: ['ATP Finals intensity.', 'Masters magic.'],
      wta: ['Women\'s excellence.']
    },
    nba: {
      nba: ['LeBron vs Curry.', 'Legends duel.', 'Title run begins.', 'Conference clash.']
    },
    f1: {
      f1: ['Season finale.', 'Title shot.', 'Pole position drama.']
    }
  };
  
  if (match.descriptor) return match.descriptor;
  
  const sportDescriptors = descriptors[match.sport];
  if (!sportDescriptors) return 'Epic matchup ahead.';
  
  const leagueDescriptors = sportDescriptors[match.league];
  if (!leagueDescriptors || leagueDescriptors.length === 0) {
    return Object.values(sportDescriptors).flat()[0] || 'Epic matchup ahead.';
  }
  
  return leagueDescriptors[Math.floor(Math.random() * leagueDescriptors.length)];
};

// Highlights video data (recent match highlights)
export const highlightsVideos = [
  { id: 'h1', videoId: '4W9YskwfTXE', title: 'IND vs AUS Test Day 2 Highlights', sport: 'cricket', views: '1.2M', descriptor: 'Masterclass innings. Pure class.', league: 'IND vs AUS' },
  { id: 'h2', videoId: 'LFzrA492gdw', title: 'El Clasico All Goals', sport: 'football', views: '2.8M', descriptor: 'Bellingham winner. Drama.', league: 'La Liga' },
  { id: 'h3', videoId: 'K_i4srJLw_E', title: 'Lakers vs Warriors Highlights', sport: 'nba', views: '890K', descriptor: 'LeBron 40pts. Thriller.', league: 'NBA' },
  { id: 'h4', videoId: 'BfWxJ0qh5X8', title: 'Djokovic 5-Set Win', sport: 'tennis', views: '654K', descriptor: 'Epic comeback. Legend.', league: 'Australian Open' },
  { id: 'h5', videoId: 'Zv5T8SoJXfg', title: 'F1 Abu Dhabi GP Highlights', sport: 'f1', views: '1.5M', descriptor: 'Final lap drama.', league: 'F1' },
  { id: 'h6', videoId: 'fnIPe8ryzOs', title: 'IPL 2024 Final Highlights', sport: 'cricket', views: '3.2M', descriptor: 'KKR champions. Epic final.', league: 'IPL' }
];

// Best Of video data (compilation content)
export const bestOfVideos = [
  { id: 'b1', videoId: 'PaMs87nTThs', title: 'Best Of IND vs AUS Series', sport: 'cricket', views: '5.2M', descriptor: 'Border-Gavaskar epic.', league: 'Test Cricket' },
  { id: 'b2', videoId: 'NJQyqpaK9zQ', title: 'El Clasico 4-3 Thriller', sport: 'football', views: '3.8M', descriptor: 'Seven goals. Pure chaos.', league: 'La Liga' },
  { id: 'b3', videoId: 'wF48pxqXtyI', title: 'NBA Top 10 Dunks This Week', sport: 'nba', views: '2.1M', descriptor: 'Rim-wrecking slams.', league: 'NBA' },
  { id: 'b4', videoId: 'Jz8c17upEwM', title: 'Best Tennis Rallies 2024', sport: 'tennis', views: '1.9M', descriptor: 'Epic exchanges.', league: 'ATP/WTA' },
  { id: 'b5', videoId: 'nFqC7LoRcFY', title: 'F1 Best Overtakes 2024', sport: 'f1', views: '4.5M', descriptor: 'Wheel-to-wheel action.', league: 'F1' },
  { id: 'b6', videoId: 'TJRMUZs8pkQ', title: 'IND vs AUS ODI Highlights', sport: 'cricket', views: '6.3M', descriptor: 'Six-hitting masterclass.', league: 'ODI' }
];
