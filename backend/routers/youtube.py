"""
YouTube Data API Router - Sports Highlights Integration
Provides sports highlight videos for Game On → Highlights tray
"""

from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/youtube", tags=["youtube"])

# YouTube configuration
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3"

# Cache for API responses (24-48 hours for sports highlights)
_highlights_cache = {}
_cache_duration = 86400 * 2  # 48 hours

# Official/verified sports channels (allowlist)
OFFICIAL_SPORTS_CHANNELS = {
    'premier_league': {
        'name': 'Premier League',
        'channel_ids': ['UCG5qGWdu8nIRZqJ_GgDwQ-w'],  # Official Premier League
        'search_terms': ['Premier League highlights', 'EPL highlights']
    },
    'cricket': {
        'name': 'ICC Cricket',
        'channel_ids': ['UChi1pCfCy-7jZT5Z7NR5kUQ'],  # ICC Official
        'search_terms': ['ICC highlights', 'Cricket World Cup highlights']
    },
    'uefa': {
        'name': 'UEFA Champions League',
        'channel_ids': ['UCG9P5ASlZTQeCFfDOoHRGSg'],  # UEFA Official
        'search_terms': ['Champions League highlights', 'UCL highlights']
    },
    'formula1': {
        'name': 'Formula 1',
        'channel_ids': ['UCB0BSO0ZB31M9a9yBq5Hs5Q'],  # F1 Official
        'search_terms': ['Formula 1 highlights', 'F1 Grand Prix highlights']
    },
    'tennis': {
        'name': 'ATP/WTA Tennis',
        'channel_ids': ['UCbcxFkd6B9xUU54InHv4Tig', 'UCx8qIXj7Kht9vqKVXcWqMfA'],  # ATP & WTA
        'search_terms': ['ATP highlights', 'Grand Slam highlights', 'Tennis highlights']
    },
    'nba': {
        'name': 'NBA',
        'channel_ids': ['UCWJ2lWNubArHWmf3FIHbfcQ'],  # NBA Official
        'search_terms': ['NBA highlights', 'NBA game highlights']
    }
}


async def make_youtube_api_call(endpoint: str, params: Dict) -> Optional[Dict]:
    """Make API call to YouTube Data API with error handling"""
    try:
        if not YOUTUBE_API_KEY:
            logging.error("YouTube API key not configured")
            return None
            
        url = f"{YOUTUBE_BASE_URL}/{endpoint}"
        params['key'] = YOUTUBE_API_KEY
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                logging.info(f"YouTube API call successful: {endpoint}")
                return data
            elif response.status_code == 403:
                logging.error(f"YouTube API quota exceeded or key invalid: {response.status_code}")
                return None
            else:
                logging.error(f"YouTube API call failed: {response.status_code}")
                return None
                
    except httpx.TimeoutException:
        logging.error(f"YouTube API timeout for endpoint: {endpoint}")
    except Exception as e:
        logging.error(f"YouTube API error: {str(e)}")
    
    return None


@router.get("/sports-highlights")
async def get_sports_highlights(
    sport: str = Query(..., description="Sport type: premier_league, cricket, uefa, formula1, tennis, nba"),
    max_results: int = Query(5, ge=1, le=10, description="Number of highlights to fetch")
):
    """
    Get sports highlights from official YouTube channels
    Results are cached for 48 hours to minimize API quota usage
    """
    try:
        # Check if sport is in allowlist
        if sport not in OFFICIAL_SPORTS_CHANNELS:
            raise HTTPException(status_code=400, detail=f"Sport '{sport}' not supported")
        
        sport_config = OFFICIAL_SPORTS_CHANNELS[sport]
        
        # Check cache first
        cache_key = f"{sport}_{max_results}"
        if cache_key in _highlights_cache:
            cached_data, cached_time = _highlights_cache[cache_key]
            if datetime.now() < cached_time:
                logging.info(f"Using cached YouTube highlights for {sport}")
                return {
                    "status": "success",
                    "sport": sport_config['name'],
                    "highlights": cached_data,
                    "cached": True,
                    "cache_expires_in_hours": int((cached_time - datetime.now()).total_seconds() / 3600)
                }
        
        # Fetch from YouTube API
        highlights = []
        
        # Search videos from official channels
        for channel_id in sport_config['channel_ids']:
            params = {
                'part': 'snippet',
                'channelId': channel_id,
                'type': 'video',
                'order': 'date',
                'maxResults': max_results,
                'videoDefinition': 'high'
            }
            
            data = await make_youtube_api_call('search', params)
            
            if data and 'items' in data:
                for item in data['items']:
                    video_id = item['id'].get('videoId')
                    snippet = item['snippet']
                    
                    highlight = {
                        'video_id': video_id,
                        'title': snippet['title'],
                        'description': snippet['description'][:200],  # Truncate for performance
                        'thumbnail': snippet['thumbnails']['high']['url'],  # 480x360
                        'thumbnail_hd': snippet['thumbnails'].get('maxres', {}).get('url') or snippet['thumbnails']['high']['url'],  # 1280x720
                        'channel_title': snippet['channelTitle'],
                        'published_at': snippet['publishedAt'],
                        'video_url': f"https://www.youtube.com/watch?v={video_id}"
                    }
                    highlights.append(highlight)
                
                if len(highlights) >= max_results:
                    break
        
        # If no results, try search with keywords (fallback)
        if not highlights:
            search_term = sport_config['search_terms'][0]
            params = {
                'part': 'snippet',
                'q': search_term,
                'type': 'video',
                'order': 'date',
                'maxResults': max_results,
                'videoDefinition': 'high',
                'relevanceLanguage': 'en'
            }
            
            data = await make_youtube_api_call('search', params)
            
            if data and 'items' in data:
                for item in data['items']:
                    video_id = item['id'].get('videoId')
                    snippet = item['snippet']
                    
                    highlight = {
                        'video_id': video_id,
                        'title': snippet['title'],
                        'description': snippet['description'][:200],
                        'thumbnail': snippet['thumbnails']['high']['url'],
                        'thumbnail_hd': snippet['thumbnails'].get('maxres', {}).get('url') or snippet['thumbnails']['high']['url'],
                        'channel_title': snippet['channelTitle'],
                        'published_at': snippet['publishedAt'],
                        'video_url': f"https://www.youtube.com/watch?v={video_id}"
                    }
                    highlights.append(highlight)
        
        # Limit to max_results
        highlights = highlights[:max_results]
        
        # Cache the results
        cache_expiry = datetime.now() + timedelta(seconds=_cache_duration)
        _highlights_cache[cache_key] = (highlights, cache_expiry)
        
        return {
            "status": "success",
            "sport": sport_config['name'],
            "highlights": highlights,
            "cached": False,
            "cache_expires_in_hours": 48
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching sports highlights: {str(e)}")
        
        # Graceful fallback - return empty with status
        return {
            "status": "error",
            "sport": sport if sport in OFFICIAL_SPORTS_CHANNELS else "unknown",
            "highlights": [],
            "error": "Unable to fetch highlights at this time",
            "fallback": True
        }


@router.get("/supported-sports")
async def get_supported_sports():
    """Get list of supported sports for highlights"""
    sports_list = []
    for sport_id, config in OFFICIAL_SPORTS_CHANNELS.items():
        sports_list.append({
            "id": sport_id,
            "name": config['name'],
            "official_channels": len(config['channel_ids'])
        })
    
    return {
        "status": "success",
        "sports": sports_list
    }


@router.get("/health")
async def youtube_health_check():
    """Health check endpoint to verify YouTube API connectivity"""
    try:
        if not YOUTUBE_API_KEY:
            return {
                "status": "unhealthy",
                "api": "YouTube Data API v3",
                "connected": False,
                "error": "API key not configured"
            }
        
        # Try a minimal API call to verify key
        params = {
            'part': 'snippet',
            'channelId': 'UCG5qGWdu8nIRZqJ_GgDwQ-w',  # Premier League
            'maxResults': 1
        }
        
        data = await make_youtube_api_call('search', params)
        
        if data:
            return {
                "status": "healthy",
                "api": "YouTube Data API v3",
                "connected": True,
                "note": "Cached for 48 hours to minimize quota usage"
            }
        else:
            return {
                "status": "degraded",
                "api": "YouTube Data API v3",
                "connected": False,
                "note": "API key may be invalid or quota exceeded"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "api": "YouTube Data API v3",
            "connected": False,
            "error": str(e)
        }
