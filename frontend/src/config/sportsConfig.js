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
