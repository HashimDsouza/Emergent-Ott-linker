// Deep Links Configuration for Top Curated Content
// Manual mapping of TMDB IDs to platform-specific title URLs

// Platform Configuration - URL patterns and app details
export const platformConfig = {
  netflix: {
    name: 'Netflix',
    webUrlPattern: 'https://www.netflix.com/title/{titleId}',
    searchFallback: 'https://www.netflix.com/search?q={query}',
    androidPackage: 'com.netflix.mediaclient',
    iosAppStoreId: 'id363590051',
    iosBundleId: 'com.netflix.Netflix',
    supportsDeepLink: true
  },
  prime: {
    name: 'Prime Video',
    webUrlPattern: 'https://www.primevideo.com/detail/{titleId}',
    searchFallback: 'https://www.primevideo.com/search?q={query}',
    androidPackage: 'com.amazon.avod.thirdpartyclient',
    iosAppStoreId: 'id545519333',
    iosBundleId: 'com.amazon.aiv.AIVApp',
    supportsDeepLink: true
  },
  jiohotstar: {
    name: 'JioHotstar',
    webUrlPattern: 'https://www.hotstar.com/in/movies/{slug}/{titleId}',
    searchFallback: 'https://www.hotstar.com/in/search?q={query}',
    androidPackage: 'in.startv.hotstar',
    iosAppStoreId: 'id934459219',
    iosBundleId: 'in.startv.hotstar',
    supportsDeepLink: true
  },
  sonyliv: {
    name: 'Sony LIV',
    webUrlPattern: 'https://www.sonyliv.com/shows/{slug}-{titleId}',
    searchFallback: 'https://www.sonyliv.com/search?q={query}',
    androidPackage: 'com.sonyliv',
    iosAppStoreId: 'id1147002833',
    iosBundleId: 'com.msm.sonyliv',
    supportsDeepLink: true
  },
  zee5: {
    name: 'Zee5',
    webUrlPattern: 'https://www.zee5.com/movies/details/{slug}/{titleId}',
    searchFallback: 'https://www.zee5.com/search?q={query}',
    androidPackage: 'com.graymatrix.did',
    iosAppStoreId: 'id743691886',
    iosBundleId: 'com.zee5.Zee5',
    supportsDeepLink: true
  },
  appletv: {
    name: 'Apple TV+',
    webUrlPattern: 'https://tv.apple.com/in/movie/{slug}/{titleId}',
    searchFallback: 'https://tv.apple.com/in/search?q={query}',
    androidPackage: null, // Apple TV+ web only on Android
    iosAppStoreId: 'id1174078549',
    iosBundleId: 'com.apple.tv',
    supportsDeepLink: true
  },
  fancode: {
    name: 'Fancode',
    webUrlPattern: 'https://www.fancode.com/match/{titleId}',
    searchFallback: 'https://www.fancode.com/',
    androidPackage: 'com.fancode.app',
    iosAppStoreId: 'id1499311828',
    iosBundleId: 'com.fancode.app',
    supportsDeepLink: false // Event-based, varies
  },
  dazn: {
    name: 'Dazn',
    webUrlPattern: 'https://www.dazn.com/en-IN/watch/{titleId}',
    searchFallback: 'https://www.dazn.com/en-IN/',
    androidPackage: 'com.dazn',
    iosAppStoreId: 'id1129523589',
    iosBundleId: 'com.dazn.theApp',
    supportsDeepLink: false // Regional restrictions
  }
};

// Manual Deep Links Database
// Format: [tmdbId]: { [platform]: { titleId, slug (optional) } }
export const curatedDeepLinks = {
  // Fighter (2024) - TMDB ID: 945961
  '945961': {
    netflix: null,
    prime: null,
    jiohotstar: { titleId: '1260123456', slug: 'fighter' },
    sonyliv: null,
    zee5: null
  },
  
  // 12th Fail (2023) - TMDB ID: 1014590
  '1014590': {
    netflix: { titleId: '81587293' },
    prime: null,
    jiohotstar: { titleId: '1260089765', slug: '12th-fail' },
    sonyliv: null,
    zee5: null
  },
  
  // House of the Dragon Season 1 - TMDB ID: 94997
  '94997': {
    netflix: null,
    prime: null,
    jiohotstar: { titleId: '1260100819', slug: 'house-of-the-dragon' },
    sonyliv: null,
    zee5: null
  },
  
  // Squid Game Season 2 - TMDB ID: 93405
  '93405': {
    netflix: { titleId: '81040344' },
    prime: null,
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // The Great Indian Kapil Show - TMDB ID: (custom)
  'kapil-show-2024': {
    netflix: { titleId: '81645130' },
    prime: null,
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Maharaja (2024) - TMDB ID: 1079091
  '1079091': {
    netflix: { titleId: '81732476' },
    prime: null,
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Mirzapur Season 3 - TMDB ID: 84105
  '84105': {
    netflix: null,
    prime: { titleId: 'B0D9F8KZXT' },
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Asur Season 3 - TMDB ID: 100911
  '100911': {
    netflix: null,
    prime: null,
    jiohotstar: { titleId: '1260027783', slug: 'asur' },
    sonyliv: null,
    zee5: null
  },
  
  // Panchayat Season 3 - TMDB ID: 113301
  '113301': {
    netflix: null,
    prime: { titleId: 'B0D56XQFYF' },
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Slow Horses Season 5 - TMDB ID: 136315
  '136315': {
    netflix: null,
    prime: null,
    jiohotstar: null,
    sonyliv: null,
    zee5: null,
    appletv: { titleId: 'umc.cmc.2nxdg86917wrr0zq5q8xqj0z5', slug: 'slow-horses' }
  },
  
  // The Family Man Season 3 - TMDB ID: 87739
  '87739': {
    netflix: null,
    prime: { titleId: 'B084QR1JJV' },
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Laapataa Ladies - TMDB ID: 1029281
  '1029281': {
    netflix: { titleId: '81587287' },
    prime: null,
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Stree 2 - TMDB ID: 1035048
  '1035048': {
    netflix: null,
    prime: { titleId: 'B0DK8ZXXXX' },
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  },
  
  // Kalki 2898 AD - TMDB ID: 1096342
  '1096342': {
    netflix: { titleId: '81738053' },
    prime: { titleId: 'B0DFXXXXXX' },
    jiohotstar: null,
    sonyliv: null,
    zee5: null
  }
  
  // TODO: Add more titles as needed (target: 30-50 titles)
  // Format reference:
  // 'tmdb-id': {
  //   platform: { titleId: 'platform-specific-id', slug: 'optional-slug' },
  //   platform2: null  // Not available on this platform
  // }
};

// Helper function to check if deep link exists for a title
export const hasDeepLink = (tmdbId, platform) => {
  return curatedDeepLinks[tmdbId]?.[platform] !== undefined && 
         curatedDeepLinks[tmdbId]?.[platform] !== null;
};

// Helper function to get deep link data
export const getDeepLinkData = (tmdbId, platform) => {
  return curatedDeepLinks[tmdbId]?.[platform];
};

// Helper function to get platform config
export const getPlatformConfig = (platform) => {
  return platformConfig[platform];
};
