"""
TheSportsDB Router - Team Logos, League Badges, and Sports Images
Provides team logos and league badges for Game On section
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

router = APIRouter(prefix="/thesportsdb", tags=["thesportsdb"])

# TheSportsDB configuration
THESPORTSDB_KEY = os.environ.get("THESPORTSDB_KEY", "3")  # Free tier key
THESPORTSDB_BASE_URL = f"https://www.thesportsdb.com/api/v1/json/{THESPORTSDB_KEY}"

# Cache for API responses (24 hours for static data like logos)
_cache = {}
_cache_duration = 86400  # 24 hours

# Popular team and league mappings
TEAM_MAPPINGS = {
    # Cricket - IPL Teams
    'MI': {'search': 'Mumbai Indians', 'league': 'IPL'},
    'CSK': {'search': 'Chennai Super Kings', 'league': 'IPL'},
    'RCB': {'search': 'Royal Challengers Bangalore', 'league': 'IPL'},
    'KKR': {'search': 'Kolkata Knight Riders', 'league': 'IPL'},
    'DC': {'search': 'Delhi Capitals', 'league': 'IPL'},
    'RR': {'search': 'Rajasthan Royals', 'league': 'IPL'},
    'PBKS': {'search': 'Punjab Kings', 'league': 'IPL'},
    'SRH': {'search': 'Sunrisers Hyderabad', 'league': 'IPL'},
    
    # Cricket - International Teams
    'India': {'search': 'India', 'league': 'International'},
    'Australia': {'search': 'Australia', 'league': 'International'},
    'England': {'search': 'England', 'league': 'International'},
    'Pakistan': {'search': 'Pakistan', 'league': 'International'},
    
    # Football - Premier League
    'Man City': {'search': 'Manchester City', 'league': 'Premier League'},
    'Arsenal': {'search': 'Arsenal', 'league': 'Premier League'},
    'Liverpool': {'search': 'Liverpool', 'league': 'Premier League'},
    'Chelsea': {'search': 'Chelsea', 'league': 'Premier League'},
    'Man Utd': {'search': 'Manchester United', 'league': 'Premier League'},
    
    # Football - La Liga
    'Real Madrid': {'search': 'Real Madrid', 'league': 'La Liga'},
    'Barcelona': {'search': 'Barcelona', 'league': 'La Liga'},
    
    # Football - Bundesliga
    'Bayern': {'search': 'Bayern Munich', 'league': 'Bundesliga'},
    'Dortmund': {'search': 'Borussia Dortmund', 'league': 'Bundesliga'},
    
    # NBA Teams
    'Lakers': {'search': 'Los Angeles Lakers', 'league': 'NBA'},
    'Warriors': {'search': 'Golden State Warriors', 'league': 'NBA'},
    'Celtics': {'search': 'Boston Celtics', 'league': 'NBA'},
    'Heat': {'search': 'Miami Heat', 'league': 'NBA'},
}

async def make_sportsdb_api_call(endpoint: str, params: Dict = None) -> Optional[Dict]:
    """Make API call to TheSportsDB with caching"""
    try:
        url = f"{THESPORTSDB_BASE_URL}/{endpoint}"
        
        # Check cache
        cache_key = f"{endpoint}_{str(params)}"
        if cache_key in _cache:
            cached_data, cached_time = _cache[cache_key]
            if datetime.now() < cached_time:
                logging.info(f"Using cached TheSportsDB data for {endpoint}")
                return cached_data
        
        # Make API call
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache the response with expiry time
                cache_expiry = datetime.now() + timedelta(seconds=_cache_duration)
                _cache[cache_key] = (data, cache_expiry)
                logging.info(f"TheSportsDB API call successful: {endpoint}")
                return data
            else:
                logging.error(f"TheSportsDB API call failed: {response.status_code}")
                return None
                
    except httpx.TimeoutException:
        logging.error(f"TheSportsDB API timeout for endpoint: {endpoint}")
    except Exception as e:
        logging.error(f"TheSportsDB API error: {str(e)}")
    
    return None


@router.get("/team-logo")
async def get_team_logo(team_name: str = Query(..., description="Team name or abbreviation")):
    """
    Get team logo URL by team name
    Returns badge and logo images from TheSportsDB
    """
    try:
        # Check if team is in our mappings
        team_search = team_name
        if team_name in TEAM_MAPPINGS:
            team_search = TEAM_MAPPINGS[team_name]['search']
        
        # Search for team
        data = await make_sportsdb_api_call("searchteams.php", {"t": team_search})
        
        if not data or not data.get("teams"):
            return {
                "status": "not_found",
                "team_name": team_name,
                "badge": None,
                "logo": None
            }
        
        team = data["teams"][0]
        
        # Convert www.thesportsdb.com URLs to r2.thesportsdb.com (CDN with CORS support)
        def convert_to_cdn_url(url):
            if url and "www.thesportsdb.com" in url:
                return url.replace("www.thesportsdb.com", "r2.thesportsdb.com")
            return url
        
        return {
            "status": "success",
            "team_name": team.get("strTeam"),
            "badge": convert_to_cdn_url(team.get("strBadge")),  # Square badge
            "logo": convert_to_cdn_url(team.get("strLogo")),    # Circular logo
            "banner": convert_to_cdn_url(team.get("strBanner")), # Wide banner
            "jersey": convert_to_cdn_url(team.get("strEquipment")), # Team jersey/equipment
            "stadium": team.get("strStadium"),
            "league": team.get("strLeague")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching team logo: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/league-badge")
async def get_league_badge(league_name: str = Query(..., description="League name")):
    """
    Get league badge URL by league name
    """
    try:
        # Search for league
        data = await make_sportsdb_api_call("search_all_leagues.php", {"c": "All"})
        
        if not data or not data.get("countries"):
            return {
                "status": "not_found",
                "league_name": league_name,
                "badge": None
            }
        
        # Find matching league
        league_lower = league_name.lower()
        for league in data["countries"]:
            if league_lower in league.get("strLeague", "").lower():
                return {
                    "status": "success",
                    "league_name": league.get("strLeague"),
                    "badge": league.get("strBadge"),
                    "logo": league.get("strLogo")
                }
        
        return {
            "status": "not_found",
            "league_name": league_name,
            "badge": None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching league badge: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/bulk-team-logos")
async def get_bulk_team_logos(team_names: str = Query(..., description="Comma-separated team names")):
    """
    Get multiple team logos in one request
    Efficient for loading multiple teams at once
    """
    try:
        teams = [name.strip() for name in team_names.split(",")]
        results = {}
        
        for team_name in teams:
            # Check if team is in our mappings
            team_search = team_name
            if team_name in TEAM_MAPPINGS:
                team_search = TEAM_MAPPINGS[team_name]['search']
            
            # Search for team
            data = await make_sportsdb_api_call("searchteams.php", {"t": team_search})
            
            if data and data.get("teams"):
                team = data["teams"][0]
                
                # Convert www.thesportsdb.com URLs to r2.thesportsdb.com (CDN with CORS support)
                def convert_to_cdn_url(url):
                    if url and "www.thesportsdb.com" in url:
                        return url.replace("www.thesportsdb.com", "r2.thesportsdb.com")
                    return url
                
                results[team_name] = {
                    "badge": convert_to_cdn_url(team.get("strBadge")),
                    "logo": convert_to_cdn_url(team.get("strLogo")),
                    "banner": convert_to_cdn_url(team.get("strBanner"))
                }
            else:
                results[team_name] = {
                    "badge": None,
                    "logo": None,
                    "banner": None
                }
        
        return {
            "status": "success",
            "teams": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching bulk team logos: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/sports-images")
async def get_sports_images():
    """
    Get pre-cached sports images for commonly used teams via proxy
    This endpoint is optimized for Game On landing page and bypasses CORS issues
    """
    try:
        from fastapi import Request
        # Get the base URL for proxying
        backend_url = os.environ.get('BACKEND_URL', 'https://media-unifier.preview.emergentagent.com')
        
        # Pre-defined image URLs for commonly used teams
        # These will be proxied through our backend to bypass CORS
        sports_images_raw = {
            # Cricket - IPL
            'MI': 'https://r2.thesportsdb.com/images/media/team/badge/xqwpup1420382849.png',
            'CSK': 'https://r2.thesportsdb.com/images/media/team/badge/ytwwqt1467982667.png',
            'RCB': 'https://r2.thesportsdb.com/images/media/team/badge/v2qnuv1467982635.png',
            'KKR': 'https://r2.thesportsdb.com/images/media/team/badge/trqxyx1467982616.png',
            'DC': 'https://r2.thesportsdb.com/images/media/team/badge/xvsvuv1467982703.png',
            'RR': 'https://r2.thesportsdb.com/images/media/team/badge/wtqsvx1467982758.png',
            'PBKS': 'https://r2.thesportsdb.com/images/media/team/badge/urwxuv1467982777.png',
            'SRH': 'https://r2.thesportsdb.com/images/media/team/badge/vtppsy1467982794.png',
            
            # Football - Premier League
            'Man City': 'https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
            'Arsenal': 'https://r2.thesportsdb.com/images/media/team/badge/vrtrtp1448813175.png',
            'Liverpool': 'https://r2.thesportsdb.com/images/media/team/badge/uvxvty1448813447.png',
            'Chelsea': 'https://r2.thesportsdb.com/images/media/team/badge/yvwvtu1448813033.png',
            
            # Football - La Liga
            'Real Madrid': 'https://r2.thesportsdb.com/images/media/team/badge/yxwvrw1448813371.png',
            'Barcelona': 'https://r2.thesportsdb.com/images/media/team/badge/txqrxy1448813303.png',
            
            # NBA
            'Lakers': 'https://r2.thesportsdb.com/images/media/team/badge/a77e1i1547214763.png',
            'Warriors': 'https://r2.thesportsdb.com/images/media/team/badge/o7y1hd1648809742.png',
            'Celtics': 'https://r2.thesportsdb.com/images/media/team/badge/dh1d7u1650037530.png',
            'Heat': 'https://r2.thesportsdb.com/images/media/team/badge/bd98dm1648809803.png',
        }
        
        # Convert to proxied URLs
        from urllib.parse import quote
        sports_images = {}
        for team, url in sports_images_raw.items():
            sports_images[team] = f"{backend_url}/api/thesportsdb/proxy-image?image_url={quote(url)}"
        
        return {
            "status": "success",
            "images": sports_images,
            "note": "Pre-cached images proxied through backend to bypass CORS"
        }
        
    except Exception as e:
        logging.error(f"Error fetching sports images: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/proxy-image")
async def proxy_team_image(image_url: str = Query(..., description="TheSportsDB image URL to proxy")):
    """
    Proxy TheSportsDB images to bypass CORS issues
    This endpoint fetches the image from TheSportsDB and returns it with proper headers
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(image_url)
            
            if response.status_code == 200:
                from fastapi.responses import Response
                return Response(
                    content=response.content,
                    media_type=response.headers.get("content-type", "image/png"),
                    headers={
                        "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                        "Access-Control-Allow-Origin": "*"
                    }
                )
            else:
                raise HTTPException(status_code=404, detail="Image not found")
                
    except Exception as e:
        logging.error(f"Error proxying image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to proxy image")


@router.get("/health")
async def thesportsdb_health_check():
    """Health check endpoint to verify TheSportsDB API connectivity"""
    try:
        # Try to search for a popular team
        data = await make_sportsdb_api_call("searchteams.php", {"t": "Arsenal"})
        
        if data and data.get("teams"):
            return {
                "status": "healthy",
                "api": "TheSportsDB",
                "connected": True,
                "tier": "Free",
                "note": "Using free tier - cached for 24 hours"
            }
        else:
            return {
                "status": "degraded",
                "api": "TheSportsDB",
                "connected": False
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "api": "TheSportsDB",
            "connected": False,
            "error": str(e)
        }
