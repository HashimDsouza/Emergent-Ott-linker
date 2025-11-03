"""
Multi-Sport API Router - TheSportsDB Integration
Provides F1, Tennis, Hockey and other sports data (calendars, schedules, basic info)
WARNING: This uses free tier TheSportsDB - use ONLY for non-critical supplementary data
"""

from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime

router = APIRouter(prefix="/sports", tags=["sports"])

# TheSportsDB configuration
THESPORTSDB_KEY = os.environ.get("THESPORTSDB_KEY", "3")  # Free tier key
THESPORTSDB_BASE_URL = f"https://www.thesportsdb.com/api/v1/json/{THESPORTSDB_KEY}"

# Sport and League IDs
SPORT_LEAGUES = {
    "f1": 4370,  # Formula 1
    "tennis_atp": 4420,  # ATP Tour
    "tennis_wta": 4510,  # WTA Tour
    "hockey_nhl": 4380,  # NHL
    "hockey_iihf": 4449   # IIHF World Championship
}

# Cache for API responses (24 hours for static data)
_cache = {}
_cache_duration = 86400  # 24 hours

async def make_sportsdb_api_call(endpoint: str, params: Dict = None) -> Optional[Dict]:
    """Make API call to TheSportsDB with caching"""
    try:
        url = f"{THESPORTSDB_BASE_URL}/{endpoint}"
        
        # Check cache
        cache_key = f"{endpoint}_{str(params)}"
        if cache_key in _cache:
            cached_data, cached_time = _cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < _cache_duration:
                logging.info(f"Using cached TheSportsDB data for {endpoint}")
                return cached_data
        
        # Make API call
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache the response
                _cache[cache_key] = (data, datetime.now())
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


@router.get("/f1/calendar")
async def get_f1_calendar(season: Optional[int] = Query(None, description="Season year (e.g., 2024)")):
    """
    Get Formula 1 race calendar for a season
    If no season provided, returns current season
    """
    try:
        if not season:
            season = datetime.now().year
        
        data = await make_sportsdb_api_call(f"eventsseason.php", {
            "id": SPORT_LEAGUES["f1"],
            "s": season
        })
        
        if not data:
            raise HTTPException(status_code=503, detail="TheSportsDB API unavailable")
        
        events = data.get("events", [])
        
        if not events:
            return {
                "status": "success",
                "data": [],
                "season": season,
                "message": "No F1 events found for this season"
            }
        
        # Format response
        calendar = []
        for event in events:
            race = {
                "round": event.get("intRound"),
                "race_name": event.get("strEvent"),
                "circuit": event.get("strVenue"),
                "city": event.get("strCity"),
                "country": event.get("strCountry"),
                "date": event.get("dateEvent"),
                "time": event.get("strTime"),
                "poster": event.get("strPoster"),
                "status": event.get("strStatus")
            }
            calendar.append(race)
        
        # Sort by date
        calendar.sort(key=lambda x: x.get("date", ""))
        
        return {
            "status": "success",
            "data": calendar,
            "season": season,
            "total": len(calendar)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching F1 calendar: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/f1/next-race")
async def get_next_f1_race():
    """
    Get the next upcoming Formula 1 race
    """
    try:
        data = await make_sportsdb_api_call(f"eventsnextleague.php", {
            "id": SPORT_LEAGUES["f1"]
        })
        
        if not data:
            raise HTTPException(status_code=503, detail="TheSportsDB API unavailable")
        
        events = data.get("events", [])
        
        if not events:
            return {
                "status": "success",
                "data": None,
                "message": "No upcoming F1 races found"
            }
        
        next_race = events[0]
        
        return {
            "status": "success",
            "data": {
                "round": next_race.get("intRound"),
                "race_name": next_race.get("strEvent"),
                "circuit": next_race.get("strVenue"),
                "city": next_race.get("strCity"),
                "country": next_race.get("strCountry"),
                "date": next_race.get("dateEvent"),
                "time": next_race.get("strTime"),
                "poster": next_race.get("strPoster")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching next F1 race: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tennis/tournaments")
async def get_tennis_tournaments(season: Optional[int] = Query(None, description="Season year")):
    """
    Get tennis tournaments (ATP & WTA combined)
    Note: This is basic information only - not live scores
    """
    try:
        if not season:
            season = datetime.now().year
        
        # Get ATP events
        atp_data = await make_sportsdb_api_call(f"eventsseason.php", {
            "id": SPORT_LEAGUES["tennis_atp"],
            "s": season
        })
        
        # Get WTA events
        wta_data = await make_sportsdb_api_call(f"eventsseason.php", {
            "id": SPORT_LEAGUES["tennis_wta"],
            "s": season
        })
        
        tournaments = []
        
        # Process ATP tournaments
        if atp_data and atp_data.get("events"):
            for event in atp_data["events"]:
                tournament = {
                    "tournament": event.get("strEvent"),
                    "tour": "ATP",
                    "location": f"{event.get('strCity')}, {event.get('strCountry')}",
                    "venue": event.get("strVenue"),
                    "start_date": event.get("dateEvent"),
                    "poster": event.get("strPoster")
                }
                tournaments.append(tournament)
        
        # Process WTA tournaments
        if wta_data and wta_data.get("events"):
            for event in wta_data["events"]:
                tournament = {
                    "tournament": event.get("strEvent"),
                    "tour": "WTA",
                    "location": f"{event.get('strCity')}, {event.get('strCountry')}",
                    "venue": event.get("strVenue"),
                    "start_date": event.get("dateEvent"),
                    "poster": event.get("strPoster")
                }
                tournaments.append(tournament)
        
        # Sort by date
        tournaments.sort(key=lambda x: x.get("start_date", ""))
        
        return {
            "status": "success",
            "data": tournaments,
            "season": season,
            "total": len(tournaments)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching tennis tournaments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/schedule")
async def get_multi_sport_schedule(season: Optional[int] = Query(None, description="Season year")):
    """
    Get combined schedule for F1, Tennis, and Hockey
    Returns a comprehensive multi-sport calendar
    """
    try:
        if not season:
            season = datetime.now().year
        
        # Fetch all sports data concurrently
        f1_data = await make_sportsdb_api_call(f"eventsseason.php", {
            "id": SPORT_LEAGUES["f1"],
            "s": season
        })
        
        atp_data = await make_sportsdb_api_call(f"eventsseason.php", {
            "id": SPORT_LEAGUES["tennis_atp"],
            "s": season
        })
        
        schedule = {
            "f1": [],
            "tennis": [],
            "season": season
        }
        
        # Process F1
        if f1_data and f1_data.get("events"):
            for event in f1_data["events"][:10]:  # Limit to 10 events
                schedule["f1"].append({
                    "race_name": event.get("strEvent"),
                    "circuit": event.get("strVenue"),
                    "date": event.get("dateEvent")
                })
        
        # Process Tennis
        if atp_data and atp_data.get("events"):
            for event in atp_data["events"][:10]:  # Limit to 10 events
                schedule["tennis"].append({
                    "tournament": event.get("strEvent"),
                    "location": event.get("strCity"),
                    "date": event.get("dateEvent")
                })
        
        return {
            "status": "success",
            "data": schedule,
            "season": season
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching multi-sport schedule: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health")
async def sports_health_check():
    """Health check endpoint to verify TheSportsDB API connectivity"""
    try:
        # Try to fetch F1 next race as a health check
        data = await make_sportsdb_api_call(f"eventsnextleague.php", {
            "id": SPORT_LEAGUES["f1"]
        })
        
        if data and data.get("events"):
            return {
                "status": "healthy",
                "api": "TheSportsDB",
                "connected": True,
                "note": "Free tier - use for supplementary data only"
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
