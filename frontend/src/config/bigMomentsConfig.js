// Big Moments - Trending Viral Sports Clips
// v1A: Manually curated from current trending YouTube content
// v1B: Will be automated via YouTube API

export const bigMomentsVideos = [
  {
    id: 1,
    videoId: 'VrD9xUT25lk', // Kohli-Smith catch controversy
    title: 'Kohli Survives! Smith Stunned - Controversial Catch',
    sport: 'cricket',
    league: 'IND vs AUS',
    descriptor: 'Catch or not? Cricket divided.',
    thumbnail: 'https://img.youtube.com/vi/VrD9xUT25lk/maxresdefault.jpg',
    uploadedAgo: '2 days ago',
    views: '1.2M'
  },
  {
    id: 2,
    videoId: 'QZUbokO94y0', // Kohli-Konstas shoulder bump
    title: 'Virat Kohli vs Sam Konstas - Shoulder Bump Drama',
    sport: 'cricket',
    league: 'Boxing Day Test',
    descriptor: 'Boxing Day drama. Fines incoming.',
    thumbnail: 'https://img.youtube.com/vi/QZUbokO94y0/maxresdefault.jpg',
    uploadedAgo: '1 week ago',
    views: '2.8M'
  },
  {
    id: 3,
    videoId: 'SkhIMPe9ikQ', // A-Leagues viral moments
    title: 'A-League Top 20 Viral Moments 2024',
    sport: 'football',
    league: 'A-League',
    descriptor: 'Goals, skills, chaos. Pure gold.',
    thumbnail: 'https://img.youtube.com/vi/SkhIMPe9ikQ/maxresdefault.jpg',
    uploadedAgo: '3 days ago',
    views: '856K'
  },
  {
    id: 4,
    videoId: 'LpPRe-kMwLk', // Football drama compilation
    title: 'Football Angry Moments & Fights 2024',
    sport: 'football',
    league: 'Multiple',
    descriptor: 'Tempers flare. Cards fly.',
    thumbnail: 'https://img.youtube.com/vi/LpPRe-kMwLk/maxresdefault.jpg',
    uploadedAgo: '5 days ago',
    views: '1.5M'
  },
  {
    id: 5,
    videoId: 'eXVEF3kO_zk', // General sports viral 2024
    title: '24 Most Viral Sports Moments 2024',
    sport: 'multiple',
    league: 'Multi-Sport',
    descriptor: "Year's wildest moments. Buckle up.",
    thumbnail: 'https://img.youtube.com/vi/eXVEF3kO_zk/maxresdefault.jpg',
    uploadedAgo: '1 week ago',
    views: '3.2M'
  },
  {
    id: 6,
    videoId: '1DhQOMPl4UQ', // Kohli-Smith specific analysis
    title: 'Steve Smith Reacts to Kohli Catch Controversy',
    sport: 'cricket',
    league: 'IND vs AUS',
    descriptor: 'Smith speaks. Internet erupts.',
    thumbnail: 'https://img.youtube.com/vi/1DhQOMPl4UQ/maxresdefault.jpg',
    uploadedAgo: '2 days ago',
    views: '890K'
  }
];

// Helper function to get video embed URL
export const getYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// Helper function to get video watch URL
export const getYouTubeWatchUrl = (videoId) => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

// Helper function to get thumbnail (multiple quality options)
export const getYouTubeThumbnail = (videoId, quality = 'maxresdefault') => {
  // quality options: 'maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};
