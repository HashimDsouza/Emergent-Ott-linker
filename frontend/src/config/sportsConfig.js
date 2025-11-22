// Sports Configuration - Premium Images for Connector Brand
// High-quality sports imagery

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

export const getTeamLogo = (teamName, sport) => {
  const teamData = {
    'MI': { color: '#004BA0', initials: 'MI' },
    'CSK': { color: '#FDB913', initials: 'CSK' },
    'RCB': { color: '#EC1C24', initials: 'RCB' },
    'KKR': { color: '#3A225D', initials: 'KKR' },
    'Man City': { color: '#6CABDD', initials: 'MCI' },
    'Arsenal': { color: '#EF0107', initials: 'ARS' },
    'Liverpool': { color: '#C8102E', initials: 'LIV' },
    'Chelsea': { color: '#034694', initials: 'CHE' },
    'Real Madrid': { color: '#FEBE10', initials: 'RMA' },
    'Barcelona': { color: '#A50044', initials: 'FCB' },
    'Bayern': { color: '#DC052D', initials: 'FCB' },
    'Lakers': { color: '#552583', initials: 'LAL' },
    'Warriors': { color: '#1D428A', initials: 'GSW' }
  };
  return teamData[teamName] || { color: '#30E0B2', initials: teamName.substring(0, 3).toUpperCase() };
};

// Premium sports images - Using high-quality alternatives
export const liveMatches = [
  { 
    id: 'l1', 
    sport: 'cricket', 
    league: 'ipl', 
    team1: { name: 'MI', flag: '🔵', logo: getTeamLogo('MI') }, 
    team2: { name: 'CSK', flag: '🟡', logo: getTeamLogo('CSK') }, 
    score: '145/3 (18.2)', 
    status: 'LIVE', 
    venue: 'Wankhede', 
    descriptor: 'Classic rivalry. Yellow vs Blue.',
    thumbnail: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  },
  { 
    id: 'l2', 
    sport: 'kabaddi', 
    league: 'pkl', 
    team1: { name: 'Patna Pirates', flag: '🟠' }, 
    team2: { name: 'Bengal Warriors', flag: '🔴' }, 
    score: '28-24', 
    status: 'LIVE', 
    venue: 'Kolkata', 
    descriptor: "India's most intense contact sport",
    thumbnail: 'https://images.pexels.com/photos/16038098/pexels-photo-16038098.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/16038098/pexels-photo-16038098.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  },
  { 
    id: 'l3', 
    sport: 'football', 
    league: 'premier', 
    team1: { name: 'Man City', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: getTeamLogo('Man City') }, 
    team2: { name: 'Arsenal', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: getTeamLogo('Arsenal') }, 
    score: '2-1', 
    status: '78\'', 
    venue: 'Etihad', 
    descriptor: 'Title race heats up.',
    thumbnail: 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  }
];

export const todayMatches = [
  { 
    id: 't1', 
    sport: 'cricket', 
    league: 'india', 
    team1: { name: 'India', flag: '🇮🇳' }, 
    team2: { name: 'Australia', flag: '🇦🇺' }, 
    time: '2:00 PM', 
    venue: 'Mumbai', 
    descriptor: 'Series decider. History awaits.',
    thumbnail: 'https://images.pexels.com/photos/10069854/pexels-photo-10069854.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/10069854/pexels-photo-10069854.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  },
  { 
    id: 't2', 
    sport: 'football', 
    league: 'laliga', 
    team1: { name: 'Real Madrid', flag: '🇪🇸', logo: getTeamLogo('Real Madrid') }, 
    team2: { name: 'Barcelona', flag: '🇪🇸', logo: getTeamLogo('Barcelona') }, 
    time: '8:00 PM', 
    venue: 'Bernabeu', 
    descriptor: '285th battle. Rivalry renewed.',
    thumbnail: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  },
  { 
    id: 't4', 
    sport: 'cricket', 
    league: 'ipl', 
    team1: { name: 'MI', flag: '🔵', logo: getTeamLogo('MI') }, 
    team2: { name: 'CSK', flag: '🟡', logo: getTeamLogo('CSK') }, 
    time: '7:30 PM', 
    venue: 'Wankhede', 
    descriptor: 'Classic rivalry. Yellow vs Blue.',
    thumbnail: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  }
];

export const comingUpMatches = [
  { 
    id: 'c1', 
    sport: 'football', 
    league: 'premier', 
    team1: { name: 'Liverpool', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: getTeamLogo('Liverpool') }, 
    team2: { name: 'Chelsea', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: getTeamLogo('Chelsea') }, 
    day: 'Tomorrow', 
    time: '10:00 PM', 
    descriptor: 'Derby day drama.',
    thumbnail: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  },
  { 
    id: 'c3', 
    sport: 'cricket', 
    league: 'england', 
    team1: { name: 'Pakistan', flag: '🇵🇰' }, 
    team2: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, 
    day: 'Saturday', 
    time: '2:00 PM', 
    descriptor: 'Rivalry continues.',
    thumbnail: 'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop',
    posterUrl: 'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop'
  }
];

// Highlights with proper video IDs
export const highlightsVideos = [
  { id: 'h1', videoId: 'dQw4w9WgXcQ', title: 'IND vs AUS Test Highlights', sport: 'cricket', views: '1.2M', descriptor: 'Masterclass innings', league: 'IND vs AUS', thumbnail: 'https://images.pexels.com/photos/10069854/pexels-photo-10069854.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop' },
  { id: 'h2', videoId: 'LFzrA492gdw', title: 'Fighter - Action Scenes', sport: 'action', views: '2.8M', descriptor: 'Hrithik aerial combat', league: 'Fighter', thumbnail: 'https://images.pexels.com/photos/163792/model-planes-airplanes-miniatures-craft-163792.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop' }
];

// Bro lines remain the same
export const gameBroLines = {
  live: ["Live action. Real drama.", "Matches on. Snacks ready?"],
  cricket: ["Pitch perfect vibes tonight.", "Six incoming. Watch the skies."],
  football: ["Goals incoming. Drama guaranteed."],
  default: ["Live action. Real drama.", "Game recognizes game."]
};

export const getRandomGameBroLine = (sportId = 'default') => {
  const lines = gameBroLines[sportId] || gameBroLines.default;
  return lines[Math.floor(Math.random() * lines.length)];
};

export const generateMatchDescriptor = (match) => {
  return match.descriptor || 'Epic matchup ahead.';
};
