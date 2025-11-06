# Deep Link Testing Guide

## Quick Mobile Test

### Testing on Your Phone:

1. **Open browser console** (if possible) or check logs
2. **Click on tiles** and watch console output
3. **Expected behavior:**

**For curated content (with 📲 icon):**
- Console shows: `[DeepLink] Starting:` with title info
- Console shows: `[DeepLink] Config found: { hasCuratedLink: true }`
- Console shows: `[DeepLink] Target URL:` with full URL
- **iOS:** Page navigates away, app opens (or Safari opens URL)
- **Android:** New tab opens with URL, Android prompts to open app

**For non-curated content (no 📲 icon):**
- Same console logs but `hasCuratedLink: false`
- Opens search URL on platform

### Expected URLs by Platform:

**Netflix (curated):**
- `https://www.netflix.com/title/81587293`
- Should open Netflix app if installed

**Prime Video (curated):**
- `https://www.primevideo.com/detail/B0D9F8KZXT`
- Should open Prime app if installed

**JioHotstar (curated):**
- `https://www.hotstar.com/in/movies/fighter/1260123456`
- Should open Hotstar app if installed

**Non-curated (fallback):**
- Netflix: `https://www.netflix.com/search?q=Title+Name`
- Prime: `https://www.primevideo.com/search?q=Title+Name`

## Troubleshooting:

### If clicking does nothing:
- Check console for JavaScript errors
- Verify platform name matches config (netflix, prime, jiohotstar - lowercase, no spaces)
- Check if tmdb_id exists on the tile data

### If wrong URL opens:
- Check console for `[DeepLink] Target URL:`
- Verify title has entry in curatedDeepLinks for that platform
- Check platform config in deepLinks.js

### If app doesn't open:
- This is expected behavior sometimes (70-80% success rate)
- Verify app is actually installed
- Check if you're logged into the app
- Try opening the same URL manually in mobile browser

## Platform-Specific Notes:

**iOS:**
- Uses `window.location.href` for better app detection
- Universal Links work automatically if app supports it
- No pop-ups or prompts

**Android:**
- Uses direct URL navigation
- Modern Android handles App Links automatically
- May see browser "Open with" prompt

**Desktop:**
- Always opens web version in new tab
- No app detection needed

## Debug Commands:

Open browser console on phone and run:

```javascript
// Check if deep link config exists
console.log(window.localStorage.getItem('deeplink_clicks'));

// Test a specific platform
import { getPlatformInfo } from './utils/deepLinkHandler';
console.log(getPlatformInfo('netflix'));
```

## Common Issues:

1. **"Platform config not found"** → Platform name doesn't match config key
2. **Blank page** → URL construction failed, check console logs
3. **No redirect** → Click handler not firing, check if preventDefault() is working
4. **Wrong search page** → Title name has special characters, encoding issue

## Next Steps After Testing:

1. Report which platforms work vs don't work
2. Share console logs for failing clicks
3. Specify if iOS or Android (or both)
4. Note if apps are installed or not
