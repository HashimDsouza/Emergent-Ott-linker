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
    broReply: "Desi vibes only. ✨"
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
    broReply: "Hot list incoming. 🔥"
  },
  {
    id: 'feel-good',
    label: 'Feel-good comfort picks',
    query: {
      type: 'discover',
      params: {
        with_genres: '35,10751', // Comedy, Family
        vote_average: { gte: 7 },
        sort_by: 'vote_average.desc'
      }
    },
    broReply: "Warm vibes only. ☕"
  },
  {
    id: 'action',
    label: 'Action that actually slaps',
    query: {
      type: 'discover',
      params: {
        with_genres: '28', // Action
        vote_average: { gte: 7 },
        sort_by: 'popularity.desc'
      }
    },
    broReply: "Fists up. Let's go. 💥"
  },
  {
    id: 'trending-shows',
    label: 'Everyone's talking about these shows',
    query: {
      type: 'trending',
      params: {
        media_type: 'tv',
        time_window: 'week'
      }
    },
    broReply: "Group chat approved. 💬"
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
    broReply: "Fresh off the reel. 🎬"
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
    broReply: "Trust fall. Ready? 🎲"
  }
];

// Extended Intent Pattern Bank (for search/future use)
export const intentPatterns = [
  {
    keywords: ['hindi', 'bollywood', 'indian', 'desi'],
    query: { with_original_language: 'hi', sort_by: 'popularity.desc' },
    broReply: 'Desi cinema, coming up. 🇮🇳'
  },
  {
    keywords: ['action', 'fight', 'thriller', 'intense'],
    query: { with_genres: '28,53', vote_average: { gte: 6.5 } },
    broReply: 'Edge-of-seat stuff. 💥'
  },
  {
    keywords: ['romance', 'love', 'romantic'],
    query: { with_genres: '10749', vote_average: { gte: 6.5 } },
    broReply: 'Feels incoming. ❤️'
  },
  {
    keywords: ['comedy', 'funny', 'laugh'],
    query: { with_genres: '35', vote_average: { gte: 6.5 } },
    broReply: 'Laughs guaranteed. 😂'
  },
  {
    keywords: ['short', 'quick', 'under hour'],
    query: { with_runtime: { lte: 60 }, vote_average: { gte: 7 } },
    broReply: 'Bite-sized brilliance. ⚡'
  },
  {
    keywords: ['cricket', 'ipl', 't20', 'test match'],
    query: { with_keywords: 'cricket', with_genres: '99' },
    broReply: 'Pitch perfect. 🏏'
  },
  {
    keywords: ['football', 'soccer', 'messi', 'ronaldo', 'uefa'],
    query: { with_keywords: 'football|soccer', with_genres: '99' },
    broReply: 'Goals. Drama. Repeat. ⚽'
  },
  {
    keywords: ['underdog', 'comeback', 'inspiring', 'motivational'],
    query: { with_genres: '99', with_keywords: 'underdog|comeback', vote_average: { gte: 7.5 } },
    broReply: 'From zero to champ. 🏆'
  },
  {
    keywords: ['sports', 'athlete', 'game'],
    query: { with_genres: '99', vote_average: { gte: 7 } },
    broReply: 'Sweat, grit, and goosebumps. 💪'
  },
  {
    keywords: ['new', 'latest', 'recent', 'this week'],
    query: { 'primary_release_date.gte': 'LAST_30_DAYS', sort_by: 'release_date.desc' },
    broReply: 'Straight from the oven. 🔥'
  },
  {
    keywords: ['top', 'best', 'popular', 'trending'],
    query: { sort_by: 'popularity.desc', vote_average: { gte: 7 } },
    broReply: 'Crowd favorites only. ⭐'
  }
];

// Header Microlines (3 mood buckets)
export const headerMicrolines = {
  cheeky: [
    "Scrolling again? Respect.",
    "Bro's been watching too much — what about you?",
    "If it's trending, I've already seen it twice.",
    "Even algorithms can't beat a good recommendation."
  ],
  motivational: [
    "That watchlist isn't clearing itself.",
    "One more episode won't hurt. Or will it?",
    "Tonight's vibe: Zero regrets.",
    "Your next favorite is one tap away."
  ],
  meta: [
    "This page knows you better than your family.",
    "Buzzing harder than your group chat.",
    "Weekend champ energy starts here.",
    "Content discovery, but make it fun."
  ]
};

// Get random microline
export const getRandomMicroline = () => {
  const moods = ['cheeky', 'motivational', 'meta'];
  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  const lines = headerMicrolines[randomMood];
  return lines[Math.floor(Math.random() * lines.length)];
};

// Buzz Moments (static trending commentary)
export const buzzMoments = [
  "Everyone's losing it over this scene.",
  "Twitter can't stop quoting this one.",
  "Weekend champ — 2M streams in 24 hours.",
  "Bigger twist than your group chat.",
  "This one broke the Internet for a reason.",
  "Even your ex liked this one.",
  "Group chats went silent during this scene.",
  "Certified banger. No skips.",
  "Straight fire from start to finish."
];

export const getRandomBuzzMoment = () => {
  return buzzMoments[Math.floor(Math.random() * buzzMoments.length)];
};

// XP Milestone Messages
export const xpMilestones = {
  10: { message: "First 10. You're in.", emoji: "🎯" },
  25: { message: "Quarter century. Solid start.", emoji: "✨" },
  50: { message: "50 down. Taste confirmed.", emoji: "👑" },
  75: { message: "Three-quarter mark. Respect.", emoji: "🔥" },
  100: { message: "Century! Respect earned.", emoji: "🏏" },
  150: { message: "150 XP. Top-tier binge energy.", emoji: "⚡" },
  200: { message: "Double century. Legend status.", emoji: "🏆" }
};

// XP Action Rewards
export const xpRewards = {
  save: { xp: 1, messages: ["Saved. Nice pick.", "Added to the vault.", "Taste confirmed."] },
  watch: { xp: 2, messages: ["Bro's keeping score.", "That's the spirit.", "Enjoy the show."] },
  share: { xp: 3, messages: ["Shared = respected.", "Spreading the good word.", "MVP move."] }
};

export const getXPMessage = (action) => {
  const messages = xpRewards[action]?.messages || ["Nice!"];
  return messages[Math.floor(Math.random() * messages.length)];
};
