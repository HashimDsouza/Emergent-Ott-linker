# Platform Content ID Integration Guide

## Overview
The `platform_content_id` field has been added to store real content IDs from OTT platforms, enabling direct linking to platform-specific content pages.

## Field Details
- **Field Name**: `platform_content_id`
- **Type**: `Optional[str]` (can be null)
- **Purpose**: Store the actual content ID used by the OTT platform
- **Location**: Added to both `Content` and `ContentCreate` models

## Platform-Specific Content ID Examples

### Netflix
- **Format**: Title ID (numeric)
- **Example**: `80057281` (for "Stranger Things")
- **URL Pattern**: `https://www.netflix.com/title/{platform_content_id}`

### Prime Video
- **Format**: ASIN or content ID
- **Example**: `B08CVDPQG2` (for "The Boys")
- **URL Pattern**: `https://www.primevideo.com/detail/{platform_content_id}`

### JioHotstar
- **Format**: Content ID (numeric or alphanumeric)
- **Example**: `1260013754` (for IPL matches)
- **URL Pattern**: `https://www.hotstar.com/in/tv/{platform_content_id}`

### SonyLIV
- **Format**: Show/movie ID
- **Example**: `show_1000000123`
- **URL Pattern**: `https://www.sonyliv.com/shows/{platform_content_id}`

### Apple TV+
- **Format**: Content ID
- **Example**: `umc.cmc.1srk2goyh2q2kdm25ks6vtiqx`
- **URL Pattern**: `https://tv.apple.com/show/{platform_content_id}`

## Usage Examples

### Creating Content with Platform ID
```json
{
  "title": "Stranger Things",
  "category": "series",
  "platform": "Netflix",
  "platform_content_id": "80057281",
  "rating": 4.8,
  "thumbnail": "https://example.com/image.jpg",
  "description": "Supernatural series set in the 1980s",
  "release_date": "2024",
  "content_type": "series",
  "tagline": "Friends don't lie"
}
```

### API Response
```json
{
  "id": "uuid-generated-id",
  "title": "Stranger Things",
  "platform": "Netflix",
  "platform_content_id": "80057281",
  "direct_link": "https://www.netflix.com/title/80057281",
  ...
}
```

## Implementation Benefits

1. **Direct Platform Links**: Generate direct URLs to content on OTT platforms
2. **Deep Linking**: Enable mobile app deep links to platform apps
3. **Analytics**: Track which platform content is most popular
4. **Content Verification**: Verify content exists on the platform
5. **API Integration**: Fetch real-time data from platform APIs

## Frontend Integration

### Generating Platform URLs
```javascript
function getPlatformUrl(content) {
  if (!content.platform_content_id) return null;
  
  const urlPatterns = {
    'Netflix': `https://www.netflix.com/title/${content.platform_content_id}`,
    'Prime Video': `https://www.primevideo.com/detail/${content.platform_content_id}`,
    'JioHotstar': `https://www.hotstar.com/in/tv/${content.platform_content_id}`,
    'SonyLIV': `https://www.sonyliv.com/shows/${content.platform_content_id}`,
    'Apple TV': `https://tv.apple.com/show/${content.platform_content_id}`
  };
  
  return urlPatterns[content.platform] || null;
}
```

### Watch Now Button
```jsx
function WatchNowButton({ content }) {
  const platformUrl = getPlatformUrl(content);
  
  if (!platformUrl) {
    return <button disabled>Platform Link Not Available</button>;
  }
  
  return (
    <a href={platformUrl} target="_blank" rel="noopener noreferrer">
      <button>Watch on {content.platform}</button>
    </a>
  );
}
```

## Data Migration
Existing content will have `platform_content_id` as `null`. To populate:

1. **Manual Entry**: Add IDs for popular content manually
2. **API Integration**: Use platform APIs to fetch content IDs
3. **Web Scraping**: Extract IDs from platform URLs (where permitted)
4. **User Contributions**: Allow users to submit platform IDs

## Next Steps

1. Update frontend to display "Watch Now" buttons when `platform_content_id` is available
2. Implement URL generation functions for each platform
3. Add validation to ensure platform_content_id format matches the platform
4. Consider adding a content verification system using platform APIs