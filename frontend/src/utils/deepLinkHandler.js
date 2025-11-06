// Deep Link Handler - Smart routing to OTT apps with fallbacks
// Handles iOS Universal Links, Android App Links, and store fallbacks

import { curatedDeepLinks, platformConfig } from '../config/deepLinks';

// Detect user platform
const getPlatform = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }
  if (/android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
};

// Build the final URL based on deep link data
const buildDeepLinkUrl = (deepLinkData, config, titleName) => {
  if (!deepLinkData) {
    // Fallback to search URL
    return config.searchFallback.replace('{query}', encodeURIComponent(titleName));
  }

  const { titleId, slug } = deepLinkData;
  let url = config.webUrlPattern;
  
  // Replace placeholders
  url = url.replace('{titleId}', titleId);
  if (slug) {
    url = url.replace('{slug}', slug);
  }
  
  return url;
};

// Get store URL for app installation
const getStoreUrl = (userPlatform, config) => {
  if (userPlatform === 'ios' && config.iosAppStoreId) {
    return `https://apps.apple.com/app/${config.iosAppStoreId}`;
  }
  if (userPlatform === 'android' && config.androidPackage) {
    return `https://play.google.com/store/apps/details?id=${config.androidPackage}`;
  }
  return null;
};

// Main deep link handler
export const handleDeepLink = (tmdbId, ottPlatform, titleName, titleData = {}) => {
  const userPlatform = getPlatform();
  const config = platformConfig[ottPlatform];
  
  if (!config) {
    console.error(`Platform config not found for: ${ottPlatform}`);
    return null;
  }

  // Get deep link data from curated list
  const deepLinkData = curatedDeepLinks[tmdbId]?.[ottPlatform];
  
  // Check if this is curated content with deep link
  const hasCuratedLink = deepLinkData !== undefined && deepLinkData !== null;
  
  // Build the URL
  const targetUrl = buildDeepLinkUrl(ottPlatform, deepLinkData, config, titleName);
  
  // Track the click
  trackDeepLinkClick(tmdbId, ottPlatform, hasCuratedLink, userPlatform);
  
  // Handle iOS
  if (userPlatform === 'ios') {
    // iOS Universal Links - open URL directly
    // If app is installed, it will open in app
    // If not, it will open in Safari
    window.open(targetUrl, '_blank');
    return {
      method: 'universal_link',
      platform: userPlatform,
      hasCuratedLink,
      url: targetUrl
    };
  }
  
  // Handle Android
  if (userPlatform === 'android' && config.androidPackage) {
    // Try app-first approach with intent URL
    try {
      // Build Android Intent URL
      const intentUrl = `intent://${targetUrl.replace('https://', '')}#Intent;scheme=https;package=${config.androidPackage};end`;
      
      // Try to open app via intent
      window.location.href = intentUrl;
      
      // Fallback to Play Store after 2.5 seconds if app doesn't open
      setTimeout(() => {
        if (document.hasFocus()) {
          // User is still on page = app didn't open
          const storeUrl = getStoreUrl(userPlatform, config);
          if (storeUrl) {
            const shouldRedirect = window.confirm(
              `${config.name} app not installed. Open Play Store?`
            );
            if (shouldRedirect) {
              window.open(storeUrl, '_blank');
            }
          }
        }
      }, 2500);
      
      return {
        method: 'android_intent',
        platform: userPlatform,
        hasCuratedLink,
        url: intentUrl
      };
    } catch (e) {
      // Fallback to direct URL
      window.open(targetUrl, '_blank');
      return {
        method: 'android_fallback',
        platform: userPlatform,
        hasCuratedLink,
        url: targetUrl
      };
    }
  }
  
  // Handle Desktop - just open web URL
  window.open(targetUrl, '_blank');
  return {
    method: 'web',
    platform: userPlatform,
    hasCuratedLink,
    url: targetUrl
  };
};

// Check if a title has curated deep link
export const hasCuratedDeepLink = (tmdbId, platform) => {
  const deepLinkData = curatedDeepLinks[tmdbId]?.[platform];
  return deepLinkData !== undefined && deepLinkData !== null;
};

// Get platform display info
export const getPlatformInfo = (platformKey) => {
  return platformConfig[platformKey] || null;
};

// Track deep link clicks for analytics
const trackDeepLinkClick = (tmdbId, platform, hasCuratedLink, userPlatform) => {
  try {
    // Store in localStorage for basic analytics
    const clicks = JSON.parse(localStorage.getItem('deeplink_clicks') || '[]');
    clicks.push({
      tmdbId,
      platform,
      hasCuratedLink,
      userPlatform,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 clicks
    if (clicks.length > 100) {
      clicks.shift();
    }
    
    localStorage.setItem('deeplink_clicks', JSON.stringify(clicks));
    
    // Console log for debugging
    console.log('[DeepLink]', {
      tmdbId,
      platform,
      hasCuratedLink: hasCuratedLink ? '✅ Curated' : '⚠️ Fallback',
      userPlatform
    });
  } catch (e) {
    // Fail silently
  }
};

// Get analytics summary (for debugging/testing)
export const getDeepLinkAnalytics = () => {
  try {
    const clicks = JSON.parse(localStorage.getItem('deeplink_clicks') || '[]');
    const total = clicks.length;
    const curated = clicks.filter(c => c.hasCuratedLink).length;
    const fallback = total - curated;
    
    const byPlatform = clicks.reduce((acc, click) => {
      acc[click.platform] = (acc[click.platform] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      curated,
      fallback,
      curatedPercentage: total > 0 ? Math.round((curated / total) * 100) : 0,
      byPlatform,
      recentClicks: clicks.slice(-10)
    };
  } catch (e) {
    return null;
  }
};
