// Bro AI Agent Configuration v1A
// Rule-based intent mapping, replies, and content queries

const coral = "#FF4F64";
const mint = "#30E0B2";

// 7 Main Chips (Bro Overlay)
export const broChips = [
  {
    id: 'hindi-spicy',
    label: 'Short, spicy, and in Hindi',
    query: {
      type: 'discover',
      params: {
        with_original_language: 'hi',
        with_runtime: { lte: 120 },
        sort_by: 'popularity.desc'
      }
    },
    broReply: "Desi vibes only."
  },
  {
    id: 'top-10',
    label: 'Top 10 Tonight',
    query: {
      type: 'trending',
      params: {
        time_window: 'day',
        limit: 10
      }
    },
    broReply: "Hot list incoming."
  },
  {
    id: 'feel-good',
    label: 'Feel-good comfort picks',
    query: {
      type: 'discover',
      params: {
        with_genres: '35,10751',
        vote_average: { gte: 7 },
        sort_by: 'vote_average.desc'
      }
    },
    broReply: "Warm vibes only."
  },
  {
    id: 'action',
    label: 'Action that actually slaps',
    query: {
      type: 'discover',
      params: {
        with_genres: '28',
        vote_average: { gte: 7 },
        sort_by: 'popularity.desc'
      }
    },
    broReply: "Fists up. Lets go."
  },
  {
    id: 'trending-shows',
    label: "Everyone is talking about these shows",
    query: {
      type: 'trending',
      params: {
        media_type: 'tv',
        time_window: 'week'
      }
    },
    broReply: "Group chat approved."
  },
  {
    id: 'new-week',
    label: 'New this week',
    query: {
      type: 'discover',
      params: {
        'primary_release_date.gte': 'WEEK_START',
        'primary_release_date.lte': 'TODAY',
        sort_by: 'popularity.desc'
      }
    },
    broReply: "Fresh off the reel."
  },
  {
    id: 'surprise',
    label: 'Surprise me',
    query: {
      type: 'random',
      params: {
        vote_average: { gte: 7 },
        randomize: true
      }
    },
    broReply: "Trust fall. Ready?"
  }
];

// Get random microline
export const getRandomMicroline = () => {
  const lines = [
    "Scrolling again? Respect.",
    "That watchlist isn't clearing itself.",
    "Buzzing harder than your group chat."
  ];
  return lines[Math.floor(Math.random() * lines.length)];
};

// Buzz Moments
export const getRandomBuzzMoment = () => {
  const moments = [
    "Everyone is losing it over this scene.",
    "Twitter can't stop quoting this one.",
    "Weekend champ - 2M streams in 24 hours."
  ];
  return moments[Math.floor(Math.random() * moments.length)];
};

// XP Milestone Messages
export const xpMilestones = {
  10: { message: "First 10. You're in.", emoji: "🎯" },
  50: { message: "50 down. Taste confirmed.", emoji: "👑" },
  100: { message: "Century! Respect earned.", emoji: "🏏" }
};

// XP Action Rewards
export const xpRewards = {
  save: { xp: 1, messages: ["Saved. Nice pick.", "Added to the vault."] },
  watch: { xp: 2, messages: ["Bro is keeping score.", "Enjoy the show."] },
  share: { xp: 3, messages: ["Shared = respected.", "MVP move."] }
};

export const getXPMessage = (action) => {
  const messages = xpRewards[action]?.messages || ["Nice!"];
  return messages[Math.floor(Math.random() * messages.length)];
};
