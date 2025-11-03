"""
Cricket API Router - CrickData.org Integration
Provides cricket match data, scores, series, and fixtures
"""

from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/cricket", tags=["cricket"])

# CrickData.org API configuration
CRICKDATA_API_KEY = os.environ.get("CRICKDATA_ORG_KEY")
CRICKDATA_BASE_URL = "https://api.cricapi.com/v1"

# Cache for API responses (simple in-memory cache)
_cache = {}
_cache_duration = 60  # 60 seconds for live data

async def make_cricket_api_call(endpoint: str, params: Dict = None) -> Optional[Dict]:
    """Make API call to CrickData.org with caching"""
    if not CRICKDATA_API_KEY:
        logging.error("CRICKDATA_ORG_KEY not configured")
        return None
    
    try:
        # Add API key to params
        if params is None:
            params = {}
        params["apikey"] = CRICKDATA_API_KEY
        
        url = f"{CRICKDATA_BASE_URL}/{endpoint}"
        
        # Check cache
        cache_key = f"{endpoint}_{str(params)}"
        if cache_key in _cache:
            cached_data, cached_time = _cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < _cache_duration:
                return cached_data
        
        # Make API call
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check API response status
                if data.get("status") == "success":
                    # Cache the response
                    _cache[cache_key] = (data, datetime.now())
                    return data
                else:
                    logging.warning(f"CrickData API returned non-success status: {data.get('status')}")
                    return data
            else:
                logging.error(f"CrickData API call failed: {response.status_code}")
                return None
                
    except httpx.TimeoutException:
        logging.error(f"CrickData API timeout for endpoint: {endpoint}")
    except Exception as e:
        logging.error(f"CrickData API error: {str(e)}")
    
    return None


@router.get("/current-matches")
async def get_current_matches(offset: int = Query(0, ge=0)):
    """
    Get current/live cricket matches
    Returns matches with toss winner but no match winner (ongoing matches)
    """
    try:
        data = await make_cricket_api_call("currentMatches", {"offset": offset})
        
        if not data:
            raise HTTPException(status_code=503, detail="Cricket API unavailable")
        
        return {
            "status": "success",
            "data": data.get("data", []),
            "info": data.get("info", {}),
            "total": data.get("info", {}).get("totalRows", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching current matches: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/series")
async def get_series_list(offset: int = Query(0, ge=0), search: Optional[str] = None):
    """
    Get list of cricket series
    If search is provided, searches for series by name (e.g., 'IPL', 'World Cup')
    """
    try:
        params = {"offset": offset}
        
        if search:
            # Use series search endpoint
            params["search"] = search
            data = await make_cricket_api_call("series", params)
        else:
            # Get all series
            data = await make_cricket_api_call("series", params)
        
        if not data:
            raise HTTPException(status_code=503, detail="Cricket API unavailable")
        
        return {
            "status": "success",
            "data": data.get("data", []),
            "info": data.get("info", {}),
            "total": data.get("info", {}).get("totalRows", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching series: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/series/{series_id}")
async def get_series_details(series_id: str):
    """
    Get detailed information about a specific series including all matches
    Warning: This can return a large response for series with many matches
    """
    try:
        data = await make_cricket_api_call("series_info", {"id": series_id})
        
        if not data:
            raise HTTPException(status_code=503, detail="Cricket API unavailable")
        
        if data.get("status") != "success":
            raise HTTPException(status_code=404, detail="Series not found")
        
        return {
            "status": "success",
            "data": data.get("data", {}),
            "info": data.get("info", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching series details: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/match/{match_id}")
async def get_match_details(match_id: str):
    """
    Get detailed information about a specific match including scores
    """
    try:
        data = await make_cricket_api_call("match_info", {"id": match_id})
        
        if not data:
            raise HTTPException(status_code=503, detail="Cricket API unavailable")
        
        if data.get("status") != "success":
            raise HTTPException(status_code=404, detail="Match not found")
        
        return {
            "status": "success",
            "data": data.get("data", {}),
            "info": data.get("info", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching match details: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/fixtures")
async def get_upcoming_fixtures(offset: int = Query(0, ge=0), limit: int = Query(25, le=50)):
    """
    Get upcoming cricket fixtures (matches without toss winner)
    This fetches from all matches and filters for upcoming ones
    """
    try:
        data = await make_cricket_api_call("matches", {"offset": offset})
        
        if not data:
            raise HTTPException(status_code=503, detail="Cricket API unavailable")
        
        # Filter for matches without tossWinner (upcoming matches)
        all_matches = data.get("data", [])
        fixtures = [
            match for match in all_matches 
            if not match.get("tossWinner") and match.get("dateTimeGMT")
        ]
        
        # Sort by date (upcoming first)
        fixtures.sort(key=lambda x: x.get("dateTimeGMT", ""))
        
        return {
            "status": "success",
            "data": fixtures[:limit],
            "total": len(fixtures),
            "info": data.get("info", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching fixtures: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health")
async def cricket_health_check():
    """Health check endpoint to verify Cricket API connectivity"""
    try:
        # Try to fetch series list as a health check
        data = await make_cricket_api_call("series", {"offset": 0})
        
        if data and data.get("status") == "success":
            return {
                "status": "healthy",
                "api": "CrickData.org",
                "connected": True,
                "credits": data.get("info", {}).get("credits"),
                "hits_today": data.get("info", {}).get("hitsToday"),
                "hits_limit": data.get("info", {}).get("hitsLimit")
            }
        else:
            return {
                "status": "degraded",
                "api": "CrickData.org",
                "connected": False
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "api": "CrickData.org",
            "connected": False,
            "error": str(e)
        }
