// Deep linking utility functions for OTT apps and social media

/**
 * Detect if user is on iOS or Android
 */
export const detectPlatform = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  return 'web';
};

/**
 * Deep link configurations for OTT platforms
 */
const OTT_DEEP_LINKS = {
  'Netflix': {
    android: 'nflx://www.netflix.com/title/',
    ios: 'nflx://www.netflix.com/title/',
    web: 'https://www.netflix.com/title/',
    appStore: 'https://apps.apple.com/app/netflix/id363590051',
    playStore: 'https://play.google.com/store/apps/details?id=com.netflix.mediaclient'
  },
  'Prime Video': {
    android: 'aiv://aiv/view?gti=',
    ios: 'aiv://aiv/view?gti=',
    web: 'https://www.primevideo.com/detail/',
    appStore: 'https://apps.apple.com/app/amazon-prime-video/id545519333',
    playStore: 'https://play.google.com/store/apps/details?id=com.amazon.avod.thirdpartyclient'
  },
  'JioHotstar': {
    android: 'hotstar://content/',
    ios: 'hotstar://content/',
    web: 'https://www.hotstar.com/in/',
    appStore: 'https://apps.apple.com/app/hotstar/id934459219',
    playStore: 'https://play.google.com/store/apps/details?id=in.startv.hotstar'
  },
  'Apple TV': {
    android: 'https://tv.apple.com/',
    ios: 'com.apple.tv://tv.apple.com/',
    web: 'https://tv.apple.com/',
    appStore: 'https://apps.apple.com/app/apple-tv/id1174078549',
    playStore: 'https://play.google.com/store/apps/details?id=com.apple.atve.androidtv.appletv'
  },
  'SonyLIV': {
    android: 'sonyliv://content/',
    ios: 'sonyliv://content/',
    web: 'https://www.sonyliv.com/',
    appStore: 'https://apps.apple.com/app/sonyliv/id998099426',
    playStore: 'https://play.google.com/store/apps/details?id=com.msmpl.livsportsphone'
  },
  'MX Player': {
    android: 'mxplayer://play/',
    ios: 'mxplayer://play/',
    web: 'https://www.mxplayer.in/',
    appStore: 'https://apps.apple.com/app/mx-player/id1445507777',
    playStore: 'https://play.google.com/store/apps/details?id=com.mxtech.videoplayer.ad'
  }
};

/**
 * Generate deep link for OTT platform
 * @param {string} platform - OTT platform name (e.g., 'Netflix')
 * @param {string} contentId - Content ID or slug
 * @returns {object} - Deep link URLs for different platforms
 */
export const generateOTTDeepLink = (platform, contentId = '') => {
  const config = OTT_DEEP_LINKS[platform];
  
  if (!config) {
    return {
      deepLink: null,
      webLink: `https://www.google.com/search?q=${encodeURIComponent(platform)}`,
      appStore: null,
      playStore: null
    };
  }
  
  const platformType = detectPlatform();
  
  return {
    deepLink: platformType === 'web' ? config.web + contentId : 
              platformType === 'ios' ? config.ios + contentId : 
              config.android + contentId,
    webLink: config.web + contentId,
    appStore: config.appStore,
    playStore: config.playStore,
    platform: platformType
  };
};

/**
 * Open OTT app with fallback to search/home
 * @param {string} platform - OTT platform name
 * @param {string} platformContentId - Real platform content ID (optional)
 * @param {string} contentTitle - Content title for search fallback
 */
export const openOTTApp = (platform, platformContentId, contentTitle) => {
  // If we have a real platform content ID, use it
  const targetUrl = platformContentId 
    ? getDirectUrl(platform, platformContentId)
    : getSearchUrl(platform, contentTitle);
  
  // For mobile, try to open in app first for specific platforms
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
  
  if (isMobile && !platformContentId) {
    // On mobile without content ID, try app deep links first
    const deepLink = getMobileDeepLink(platform, contentTitle);
    if (deepLink) {
      // Try to open app
      window.location.href = deepLink;
      
      // Fallback to web after 2 seconds if app doesn't open
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 2000);
      return;
    }
  }
  
  // Default: Open in new tab/window
  window.open(targetUrl, '_blank');
};

/**
 * Get mobile app deep links
 */
const getMobileDeepLink = (platform, title) => {
  const encodedTitle = encodeURIComponent(title);
  
  const deepLinks = {
    'Netflix': `nflx://www.netflix.com/search?q=${encodedTitle}`,
    'JioHotstar': `hotstar://search/${encodedTitle}`,
    'Prime Video': `aiv://search/${encodedTitle}`,
  };
  
  return deepLinks[platform] || null;
};

/**
 * Get direct URL for platform with content ID
 * @param {string} platform - OTT platform name
 * @param {string} contentId - Platform-specific content ID
 * @returns {string} - Direct URL to content
 */
const getDirectUrl = (platform, contentId) => {
  const directUrls = {
    'Netflix': `https://www.netflix.com/title/${contentId}`,
    'Prime Video': `https://www.primevideo.com/detail/${contentId}`,
    'JioHotstar': `https://www.hotstar.com/in/${contentId}`,
    'Apple TV': `https://tv.apple.com/show/${contentId}`,
    'SonyLIV': `https://www.sonyliv.com/shows/${contentId}`,
    'MX Player': `https://www.mxplayer.in/show/${contentId}`,
    'Fancode': `https://www.fancode.com/`,
    'YouTube': `https://www.youtube.com/results?search_query=${encodeURIComponent(contentId)}`
  };
  
  return directUrls[platform] || getSearchUrl(platform, contentId);
};

/**
 * Get search URL for platform
 * @param {string} platform - OTT platform name
 * @param {string} title - Content title
 * @returns {string} - Search URL
 */
const getSearchUrl = (platform, title) => {
  const encodedTitle = encodeURIComponent(title);
  
  const searchUrls = {
    'Netflix': `https://www.netflix.com/search?q=${encodedTitle}`,
    'Prime Video': `https://www.primevideo.com/search?phrase=${encodedTitle}`,
    'JioHotstar': `https://www.hotstar.com/in/search/all?q=${encodedTitle}`,
    'Apple TV': `https://tv.apple.com/search?term=${encodedTitle}`,
    'SonyLIV': `https://www.sonyliv.com/search?searchQuery=${encodedTitle}`,
    'MX Player': `https://www.mxplayer.in/search?q=${encodedTitle}`,
    'Fancode': `https://www.fancode.com/`,  // Direct to homepage
    'YouTube': `https://www.youtube.com/results?search_query=${encodedTitle}`,
    'FIDE': `https://www.youtube.com/results?search_query=${encodedTitle}`,
  };
  
  return searchUrls[platform] || searchUrls['YouTube'];
};

/**
 * Generate YouTube search/trailer link
 * @param {string} title - Content title
 * @returns {string} - YouTube URL
 */
export const generateYouTubeLink = (title) => {
  // Use direct link format that's less likely to be blocked
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;
};

/**
 * Generate X/Twitter search link
 * @param {string} title - Content title
 * @returns {string} - Twitter URL
 */
export const generateTwitterLink = (title) => {
  const hashtag = title.replace(/[^a-zA-Z0-9]/g, '');
  return `https://twitter.com/search?q=${encodeURIComponent('#' + hashtag + ' OR ' + title)}&f=live`;
};

/**
 * Generate Reddit search link
 * @param {string} title - Content title
 * @returns {string} - Reddit URL
 */
export const generateRedditLink = (title) => {
  return `https://www.reddit.com/search/?q=${encodeURIComponent(title)}`;
};

/**
 * Open social media link
 * @param {string} type - 'youtube', 'twitter', or 'reddit'
 * @param {string} title - Content title
 * @param {string} customUrl - Custom URL if available
 */
export const openSocialLink = (type, title, customUrl = null) => {
  let url;
  
  if (customUrl && customUrl !== '#') {
    url = customUrl;
  } else {
    switch (type) {
      case 'youtube':
        url = generateYouTubeLink(title);
        break;
      case 'twitter':
        url = generateTwitterLink(title);
        break;
      case 'reddit':
        url = generateRedditLink(title);
        break;
      default:
        url = `https://www.google.com/search?q=${encodeURIComponent(title)}`;
    }
  }
  
  window.open(url, '_blank');
};