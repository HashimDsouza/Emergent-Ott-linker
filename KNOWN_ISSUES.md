# Known Issues - OTT Linker

## Game On Module - Parked for Later

### YouTube Video Thumbnails & Links Issue
**Status:** 🟡 Parked  
**Priority:** Medium  
**Affected Components:** HighlightsTray.jsx, BestOfTray.jsx

**Description:**
Some YouTube video thumbnails are not displaying in the Highlights and Best Of trays. When thumbnails are missing, clicking the video tile does not open the YouTube link.

**Affected Videos:**
- Some video IDs in highlightsVideos array (sportsConfig.js)
- Some video IDs in bestOfVideos array (sportsConfig.js)

**Possible Causes:**
1. Invalid or removed YouTube video IDs
2. Age-restricted content preventing thumbnail loading
3. Regional restrictions on certain videos
4. YouTube API quota limits on thumbnail requests

**Proposed Solutions for Later:**
1. Validate all YouTube video IDs before deployment
2. Implement YouTube Data API v3 for reliable video metadata
3. Add fallback thumbnails for missing videos
4. Create error handling for broken video links
5. Use YouTube API to verify video availability before adding to config

**Temporary Workaround:**
Using a mix of real and placeholder video IDs. Working videos display correctly.

**Related Files:**
- `/app/frontend/src/config/sportsConfig.js` - Video ID configurations
- `/app/frontend/src/components/HighlightsTray.jsx` - Highlights component
- `/app/frontend/src/components/BestOfTray.jsx` - Best Of component

---

## Other Pending Issues

### Watch On Tile Sizing (Web View)
**Status:** 🟡 Parked  
**Priority:** Low  
**Description:** User reports tiles still too large on desktop despite multiple adjustments. May need further refinement in responsive breakpoints.

### Buzz Meter Images
**Status:** 🟡 Parked for Phase 1B  
**Priority:** Medium  
**Description:** Need to resolve ORB/CORS issues to display real TMDB/social media images instead of CSS gradients.

### Hero Carousel Cropping
**Status:** 🟡 Pending  
**Priority:** Low  
**Description:** Hero carousel images getting cut from the top on desktop view.

### Sports Tray Images
**Status:** 🟡 Pending  
**Priority:** Medium  
**Description:** Debug and fix sports images not loading (if still an issue after recent flag/logo implementation).

### Header Social Media Chat Icon
**Status:** 🟡 Pending  
**Priority:** Low  
**Description:** Chat icon disappearing on Line 1 of tiles.

---

**Last Updated:** Game On v1A - January 6, 2025  
**Stable Checkpoint:** Saved to GitHub
