"""
Football API Router - API-FOOTBALL Integration
Provides football match data, fixtures, live scores, leagues, and standings
"""

from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, date

router = APIRouter(prefix="/football", tags=["football"])

# API-FOOTBALL configuration
API_FOOTBALL_KEY = os.environ.get("API_FOOTBALL_KEY")
API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"

# Cache for API responses
_cache = {}
_cache_duration = {
    "fixtures": 300,  # 5 minutes for fixtures
    "live": 30,       # 30 seconds for live scores
    "standings": 3600,  # 1 hour for standings
    "leagues": 86400   # 24 hours for leagues list
}

# Popular leagues to focus on
POPULAR_LEAGUES = {
    "premier_league": 39,
    "la_liga": 140,
    "champions_league": 2,
    "indian_super_league": 169,
    "seria_a": 135,
    "bundesliga": 78,
    "ligue_1": 61
}

async def make_football_api_call(endpoint: str, params: Dict = None, cache_type: str = "fixtures") -> Optional[Dict]:
    """Make API call to API-FOOTBALL with caching"""
    if not API_FOOTBALL_KEY:
        logging.error("API_FOOTBALL_KEY not configured")
        return None
    
    try:
        url = f"{API_FOOTBALL_BASE_URL}/{endpoint}"
        headers = {
            "x-apisports-key": API_FOOTBALL_KEY
        }
        
        # Check cache
        cache_key = f"{endpoint}_{str(params)}"
        if cache_key in _cache:
            cached_data, cached_time = _cache[cache_key]
            duration = _cache_duration.get(cache_type, 300)
            if (datetime.now() - cached_time).total_seconds() < duration:
                logging.info(f"Using cached football data for {endpoint}")
                return cached_data
        
        # Make API call
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache the response
                _cache[cache_key] = (data, datetime.now())
                logging.info(f"Football API call successful: {endpoint}")
                return data
            elif response.status_code == 429:
                logging.error("Football API rate limit exceeded")
                return None
            else:
                logging.error(f"Football API call failed: {response.status_code}")
                return None
                
    except httpx.TimeoutException:
        logging.error(f"Football API timeout for endpoint: {endpoint}")
    except Exception as e:
        logging.error(f"Football API error: {str(e)}")
    
    return None


@router.get("/live")
async def get_live_matches():
    """
    Get all live football matches across all leagues
    """
    try:
        data = await make_football_api_call("fixtures", {"live": "all"}, cache_type="live")
        
        if not data:
            raise HTTPException(status_code=503, detail="Football API unavailable")
        
        fixtures = data.get("response", [])
        
        # Format response
        live_matches = []
        for fixture in fixtures:
            match = {
                "fixture_id": fixture["fixture"]["id"],
                "league": fixture["league"]["name"],
                "league_id": fixture["league"]["id"],
                "country": fixture["league"]["country"],
                "home_team": fixture["teams"]["home"]["name"],
                "home_logo": fixture["teams"]["home"]["logo"],
                "away_team": fixture["teams"]["away"]["name"],
                "away_logo": fixture["teams"]["away"]["logo"],
                "home_score": fixture["goals"]["home"],
                "away_score": fixture["goals"]["away"],
                "status": fixture["fixture"]["status"]["long"],
                "elapsed": fixture["fixture"]["status"]["elapsed"],
                "venue": fixture["fixture"]["venue"]["name"]
            }
            live_matches.append(match)
        
        return {
            "status": "success",
            "data": live_matches,
            "total": len(live_matches)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching live matches: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/fixtures")
async def get_fixtures(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    league: Optional[int] = Query(None, description="League ID"),
    season: Optional[int] = Query(None, description="Season year (e.g., 2024)")
):
    """
    Get football fixtures
    - If no date provided, returns today's fixtures
    - Can filter by league and season
    """
    try:
        params = {}
        
        if date:
            params["date"] = date
        else:
            params["date"] = datetime.now().strftime("%Y-%m-%d")
        
        if league:
            params["league"] = league
        
        if season:
            params["season"] = season
        
        data = await make_football_api_call("fixtures", params, cache_type="fixtures")
        
        if not data:
            raise HTTPException(status_code=503, detail="Football API unavailable")
        
        fixtures = data.get("response", [])
        
        # Format response
        formatted_fixtures = []
        for fixture in fixtures:
            match = {
                "fixture_id": fixture["fixture"]["id"],
                "league": fixture["league"]["name"],
                "league_id": fixture["league"]["id"],
                "country": fixture["league"]["country"],
                "home_team": fixture["teams"]["home"]["name"],
                "home_logo": fixture["teams"]["home"]["logo"],
                "away_team": fixture["teams"]["away"]["name"],
                "away_logo": fixture["teams"]["away"]["logo"],
                "date": fixture["fixture"]["date"],
                "time": fixture["fixture"]["date"].split("T")[1][:5] if "T" in fixture["fixture"]["date"] else None,
                "venue": fixture["fixture"]["venue"]["name"],
                "status": fixture["fixture"]["status"]["long"],
                "home_score": fixture["goals"]["home"],
                "away_score": fixture["goals"]["away"]
            }
            formatted_fixtures.append(match)
        
        return {
            "status": "success",
            "data": formatted_fixtures,
            "total": len(formatted_fixtures),
            "date": params.get("date")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching fixtures: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/leagues")
async def get_leagues(country: Optional[str] = Query(None, description="Country name")):
    """
    Get available football leagues
    Can filter by country (e.g., 'England', 'Spain', 'India')
    """
    try:
        params = {}
        if country:
            params["country"] = country
        
        data = await make_football_api_call("leagues", params, cache_type="leagues")
        
        if not data:
            raise HTTPException(status_code=503, detail="Football API unavailable")
        
        leagues = data.get("response", [])
        
        # Format response
        formatted_leagues = []
        for league_data in leagues:
            league = {
                "league_id": league_data["league"]["id"],
                "name": league_data["league"]["name"],
                "type": league_data["league"]["type"],
                "logo": league_data["league"]["logo"],
                "country": league_data["country"]["name"],
                "country_flag": league_data["country"]["flag"]
            }
            formatted_leagues.append(league)
        
        return {
            "status": "success",
            "data": formatted_leagues,
            "total": len(formatted_leagues)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching leagues: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/standings/{league_id}")
async def get_league_standings(
    league_id: int,
    season: Optional[int] = Query(None, description="Season year (e.g., 2024, defaults to current)")
):
    """
    Get league standings/table for a specific league
    Popular league IDs:
    - Premier League: 39
    - La Liga: 140
    - Champions League: 2
    - Indian Super League: 169
    """
    try:
        params = {"league": league_id}
        
        if season:
            params["season"] = season
        else:
            # Default to current year
            params["season"] = datetime.now().year
        
        data = await make_football_api_call("standings", params, cache_type="standings")
        
        if not data:
            raise HTTPException(status_code=503, detail="Football API unavailable")
        
        response = data.get("response", [])
        
        if not response:
            raise HTTPException(status_code=404, detail="No standings found for this league/season")
        
        standings_data = response[0].get("league", {}).get("standings", [[]])[0]
        
        # Format response
        standings = []
        for team_data in standings_data:
            team = {
                "rank": team_data["rank"],
                "team": team_data["team"]["name"],
                "team_logo": team_data["team"]["logo"],
                "points": team_data["points"],
                "played": team_data["all"]["played"],
                "won": team_data["all"]["win"],
                "draw": team_data["all"]["draw"],
                "lost": team_data["all"]["lose"],
                "goals_for": team_data["all"]["goals"]["for"],
                "goals_against": team_data["all"]["goals"]["against"],
                "goal_difference": team_data["goalsDiff"],
                "form": team_data["form"]
            }
            standings.append(team)
        
        return {
            "status": "success",
            "data": standings,
            "league_id": league_id,
            "season": params["season"],
            "total": len(standings)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching standings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/popular-leagues")
async def get_popular_leagues():
    """
    Get a curated list of popular football leagues
    """
    return {
        "status": "success",
        "data": [
            {"name": "Premier League", "id": 39, "country": "England"},
            {"name": "La Liga", "id": 140, "country": "Spain"},
            {"name": "Champions League", "id": 2, "country": "Europe"},
            {"name": "Indian Super League", "id": 169, "country": "India"},
            {"name": "Serie A", "id": 135, "country": "Italy"},
            {"name": "Bundesliga", "id": 78, "country": "Germany"},
            {"name": "Ligue 1", "id": 61, "country": "France"}
        ]
    }


@router.get("/health")
async def football_health_check():
    """Health check endpoint to verify Football API connectivity"""
    try:
        # Try to fetch leagues as a health check
        data = await make_football_api_call("leagues", {"country": "England"}, cache_type="leagues")
        
        if data and data.get("response"):
            return {
                "status": "healthy",
                "api": "API-FOOTBALL",
                "connected": True,
                "results": len(data.get("response", []))
            }
        else:
            return {
                "status": "degraded",
                "api": "API-FOOTBALL",
                "connected": False
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "api": "API-FOOTBALL",
            "connected": False,
            "error": str(e)
        }
