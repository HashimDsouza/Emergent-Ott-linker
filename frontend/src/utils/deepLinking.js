// Deep linking utility with resolver API integration

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Resolve and open OTT deep link using resolver API
 * @param {string} titleId - Content ID from database
 * @param {string} provider - Provider name
 * @param {string} title - Content title (for fallback)
 */
export const openOTTAppWithResolver = async (titleId, provider, title) => {
  try {
    // Call resolver API
    const response = await fetch(`${API}/resolve-link?title_id=${titleId}&provider=${encodeURIComponent(provider)}&country=IN`);
    
    if (!response.ok) {
      throw new Error('Resolver failed');
    }
    
    const data = await response.json();
    
    // Try to open the resolved URL
    const opened = tryOpenLink(data.url, data.scheme_url, data.fallback_search_url, provider, title);
    
    return opened;
  } catch (error) {
    console.error('Resolver error:', error);
    // Fallback to search
    const fallbackUrl = getSearchUrl(provider, title);
    window.open(fallbackUrl, '_blank');
    return false;
  }
};

/**
 * Try to open link with fallback chain
 */
const tryOpenLink = (url, schemeUrl, fallbackUrl, provider, title) => {
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
  
  if (isMobile && schemeUrl) {
    // On mobile, try scheme URL first (opens app directly)
    try {
      window.location.href = schemeUrl;
      
      // Fallback to web URL after 2 seconds if app doesn't open
      setTimeout(() => {
        window.open(url || fallbackUrl, '_blank');
      }, 2000);
      
      return true;
    } catch (e) {
      // Scheme failed, try web URL
      window.open(url || fallbackUrl, '_blank');
      return false;
    }
  } else {
    // On desktop or no scheme, use web URL
    const targetUrl = url || fallbackUrl;
    
    if (!url && fallbackUrl) {
      // Only fallback available, copy title to clipboard
      copyToClipboard(title);
    }
    
    window.open(targetUrl, '_blank');
    return !!url;
  }
};

/**
 * Copy text to clipboard
 */
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

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
 * Get search URL for platform (fallback)
 */
const getSearchUrl = (platform, title) => {
  const encodedTitle = encodeURIComponent(title);
  
  const searchUrls = {
    'Netflix': `https://www.netflix.com/search?q=${encodedTitle}`,
    'Prime Video': `https://www.primevideo.com/search?phrase=${encodedTitle}`,
    'JioHotstar': `https://www.hotstar.com/in/search/${encodedTitle}`,
    'Apple TV': `https://tv.apple.com/search?term=${encodedTitle}`,
    'SonyLIV': `https://www.sonyliv.com/`,
    'MX Player': `https://www.mxplayer.in/search?q=${encodedTitle}`,
    'Fancode': `https://www.fancode.com/`,
    'YouTube': `https://www.youtube.com/results?search_query=${encodedTitle}`,
  };
  
  return searchUrls[platform] || searchUrls['YouTube'];
};

/**
 * Generate YouTube search/trailer link
 */
export const generateYouTubeLink = (title) => {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`;
};

/**
 * Generate X/Twitter search link
 */
export const generateTwitterLink = (title) => {
  const hashtag = title.replace(/[^a-zA-Z0-9]/g, '');
  return `https://twitter.com/search?q=${encodeURIComponent('#' + hashtag + ' OR ' + title)}&f=live`;
};

/**
 * Generate Reddit search link
 */
export const generateRedditLink = (title) => {
  return `https://www.reddit.com/search/?q=${encodeURIComponent(title)}`;
};

/**
 * Open social media link
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
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
    }
  }
  
  window.open(url, '_blank');
};

export { copyToClipboard };