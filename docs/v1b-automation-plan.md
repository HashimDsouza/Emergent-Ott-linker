# Game On v1B - Automation Strategy

## 🎯 Goal
Automatically fetch and update trending viral sports clips without manual curation.

---

## 🔧 Technical Implementation

### **1. YouTube Data API v3 Integration**

**What You Need:**
- YouTube Data API Key (free tier: 10,000 units/day)
- Get it from: https://console.cloud.google.com/apis/credentials

**API Endpoint:**
```javascript
GET https://www.googleapis.com/youtube/v3/search

Parameters:
- part: snippet
- q: "sports controversy 2024" or "cricket viral moment"
- type: video
- order: viewCount or relevance
- publishedAfter: (last 7 days)
- videoDuration: short or medium (under 10 mins)
- maxResults: 50
- key: YOUR_API_KEY
```

**Code Example:**
```javascript
// backend/routers/youtube_sports.py

from fastapi import APIRouter
import os
import requests
from datetime import datetime, timedelta

router = APIRouter()

YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"

@router.get("/api/sports/viral-clips")
async def get_viral_sports_clips(sport: str = None, days: int = 7):
    """
    Fetch trending viral sports clips from YouTube
    """
    # Calculate date filter (last N days)
    published_after = (datetime.now() - timedelta(days=days)).isoformat() + "Z"
    
    # Build search query based on sport
    search_queries = {
        'cricket': 'cricket controversy OR cricket viral moment OR cricket fight',
        'football': 'football drama OR football fight OR football viral',
        'all': 'sports controversy OR sports drama OR sports viral moment'
    }
    
    query = search_queries.get(sport, search_queries['all'])
    
    params = {
        'part': 'snippet',
        'q': query,
        'type': 'video',
        'order': 'viewCount',  # Sort by most viewed
        'publishedAfter': published_after,
        'videoDuration': 'medium',  # 4-20 mins
        'maxResults': 50,
        'key': YOUTUBE_API_KEY,
        'regionCode': 'IN',  # Prioritize Indian content
        'relevanceLanguage': 'en'
    }
    
    response = requests.get(YOUTUBE_API_URL, params=params)
    data = response.json()
    
    # Process and filter results
    videos = []
    for item in data.get('items', []):
        video = {
            'videoId': item['id']['videoId'],
            'title': item['snippet']['title'],
            'thumbnail': item['snippet']['thumbnails']['high']['url'],
            'publishedAt': item['snippet']['publishedAt'],
            'channelTitle': item['snippet']['channelTitle']
        }
        
        # Get additional stats (views, likes)
        video_stats = get_video_stats(video['videoId'])
        video.update(video_stats)
        
        videos.append(video)
    
    # Filter and rank
    filtered_videos = filter_videos(videos)
    ranked_videos = rank_videos(filtered_videos)
    
    return ranked_videos[:6]  # Return top 6


def get_video_stats(video_id):
    """Get view count, likes for a video"""
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        'part': 'statistics',
        'id': video_id,
        'key': YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    
    stats = data['items'][0]['statistics']
    return {
        'views': format_views(stats.get('viewCount', 0)),
        'likes': stats.get('likeCount', 0)
    }


def format_views(view_count):
    """Format view count (e.g., 1234567 -> 1.2M)"""
    count = int(view_count)
    if count >= 1000000:
        return f"{count/1000000:.1f}M"
    elif count >= 1000:
        return f"{count/1000:.0f}K"
    return str(count)


def filter_videos(videos):
    """
    Filter out:
    - Low quality (less than 100K views in 7 days)
    - Non-sports channels
    - Clickbait (check title patterns)
    """
    filtered = []
    
    # Trusted sports channels (whitelist)
    trusted_channels = [
        'ICC', 'BCCI', 'ESPN', 'Sky Sports', 'Star Sports',
        'NBA', 'Premier League', 'UEFA', 'ATP Tour', 'WTA'
    ]
    
    # Spam keywords (blacklist)
    spam_keywords = ['free', 'hack', 'download', 'mod', 'leaked']
    
    for video in videos:
        # Check view threshold
        view_count = parse_view_count(video['views'])
        if view_count < 100000:
            continue
        
        # Check for spam
        title_lower = video['title'].lower()
        if any(spam in title_lower for spam in spam_keywords):
            continue
        
        # Bonus points for trusted channels
        if any(channel in video['channelTitle'] for channel in trusted_channels):
            video['trust_score'] = 10
        else:
            video['trust_score'] = 5
        
        filtered.append(video)
    
    return filtered


def rank_videos(videos):
    """
    Rank videos by:
    - Views (40%)
    - Recency (30%)
    - Trust score (20%)
    - Engagement (likes) (10%)
    """
    for video in videos:
        view_score = parse_view_count(video['views']) / 1000000  # Normalize
        recency_score = calculate_recency_score(video['publishedAt'])
        trust_score = video.get('trust_score', 5)
        
        video['rank_score'] = (
            view_score * 0.4 +
            recency_score * 0.3 +
            trust_score * 0.2 +
            int(video.get('likes', 0)) / 10000 * 0.1
        )
    
    # Sort by rank score
    videos.sort(key=lambda x: x['rank_score'], reverse=True)
    return videos


def calculate_recency_score(published_at):
    """Score based on how recent (0-10 scale)"""
    published = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
    hours_ago = (datetime.now(published.tzinfo) - published).total_seconds() / 3600
    
    if hours_ago < 24:
        return 10
    elif hours_ago < 48:
        return 8
    elif hours_ago < 72:
        return 6
    elif hours_ago < 168:  # 1 week
        return 4
    else:
        return 2


def parse_view_count(view_string):
    """Parse view string (e.g., '1.2M' -> 1200000)"""
    if 'M' in view_string:
        return float(view_string.replace('M', '')) * 1000000
    elif 'K' in view_string:
        return float(view_string.replace('K', '')) * 1000
    return float(view_string)
```

---

### **2. AI Enhancement (Gemini Flash)**

**Use AI to:**
- Generate descriptors automatically
- Detect if video is actually sports content
- Tag with sport type
- Rate controversy level

**Code Example:**
```python
from emergentintegrations import get_universal_llm_key, chat_completion

async def generate_video_descriptor(video_title, video_description):
    """
    Use Gemini to generate a short, punchy descriptor
    """
    llm_key = get_universal_llm_key()
    
    prompt = f"""
    You are Bro, a witty sports content curator with a punchy, conversational tone.
    
    Video Title: {video_title}
    Description: {video_description[:200]}
    
    Generate a SHORT descriptor (max 40 characters) that:
    - Captures the drama/controversy
    - Uses Bro voice (punchy, no fluff)
    - Is shareable and meme-worthy
    
    Examples:
    - "Friendship over. Rivalry on."
    - "Drama unfolded. Cards flew."
    - "Physics-defying goal. Again."
    
    Descriptor:
    """
    
    response = chat_completion(
        model="gemini-2.0-flash-exp",
        messages=[{"role": "user", "content": prompt}],
        api_key=llm_key
    )
    
    descriptor = response['choices'][0]['message']['content'].strip()
    return descriptor[:45]  # Enforce max length


async def classify_sports_content(video_title, video_description):
    """
    Use AI to verify if video is actually sports content
    and classify sport type
    """
    llm_key = get_universal_llm_key()
    
    prompt = f"""
    Classify this video:
    Title: {video_title}
    Description: {video_description[:200]}
    
    Output JSON:
    {{
        "is_sports": true/false,
        "sport": "cricket" | "football" | "tennis" | "nba" | "other",
        "is_controversial": true/false,
        "quality_score": 1-10
    }}
    """
    
    response = chat_completion(
        model="gemini-2.0-flash-exp",
        messages=[{"role": "user", "content": prompt}],
        api_key=llm_key,
        response_format={"type": "json_object"}
    )
    
    return response['choices'][0]['message']['content']
```

---

### **3. Caching & Update Strategy**

**Update Frequency:**
- Refresh every 6 hours (4 times/day)
- Store in Redis/MongoDB for faster access
- Serve cached data to users

**Code Example:**
```python
from datetime import datetime, timedelta
import json

# In-memory cache (or use Redis)
video_cache = {}
CACHE_DURATION = timedelta(hours=6)

@router.get("/api/sports/viral-clips")
async def get_viral_sports_clips_cached(sport: str = None):
    cache_key = f"viral_clips_{sport or 'all'}"
    
    # Check cache
    if cache_key in video_cache:
        cached_data, cached_time = video_cache[cache_key]
        if datetime.now() - cached_time < CACHE_DURATION:
            return cached_data
    
    # Fetch fresh data
    videos = await fetch_and_process_videos(sport)
    
    # Update cache
    video_cache[cache_key] = (videos, datetime.now())
    
    return videos
```

---

### **4. Content Moderation**

**Automated Filters:**
- Profanity detection
- Violence level check
- Copyright strike prevention

**Code Example:**
```python
def moderate_content(video):
    """
    Check if video is safe to show
    """
    title_lower = video['title'].lower()
    
    # Profanity check (basic)
    profanity_words = ['explicit', 'nsfw', 'xxx']
    if any(word in title_lower for word in profanity_words):
        return False
    
    # Violence check
    extreme_violence = ['death', 'injury', 'blood']
    if any(word in title_lower for word in extreme_violence):
        return False
    
    # Check channel reputation (use YouTube's channel ID)
    # If channel has copyright strikes, skip
    
    return True
```

---

## 📊 Cost Estimate (v1B)

### **YouTube API:**
- Free tier: 10,000 units/day
- Search query: 100 units
- Video stats: 1 unit per video
- Total: ~150 units per update
- Updates/day: 4 (every 6 hours)
- Total units: 600/day
- **Cost: FREE** ✅

### **Gemini Flash (Emergent LLM Key):**
- Descriptor generation: 6 videos × 4 updates = 24 calls/day
- Classification: 50 videos × 4 updates = 200 calls/day
- Total: 224 calls/day
- Cost per call: ~$0.0001
- **Daily cost: $0.02** ✅

### **Total v1B Cost: ~$0.60/month** ✅

---

## 🚀 Implementation Timeline

### **Week 1:**
- Set up YouTube Data API
- Build basic fetching + filtering
- Test with 50 videos

### **Week 2:**
- Integrate Gemini for descriptors
- Add caching layer
- Build content moderation

### **Week 3:**
- User testing
- Fine-tune ranking algorithm
- Add admin dashboard to review clips

### **Week 4:**
- Deploy to production
- Monitor performance
- A/B test vs manual curation

---

## ✅ Automation Checklist

**Backend:**
- [ ] YouTube Data API key obtained
- [ ] `/api/sports/viral-clips` endpoint created
- [ ] Video fetching + filtering logic
- [ ] Ranking algorithm implemented
- [ ] Caching layer (Redis or in-memory)
- [ ] Content moderation filters
- [ ] Gemini integration for descriptors
- [ ] Scheduled job (cron) for updates

**Frontend:**
- [ ] Update BigMomentsTray to fetch from API
- [ ] Loading states
- [ ] Error handling
- [ ] Fallback to manual data if API fails

**Testing:**
- [ ] Test with 100+ videos
- [ ] Verify spam filtering works
- [ ] Test caching performance
- [ ] Monitor API quota usage
- [ ] A/B test engagement vs v1A

---

## 🎯 Success Metrics

**Engagement:**
- Click-through rate on Big Moments > 15%
- Average time spent on page > 2 mins
- Share rate > 5%

**Quality:**
- User feedback rating > 4/5
- Spam/irrelevant videos < 5%
- Freshness: 80% of videos < 48 hours old

**Performance:**
- API response time < 500ms
- Cache hit rate > 80%
- Zero downtime

---

## 💡 Future Enhancements (v1C+)

1. **Personalization:**
   - Track user clicks
   - Show more cricket if user clicks cricket clips
   - "Because you watched..." section

2. **Social Integration:**
   - Also fetch from X/Twitter
   - Instagram Reels
   - TikTok sports content

3. **Community Curation:**
   - Allow users to submit viral clips
   - Voting system
   - User-generated descriptors

4. **Real-time Updates:**
   - WebSocket for live clip updates
   - "New viral moment just dropped" notifications

5. **Deep Analytics:**
   - Which sports are most viral this week
   - Trending players/teams
   - Predict next viral moment

---

**End of v1B Automation Plan**
