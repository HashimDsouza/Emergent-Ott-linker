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
 * Open OTT app with fallback to app store
 * @param {string} platform - OTT platform name
 * @param {string} contentId - Content ID
 * @param {string} contentTitle - Content title for fallback search
 */
export const openOTTApp = (platform, contentId, contentTitle) => {
  const { deepLink, webLink, appStore, playStore, platform: userPlatform } = generateOTTDeepLink(platform, contentId);
  
  if (userPlatform === 'web') {
    // Desktop: Open web version
    window.open(webLink, '_blank');
    return;
  }
  
  // Mobile: Try to open app, fallback to store
  const timeout = setTimeout(() => {
    // If app didn't open in 2 seconds, redirect to app store
    const storeLink = userPlatform === 'ios' ? appStore : playStore;
    if (storeLink) {
      window.location.href = storeLink;
    } else {
      // Fallback to Google search
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(contentTitle + ' ' + platform)}`;
    }
  }, 2000);
  
  // Try to open the app
  window.location.href = deepLink;
  
  // Clear timeout if app opens successfully
  window.addEventListener('blur', () => {
    clearTimeout(timeout);
  });
};

/**
 * Generate YouTube search/trailer link
 * @param {string} title - Content title
 * @returns {string} - YouTube URL
 */
export const generateYouTubeLink = (title) => {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`;
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