from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import httpx
import re
import io

# Import sports routers
from routers import cricket, football, sports, thesportsdb, youtube

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys for enrichment
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
OMDB_API_KEY = os.environ.get('OMDB_API_KEY')
WATCHMODE_API_KEY = os.environ.get('WATCHMODE_API_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============================================================================
# METADATA ENRICHMENT FUNCTIONS
# ============================================================================

async def search_tmdb(title: str, year: Optional[int] = None, content_type: str = "movie", region: str = "IN", description: str = "") -> Optional[Dict]:
    """Search TMDB for a title and return best match with regional filtering"""
    if not TMDB_API_KEY:
        logging.debug(f"TMDB API key not configured, skipping search for: {title}")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            endpoint = "tv" if content_type in ["series", "documentary"] else "movie"
            
            # Enhanced Indian content detection - check both title AND description
            indian_keywords = ['hindi', 'bollywood', 'tamil', 'telugu', 'malayalam', 'kannada', 'marathi', 
                             'india', 'indian', 'mumbai', 'delhi', 'hrithik', 'shah rukh', 'deepika', 
                             'ranveer', 'aamir', 'salman', 'akshay', 'ajay devgn', 'katrina']
            search_text = (title + " " + description).lower()
            is_indian_content = any(keyword in search_text for keyword in indian_keywords)
            
            # Try exact search first with region filter for Indian content
            params = {
                "api_key": TMDB_API_KEY,
                "query": title,
                "language": "en-US",
                "page": 1
            }
            if year:
                params["year" if endpoint == "movie" else "first_air_date_year"] = year
            
            if is_indian_content:
                params["region"] = region  # Filter by region for Indian content
            
            response = await client.get(
                f"https://api.themoviedb.org/3/search/{endpoint}",
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                if results:
                    # For Indian content, prefer results with Hindi/Indian language
                    if is_indian_content and len(results) > 1:
                        for result in results:
                            original_lang = result.get("original_language", "")
                            if original_lang in ["hi", "ta", "te", "ml", "kn", "mr"]:  # Indian languages
                                logging.info(f"✅ TMDB found (Indian): {title} -> {result.get('title') or result.get('name')} ({original_lang})")
                                return result
                    
                    # If year is provided and no Indian language match, prioritize by year
                    if year and len(results) > 1:
                        for result in results:
                            release_date = result.get("release_date") or result.get("first_air_date", "")
                            if release_date and release_date.startswith(str(year)):
                                logging.info(f"✅ TMDB found (year match): {title} ({year}) -> {result.get('title') or result.get('name')}")
                                return result
                    
                    # Default to first result
                    logging.info(f"✅ TMDB found: {title} -> {results[0].get('title') or results[0].get('name')}")
                    return results[0]
            elif response.status_code == 401:
                logging.error(f"❌ TMDB API key invalid or expired")
                return None
            
            # If no results and title has "Season X", try without it
            if "Season" in title or "season" in title:
                cleaned_title = re.sub(r'\s+Season\s+\d+', '', title, flags=re.IGNORECASE)
                params["query"] = cleaned_title
                
                response = await client.get(
                    f"https://api.themoviedb.org/3/search/{endpoint}",
                    params=params,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("results"):
                        logging.info(f"✅ TMDB found (cleaned title): {cleaned_title} -> {data['results'][0].get('title') or data['results'][0].get('name')}")
                        return data["results"][0]
            
            logging.warning(f"⚠️  TMDB no results for: {title}")
            
    except httpx.TimeoutException:
        logging.error(f"⏱️  TMDB timeout for: {title}")
    except Exception as e:
        logging.error(f"❌ TMDB search error for {title}: {str(e)}")
    return None

async def get_tmdb_season_details(tmdb_id: int, season_number: int) -> Optional[Dict]:
    """Get season-specific details from TMDB"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.themoviedb.org/3/tv/{tmdb_id}/season/{season_number}",
                params={
                    "api_key": TMDB_API_KEY,
                    "language": "en-US"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                season_data = response.json()
                logging.info(f"✅ TMDB Season {season_number} details fetched")
                return season_data
            else:
                logging.warning(f"⚠️  TMDB Season {season_number} not found (status: {response.status_code})")
                
    except Exception as e:
        logging.error(f"❌ TMDB season details error: {str(e)}")
    return None

async def get_tmdb_details(tmdb_id: int, content_type: str = "movie", season_number: Optional[int] = None) -> Optional[Dict]:
    """Get detailed info from TMDB including external IDs, watch providers, cast, crew, and videos"""
    try:
        async with httpx.AsyncClient() as client:
            endpoint = "tv" if content_type == "series" else "movie"
            
            # Get main details with appended responses (credits and videos)
            response = await client.get(
                f"https://api.themoviedb.org/3/{endpoint}/{tmdb_id}",
                params={
                    "api_key": TMDB_API_KEY, 
                    "language": "en-US",
                    "append_to_response": "credits,videos"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                return None
            
            details = response.json()
            
            # If this is a specific season, fetch season-specific details
            if content_type == "series" and season_number:
                season_data = await get_tmdb_season_details(tmdb_id, season_number)
                if season_data:
                    # Override with season-specific data
                    details["season_specific"] = True
                    details["season_number"] = season_number
                    details["season_poster_path"] = season_data.get("poster_path")
                    details["season_air_date"] = season_data.get("air_date")
                    details["season_episode_count"] = len(season_data.get("episodes", []))
                    details["season_overview"] = season_data.get("overview")
                    logging.info(f"  📺 Season {season_number}: {details['season_episode_count']} episodes, aired {details.get('season_air_date', 'N/A')}")
            
            details
            
            # Get external IDs (includes IMDb ID)
            external_response = await client.get(
                f"https://api.themoviedb.org/3/{endpoint}/{tmdb_id}/external_ids",
                params={"api_key": TMDB_API_KEY},
                timeout=10.0
            )
            
            if external_response.status_code == 200:
                details["external_ids"] = external_response.json()
            
            # Get watch providers for India
            providers_response = await client.get(
                f"https://api.themoviedb.org/3/{endpoint}/{tmdb_id}/watch/providers",
                params={"api_key": TMDB_API_KEY},
                timeout=10.0
            )
            
            if providers_response.status_code == 200:
                providers_data = providers_response.json()
                details["watch_providers_in"] = providers_data.get("results", {}).get("IN", {})
            
            return details
    except Exception as e:
        logging.error(f"TMDB details error: {str(e)}")
    return None

async def get_omdb_rating(imdb_id: str) -> Optional[Dict]:
    """Get IMDb rating and votes from OMDb"""
    if not OMDB_API_KEY:
        logging.debug(f"OMDb API key not configured, skipping for: {imdb_id}")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(3.0)) as client:  # Reduced to 3s
            response = await client.get(
                "http://www.omdbapi.com/",
                params={
                    "apikey": OMDB_API_KEY,
                    "i": imdb_id,
                    "plot": "short"
                },
                timeout=3.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("Response") == "True" and data.get("imdbRating") != "N/A":
                    logging.info(f"✅ OMDb rating for {imdb_id}: {data.get('imdbRating')}")
                    return {
                        "imdb_rating": data.get("imdbRating"),
                        "imdb_votes": data.get("imdbVotes"),
                        "metascore": data.get("Metascore")
                    }
                else:
                    logging.warning(f"⚠️  OMDb no rating for {imdb_id}")
            elif response.status_code == 401:
                logging.error(f"❌ OMDb API key invalid or expired")
                
    except httpx.TimeoutException:
        logging.warning(f"⏱️  OMDb timeout for {imdb_id} (3s limit exceeded)")
    except Exception as e:
        logging.warning(f"⚠️  OMDb error for {imdb_id}: {str(e)[:50]}")
    return None

async def search_watchmode(title: str, content_type: str = "movie") -> Optional[Dict]:
    """Search Watchmode for streaming sources"""
    try:
        async with httpx.AsyncClient() as client:
            # First search for the title
            search_response = await client.get(
                "https://api.watchmode.com/v1/search/",
                params={
                    "apiKey": WATCHMODE_API_KEY,
                    "search_field": "name",
                    "search_value": title
                },
                timeout=10.0
            )
            
            if search_response.status_code == 200:
                search_data = search_response.json()
                if search_data.get("title_results"):
                    # Get the first match
                    watchmode_id = search_data["title_results"][0]["id"]
                    
                    # Get sources for India
                    sources_response = await client.get(
                        f"https://api.watchmode.com/v1/title/{watchmode_id}/sources/",
                        params={
                            "apiKey": WATCHMODE_API_KEY,
                            "regions": "IN"
                        },
                        timeout=10.0
                    )
                    
                    if sources_response.status_code == 200:
                        return {
                            "watchmode_id": watchmode_id,
                            "sources": sources_response.json()
                        }
    except Exception as e:
        logging.error(f"Watchmode error: {str(e)}")
    return None

def normalize_title_for_search(title: str, platform: str = None) -> str:
    """Normalize title for better search matching"""
    # Remove "Season X" for Apple TV and other platforms
    if platform and platform.lower() in ["apple tv", "appletv"]:
        title = re.sub(r'\s+Season\s+\d+', '', title, flags=re.IGNORECASE)
    
    # Remove year in parentheses
    title = re.sub(r'\s*\(\d{4}\)', '', title)
    
    # Clean up extra spaces
    title = ' '.join(title.split())
    
    return title

async def enrich_content_item(content: Dict) -> Dict:
    """Enrich a single content item with TMDB + OMDb data (non-blocking)"""
    try:
        # Step 1: Extract hints for better TMDB matching
        # Known year for specific titles (hardcoded to resolve duplicates)
        known_years = {
            "Fighter": 2024,  # Hindi film with Hrithik Roshan
            "Asur": 2020,     # Indian series, not international
            "Asur Season 2": 2020,  # Use original series year for better TMDB matching
            "12th Fail": 2023,
            "Scam 2003": 2023,
            "Maharaja": 2024,
            "House of the Dragon": 2022,  # HBO series
            "Slow Horses Season 5": 2022,  # Apple TV+ series (use original year)
            "The Hunt for Veerappan": 2023,  # Indian documentary series
            "The Billionaires of Bollywood": 2024  # Netflix documentary
        }
        
        year_hint = known_years.get(content["title"])
        
        # Detect season number if present in title
        season_number = None
        season_match = re.search(r'Season\s+(\d+)', content["title"], re.IGNORECASE)
        if season_match:
            season_number = int(season_match.group(1))
            logging.info(f"  🎬 Detected Season {season_number}")
        
        # Search TMDB with description for better Indian content detection
        logging.info(f"🔍 Enriching: {content['title']}")
        tmdb_result = await search_tmdb(
            content["title"],
            year=year_hint,  # Use known year if available
            content_type=content.get("content_type", "movie"),
            description=content.get("description", "")  # Pass description for Indian content detection
        )
        
        if not tmdb_result:
            logging.warning(f"❌ No TMDB result for: {content['title']}")
            return content
        
        tmdb_id = tmdb_result["id"]
        
        # Step 2: Get TMDB details (with season-specific data if applicable)
        tmdb_details = await get_tmdb_details(
            tmdb_id,
            content_type=content.get("content_type", "movie"),
            season_number=season_number  # Pass season number for TV shows
        )
        
        if not tmdb_details:
            logging.warning(f"❌ No TMDB details for: {content['title']}")
            return content
        
        # IMMEDIATELY persist TMDB data (don't wait for OMDb)
        content["tmdb_id"] = tmdb_id
        content["normalized_title"] = tmdb_result.get("title") or tmdb_result.get("name")
        
        # Use season-specific description if available
        if tmdb_details.get("season_specific") and tmdb_details.get("season_overview"):
            content["description"] = tmdb_details.get("season_overview")
        else:
            content["description"] = tmdb_details.get("overview", content.get("description"))
        
        # Build full poster URL - prioritize season poster for TV shows
        poster_path = None
        if tmdb_details.get("season_specific") and tmdb_details.get("season_poster_path"):
            poster_path = tmdb_details["season_poster_path"]
            logging.info(f"  📷 Using Season {tmdb_details.get('season_number')} poster")
        elif tmdb_result.get("poster_path"):
            poster_path = tmdb_result["poster_path"]
        
        if poster_path:
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
            content["poster_url"] = poster_url
            content["poster_path"] = poster_url  # Keep both
            content["thumbnail"] = poster_url  # Update thumbnail too
            logging.info(f"  📷 Poster: {poster_url[:60]}...")
        
        # Backdrop
        if tmdb_result.get("backdrop_path"):
            content["backdrop_path"] = f"https://image.tmdb.org/t/p/original{tmdb_result['backdrop_path']}"
        
        # Year - use season air date for season-specific content
        if tmdb_details.get("season_specific") and tmdb_details.get("season_air_date"):
            season_air_date = tmdb_details["season_air_date"]
            if season_air_date:
                content["year"] = int(season_air_date.split("-")[0])
                logging.info(f"  📅 Season {tmdb_details.get('season_number')} Year: {content['year']}")
        else:
            release_date = tmdb_result.get("release_date") or tmdb_result.get("first_air_date")
            if release_date:
                content["year"] = int(release_date.split("-")[0])
        
        # Runtime (for movies) or episode_run_time (for TV)
        content_type_val = content.get("content_type", "movie")
        if content_type_val == "movie":
            runtime = tmdb_details.get("runtime")
            if runtime:
                content["runtime"] = runtime
                logging.info(f"  ⏱️  Runtime: {runtime} min")
        else:
            episode_run_time = tmdb_details.get("episode_run_time")
            if episode_run_time and len(episode_run_time) > 0:
                content["runtime"] = episode_run_time[0]
                logging.info(f"  ⏱️  Episode Runtime: {episode_run_time[0]} min")
        
        # Genres
        genres = tmdb_details.get("genres", [])
        if genres:
            content["genres"] = [g["name"] for g in genres]
            logging.info(f"  🎭 Genres: {', '.join(content['genres'][:3])}")
        
        # Cast (top 5)
        credits = tmdb_details.get("credits", {})
        cast = credits.get("cast", [])
        if cast:
            content["cast"] = [
                {
                    "name": member["name"],
                    "character": member.get("character"),
                    "profile_url": f"https://image.tmdb.org/t/p/w185{member['profile_path']}" if member.get("profile_path") else None
                }
                for member in cast[:5]
            ]
            logging.info(f"  🎬 Cast: {', '.join([c['name'] for c in content['cast'][:2]])}")
        
        # Crew (director, writer)
        crew = credits.get("crew", [])
        directors = [member["name"] for member in crew if member.get("job") == "Director"]
        writers = [member["name"] for member in crew if member.get("job") in ["Writer", "Screenplay"]]
        if directors or writers:
            content["crew"] = {}
            if directors:
                content["crew"]["directors"] = directors[:2]
                logging.info(f"  🎥 Director: {', '.join(directors[:2])}")
            if writers:
                content["crew"]["writers"] = writers[:2]
        
        # Trailer (YouTube)
        videos = tmdb_details.get("videos", {}).get("results", [])
        trailers = [v for v in videos if v.get("type") == "Trailer" and v.get("site") == "YouTube"]
        if trailers:
            content["trailer_url"] = f"https://www.youtube.com/watch?v={trailers[0]['key']}"
            logging.info(f"  🎬 Trailer: {content['trailer_url'][:50]}...")
        
        # Vote count
        vote_count = tmdb_details.get("vote_count")
        if vote_count:
            content["vote_count"] = vote_count
        
        # Language (original language)
        original_language = tmdb_details.get("original_language")
        if original_language:
            # Map language codes to full names
            language_map = {
                "en": "English",
                "hi": "Hindi",
                "ta": "Tamil",
                "te": "Telugu",
                "ml": "Malayalam",
                "kn": "Kannada",
                "mr": "Marathi",
                "bn": "Bengali",
                "pa": "Punjabi",
                "es": "Spanish",
                "fr": "French",
                "de": "German",
                "it": "Italian",
                "ja": "Japanese",
                "ko": "Korean",
                "zh": "Chinese"
            }
            content["language"] = language_map.get(original_language, original_language.upper())
            logging.info(f"  🗣️  Language: {content['language']}")
        
        # Number of episodes (for TV shows)
        if content.get("content_type") in ["series", "documentary"]:
            # Use season-specific episode count if available
            if tmdb_details.get("season_specific") and tmdb_details.get("season_episode_count"):
                content["episodes"] = tmdb_details["season_episode_count"]
                content["season_number"] = tmdb_details.get("season_number")
                logging.info(f"  📺 Season {tmdb_details.get('season_number')} Episodes: {content['episodes']}")
            else:
                num_episodes = tmdb_details.get("number_of_episodes")
                num_seasons = tmdb_details.get("number_of_seasons")
                if num_episodes:
                    content["episodes"] = num_episodes
                    logging.info(f"  📺 Episodes: {num_episodes} ({num_seasons} seasons)")
                if num_seasons:
                    content["seasons"] = num_seasons
        
        # TMDB rating (always available)
        vote_average = tmdb_details.get("vote_average")
        if vote_average:
            content["vote_average"] = round(vote_average, 1)
            if not content.get("rating"):  # Only set if IMDb rating doesn't exist
                content["rating"] = content["vote_average"]
                content["rating_source"] = "tmdb"
            logging.info(f"  ⭐ TMDB Rating: {content['vote_average']}/10 ({vote_count} votes)")
        
        # Get IMDb ID
        imdb_id = tmdb_details.get("external_ids", {}).get("imdb_id")
        if imdb_id:
            content["imdb_id"] = imdb_id
            logging.info(f"  🎬 IMDb ID: {imdb_id}")
            
            # Step 3: Try OMDb (non-blocking, with short timeout)
            try:
                omdb_data = await get_omdb_rating(imdb_id)
                if omdb_data and omdb_data.get("imdb_rating"):
                    try:
                        content["imdb_rating"] = float(omdb_data["imdb_rating"])
                        content["rating"] = content["imdb_rating"]  # Prefer IMDb if available
                        content["imdb_votes"] = omdb_data.get("imdb_votes")
                        content["rating_source"] = "imdb"
                        logging.info(f"  ⭐ IMDb Rating: {content['imdb_rating']} (overriding TMDB)")
                    except:
                        pass
            except Exception as e:
                # OMDb failed, but we already have TMDB data - continue
                logging.warning(f"⚠️  OMDb failed for {content['title']}, using TMDB rating")
                pass
        
        # Extract providers from TMDB watch providers with logos
        watch_providers = tmdb_details.get("watch_providers_in", {})
        streaming_platforms = []
        for provider_type in ["flatrate", "buy", "rent"]:
            if provider_type in watch_providers:
                for provider in watch_providers[provider_type]:
                    platform = {
                        "platform_name": provider["provider_name"],
                        "platform_logo": f"https://image.tmdb.org/t/p/original{provider['logo_path']}" if provider.get("logo_path") else None,
                        "type": provider_type  # flatrate, buy, rent
                    }
                    streaming_platforms.append(platform)
        
        # Deduplicate and store
        if streaming_platforms:
            # Remove duplicates based on platform_name
            seen = set()
            unique_platforms = []
            for p in streaming_platforms:
                if p["platform_name"] not in seen:
                    seen.add(p["platform_name"])
                    unique_platforms.append(p)
            content["streaming_platforms"] = unique_platforms
            content["providers_in"] = [p["platform_name"] for p in unique_platforms]  # Keep for compatibility
            logging.info(f"  📺 Streaming (IN): {', '.join([p['platform_name'] for p in unique_platforms[:3]])}")
        
        # Watchmode for platform content IDs (skip if too slow)
        try:
            watchmode_data = await search_watchmode(
                content["normalized_title"] or content["title"],
                content_type=content.get("content_type", "movie")
            )
            
            if watchmode_data:
                content["watchmode_id"] = watchmode_data["watchmode_id"]
                sources = watchmode_data.get("sources", [])
                for source in sources:
                    provider_name = source.get("name", "").lower()
                    web_url = source.get("web_url")
                    
                    if web_url and "netflix" in provider_name:
                        match = re.search(r'/title/(\d+)', web_url)
                        if match:
                            content["platform_content_id"] = match.group(1)
                    elif web_url and ("prime" in provider_name or "amazon" in provider_name):
                        match = re.search(r'/detail/([^/]+)', web_url)
                        if match:
                            content["platform_content_id"] = match.group(1)
        except:
            pass  # Watchmode is optional
        
        content["last_enriched"] = datetime.now(timezone.utc).isoformat()
        
        logging.info(f"✅ Enriched: {content['title']} (TMDB: {tmdb_id}, Rating: {content.get('rating', 'N/A')}, Source: {content.get('rating_source', 'N/A')})")
        
    except Exception as e:
        logging.error(f"❌ Enrichment error for {content.get('title')}: {str(e)}")
    
    return content

# ============================================================================

class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    platform: str
    platform_content_id: Optional[str] = None
    rating: Optional[float] = 0.0  # Can be IMDb or TMDB rating
    thumbnail: Optional[str] = None  # TMDB poster URL
    description: Optional[str] = ""  # Description/overview
    descriptor: Optional[str] = None  # Short, witty one-liner for tiles
    release_date: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: Optional[str] = None
    likes: int = 0
    shares: int = 0
    # Enhanced metadata fields
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None
    imdb_rating: Optional[float] = None
    imdb_votes: Optional[str] = None
    vote_average: Optional[float] = None  # TMDB rating
    rating_source: Optional[str] = None  # "imdb" or "tmdb"
    poster_path: Optional[str] = None  # Full TMDB poster URL
    poster_url: Optional[str] = None  # Full TMDB poster URL (w500)
    backdrop_path: Optional[str] = None  # TMDB backdrop URL
    year: Optional[int] = None
    normalized_title: Optional[str] = None  # For better search matching
    providers_in: List[str] = Field(default_factory=list)  # Available platforms in India
    watchmode_id: Optional[int] = None
    last_enriched: Optional[str] = None
    # NEW Phase 1 metadata fields
    runtime: Optional[int] = None  # Duration in minutes
    genres: Optional[List[str]] = Field(default_factory=list)  # List of genre names
    cast: Optional[List[Dict]] = Field(default_factory=list)  # Top 5 cast members
    crew: Optional[Dict] = Field(default_factory=dict)  # Directors, writers
    trailer_url: Optional[str] = None  # YouTube trailer URL
    vote_count: Optional[int] = None  # Number of TMDB votes
    streaming_platforms: Optional[List[Dict]] = Field(default_factory=list)  # Platform details with logos
    # Additional metadata
    language: Optional[str] = None  # Original language (Hindi, English, etc.)
    episodes: Optional[int] = None  # Number of episodes (for series)
    seasons: Optional[int] = None  # Number of seasons (for series)
    # Season-aware fields (Nov25 ingestion)
    season: Optional[int] = None  # Current season number
    series_title: Optional[str] = None  # Canonical series name
    display_title: Optional[str] = None  # Display name for new seasons (e.g., "Show – Season 4")
    is_new_season: Optional[bool] = None  # True for S2+
    season_year: Optional[int] = None  # Year of season release
    season_release_date: Optional[str] = None  # ISO date
    series_start_year: Optional[int] = None  # Original series start year
    freshness_batch: Optional[str] = None  # Batch identifier (e.g., "nov25")
    curation_flags: Optional[Dict] = None

class TitleLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title_id: str  # Content ID from our database
    country: str = "IN"
    provider: str
    web_url: Optional[str] = None
    scheme_url: Optional[str] = None
    app_search_url: Optional[str] = None
    platform_content_id: Optional[str] = None
    last_checked: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LinkResolverResponse(BaseModel):
    url: str
    scheme_url: Optional[str] = None
    fallback_search_url: str
    provider: str
    platform_content_id: Optional[str] = None

class ContentCreate(BaseModel):
    title: str
    category: str
    platform: str
    platform_content_id: Optional[str] = None
    rating: Optional[float] = 0.0
    thumbnail: str
    description: str
    release_date: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: str = ""

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    points: int = 0
    level: int = 1
    badges: List[str] = Field(default_factory=list)
    avatar: str = "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
    liked_content: List[str] = Field(default_factory=list)
    favorite_genres: List[str] = Field(default_factory=list)
    favorite_platforms: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    username: str
    email: str

class UserUpdate(BaseModel):
    favorite_genres: Optional[List[str]] = None
    favorite_platforms: Optional[List[str]] = None
    avatar: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class ChatResponse(BaseModel):
    response: str
    session_id: str

class CommunityMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    avatar: str
    message: str
    content_id: Optional[str] = None
    likes: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CommunityMessageCreate(BaseModel):
    user_id: str
    message: str
    content_id: Optional[str] = None

class LikeAction(BaseModel):
    user_id: str
    content_id: str

class ShareAction(BaseModel):
    user_id: str
    content_id: str
    platform: str


# ============================================================================
# GET WITH IT - FEED MODELS
# ============================================================================

class FeedItem(BaseModel):
    """Feed item for Get With It feature"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Core fields
    title: str
    description: str
    image_url: str
    source_url: str
    category: str  # entertainment, sports, ott, local, music
    published_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    # Priority & hero
    is_hero: bool = False
    priority: int = 5  # 1-10, higher = more important
    
    # Optional linking to catalog
    linked_content_id: Optional[str] = None
    
    # Future automation fields (Phase 2)
    source: str = "manual"  # manual | auto
    source_name: str = "Manual"  # Manual | YouTube | TMDB | RSS
    source_type: Optional[str] = None  # trailer | highlight | article | drop | trend
    tags: List[str] = Field(default_factory=list)
    entity_type: Optional[str] = None  # movie | series | league | sport
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_by: str = "admin"
    updated_at: Optional[str] = None

class FeedItemCreate(BaseModel):
    """Create feed item request"""
    title: str
    description: str
    image_url: str
    source_url: str
    category: str
    is_hero: bool = False
    priority: int = 5
    linked_content_id: Optional[str] = None
    source_type: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    entity_type: Optional[str] = None

class FeedItemUpdate(BaseModel):
    """Update feed item request"""
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    category: Optional[str] = None
    is_hero: Optional[bool] = None
    priority: Optional[int] = None
    linked_content_id: Optional[str] = None
    source_type: Optional[str] = None
    tags: Optional[List[str]] = None
    entity_type: Optional[str] = None

# ============================================================================
# WIN FEATURE MODELS (Polls & Quizzes)
# ============================================================================

class PollOption(BaseModel):
    """Poll option with vote count"""
    id: str
    text: str
    votes: int = 0

class Poll(BaseModel):
    """Poll for Win feature"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    description: Optional[str] = None
    options: List[PollOption]
    category: str  # movies, sports, ott, music
    active: bool = True
    total_votes: int = 0
    ends_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PollVote(BaseModel):
    """User vote on a poll"""
    poll_id: str
    option_id: str
    user_id: Optional[str] = "anonymous"

class QuizQuestion(BaseModel):
    """Single quiz question"""
    id: str
    question: str
    options: List[str]  # A, B, C, D labels
    option_texts: List[str]  # Actual answer texts
    correct_answer: str  # A, B, C, or D
    explanation_correct: str
    explanation_incorrect: str
    difficulty: str = "medium"  # easy, medium, hard

class Quiz(BaseModel):
    """Quiz for Win feature"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    questions: List[QuizQuestion]
    category: str  # entertainment, bollywood, sports, etc
    active: bool = True
    total_attempts: int = 0
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuizResponse(BaseModel):
    """User's quiz response"""
    quiz_id: str
    answers: List[str]  # A, B, C, D for each question
    user_id: Optional[str] = "anonymous"

class QuizResult(BaseModel):
    """Quiz result with score"""
    quiz_id: str
    score: int
    total: int
    percentage: int
    percentile: int  # You're in top X% of players
    correct_answers: List[bool]

# ============================================================================
# CREW FEATURE MODELS (Social Communities)
# ============================================================================

class Crew(BaseModel):
    """Crew/Community model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    icon: str  # Emoji
    description: str
    founder_id: Optional[str] = None
    member_count: int = 0
    is_predefined: bool = False  # True for default 6 crews
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CrewCreate(BaseModel):
    """Create a new crew"""
    name: str = Field(max_length=30)
    icon: str
    description: Optional[str] = Field(default="", max_length=200)
    founder_id: Optional[str] = "anonymous"

class UserCrew(BaseModel):
    """User membership in a crew"""
    user_id: str
    crew_id: str
    is_founder: bool = False
    joined_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Watchlist(BaseModel):
    """User's watchlist item"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    content_type: str  # movie, series, news
    content_title: str
    content_image: Optional[str] = None
    status: str = "want_to_watch"  # want_to_watch, watched
    shared_with_crews: List[str] = []
    added_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WatchlistCreate(BaseModel):
    """Add item to watchlist"""
    user_id: str = "anonymous"
    content_id: str
    content_type: str
    content_title: str
    content_image: Optional[str] = None
    status: str = "want_to_watch"
    shared_with_crews: List[str] = []

class Reaction(BaseModel):
    """User reaction to content"""
    user_id: str
    content_id: str
    reaction_type: str  # love, fire, must_watch, funny, emotional, dislike
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReactionCreate(BaseModel):
    """Add a reaction"""
    user_id: str = "anonymous"
    content_id: str
    reaction_type: str  # love, fire, must_watch, funny, emotional, dislike

class ReactionCounts(BaseModel):
    """Aggregated reaction counts for content"""
    content_id: str
    love: int = 0
    fire: int = 0
    must_watch: int = 0
    funny: int = 0
    emotional: int = 0
    dislike: int = 0
    total: int = 0

class IncomingAutoFeedItem(BaseModel):
    """Incoming auto feed item for future automation (Phase 2)"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Same fields as FeedItem
    title: str
    description: str
    image_url: str
    source_url: str
    category: str
    published_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_hero: bool = False
    priority: int = 5
    linked_content_id: Optional[str] = None
    
    # Automation fields
    source: str = "auto"
    source_name: str  # YouTube | TMDB | RSS
    source_type: str  # trailer | highlight | article | drop | trend
    tags: List[str] = Field(default_factory=list)
    entity_type: Optional[str] = None
    
    # Approval workflow
    status: str = "pending"  # pending | approved | rejected
    confidence_score: Optional[float] = None  # For future ranking
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None


async def award_points(user_id: str, points: int, badge: Optional[str] = None):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    
    new_points = user["points"] + points
    new_level = (new_points // 100) + 1
    
    update_data = {"points": new_points, "level": new_level}
    
    if badge and badge not in user.get("badges", []):
        update_data["badges"] = user.get("badges", []) + [badge]
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})

# Helper function to generate proper deep links
def generate_provider_links(provider: str, title: str, platform_content_id: Optional[str] = None) -> Dict[str, Optional[str]]:
    """
    Generate web URL, scheme URL, and search fallback for a provider
    Enhanced to match Prime Video's successful search pattern
    """
    # Better encoding for search URLs - URL encode properly
    from urllib.parse import quote_plus
    encoded_title = quote_plus(title)
    
    links = {
        "web_url": None,
        "scheme_url": None,
        "app_search_url": None
    }
    
    if provider.lower() == "netflix":
        if platform_content_id:
            links["web_url"] = f"https://www.netflix.com/title/{platform_content_id}"
            links["scheme_url"] = f"nflx://www.netflix.com/title/{platform_content_id}"
        # Netflix search - using proper URL encoding like Prime
        links["app_search_url"] = f"https://www.netflix.com/search?q={encoded_title}"
    
    elif provider.lower() == "prime video":
        if platform_content_id:
            links["web_url"] = f"https://www.primevideo.com/detail/{platform_content_id}"
            links["scheme_url"] = f"aiv://aiv/view?gti={platform_content_id}"
        # Prime search - already working well
        links["app_search_url"] = f"https://www.primevideo.com/search?phrase={encoded_title}"
    
    elif provider.lower() == "jiohotstar":
        if platform_content_id:
            links["web_url"] = f"https://www.hotstar.com/in/{platform_content_id}"
            links["scheme_url"] = f"hotstar://content/{platform_content_id}"
        # Hotstar - revert to original path that worked
        links["app_search_url"] = f"https://www.hotstar.com/in/search/{encoded_title}"
    
    elif provider.lower() == "sonyliv":
        if platform_content_id:
            links["web_url"] = f"https://www.sonyliv.com/shows/{platform_content_id}"
        # SonyLiv - revert to homepage (search not supported reliably)
        links["app_search_url"] = "https://www.sonyliv.com/"
    
    elif provider.lower() == "apple tv":
        if platform_content_id:
            links["web_url"] = f"https://tv.apple.com/show/{platform_content_id}"
            links["scheme_url"] = f"com.apple.tv://tv.apple.com/show/{platform_content_id}"
        # Apple TV search - already working
        links["app_search_url"] = f"https://tv.apple.com/search?term={encoded_title}"
    
    elif provider.lower() == "fancode":
        # Fancode - homepage only (search not reliable)
        links["web_url"] = f"https://www.fancode.com/"
        links["app_search_url"] = links["web_url"]
    
    elif provider.lower() == "dazn":
        # DAZN - homepage only (search not reliable)
        links["web_url"] = f"https://www.dazn.com/en-IN/"
        links["app_search_url"] = links["web_url"]
    
    elif provider.lower() in ["mx player", "youtube"]:
        links["web_url"] = f"https://www.{provider.lower().replace(' ', '')}.com/"
        links["app_search_url"] = links["web_url"]
    
    return links

@api_router.get("/")
async def root():
    return {"message": "Welcome to The Connector API"}

@api_router.get("/resolve-link", response_model=LinkResolverResponse)
async def resolve_link(
    title_id: str = Query(..., description="Content ID"),
    provider: str = Query(..., description="Provider name"),
    country: str = Query("IN", description="Country code")
):
    """
    Resolve deep link for a title on a specific provider (uses enriched data)
    """
    # Get content from database
    content = await db.content.find_one({"id": title_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Use normalized title for better search if available
    search_title = normalize_title_for_search(
        content.get("normalized_title") or content["title"],
        provider
    )
    
    # Check if we have a cached link
    cached_link = await db.title_links.find_one(
        {"title_id": title_id, "provider": provider.lower(), "country": country},
        {"_id": 0}
    )
    
    if cached_link:
        return LinkResolverResponse(
            url=cached_link.get("web_url") or cached_link.get("app_search_url", ""),
            scheme_url=cached_link.get("scheme_url"),
            fallback_search_url=cached_link.get("app_search_url", ""),
            provider=provider,
            platform_content_id=cached_link.get("platform_content_id")
        )
    
    # Generate links on the fly with normalized title
    links = generate_provider_links(provider, search_title, content.get("platform_content_id"))
    
    return LinkResolverResponse(
        url=links["web_url"] or links["app_search_url"],
        scheme_url=links["scheme_url"],
        fallback_search_url=links["app_search_url"],
        provider=provider,
        platform_content_id=content.get("platform_content_id")
    )

@api_router.post("/enrich-all-content")
async def enrich_all_content():
    """
    Enrich all content with TMDB + OMDb + Watchmode metadata
    This should be run after seeding or periodically for updates
    """
    all_content = await db.content.find({}, {"_id": 0}).to_list(1000)
    enriched_count = 0
    failed = []
    
    logging.info(f"Starting enrichment for {len(all_content)} items")
    
    for content in all_content:
        try:
            original_id = content["id"]
            original_title = content["title"]
            
            # Enrich the content
            enriched = await enrich_content_item(content.copy())  # Use copy to avoid modifying original
            
            # Remove _id if present to avoid conflicts
            enriched.pop("_id", None)
            
            # Build update dict with only the fields we want to update
            update_fields = {
                "thumbnail": enriched.get("thumbnail", content["thumbnail"]),
                "rating": enriched.get("rating", content["rating"]),
                "description": enriched.get("description", content["description"]),
                "tmdb_id": enriched.get("tmdb_id"),
                "imdb_id": enriched.get("imdb_id"),
                "imdb_rating": enriched.get("imdb_rating"),
                "imdb_votes": enriched.get("imdb_votes"),
                "vote_average": enriched.get("vote_average"),
                "rating_source": enriched.get("rating_source", "tmdb"),
                "poster_path": enriched.get("poster_path"),
                "poster_url": enriched.get("poster_url"),
                "backdrop_path": enriched.get("backdrop_path"),
                "year": enriched.get("year"),
                "normalized_title": enriched.get("normalized_title"),
                "providers_in": enriched.get("providers_in", []),
                "watchmode_id": enriched.get("watchmode_id"),
                "platform_content_id": enriched.get("platform_content_id", content.get("platform_content_id")),
                "last_enriched": enriched.get("last_enriched"),
                # NEW METADATA FIELDS
                "runtime": enriched.get("runtime"),
                "genres": enriched.get("genres", []),
                "cast": enriched.get("cast", []),
                "crew": enriched.get("crew", {}),
                "trailer_url": enriched.get("trailer_url"),
                "vote_count": enriched.get("vote_count"),
                "streaming_platforms": enriched.get("streaming_platforms", []),
                # CRITICAL MISSING FIELDS
                "language": enriched.get("language"),
                "episodes": enriched.get("episodes"),
                "seasons": enriched.get("seasons")
            }
            
            # Update in database
            result = await db.content.update_one(
                {"id": original_id},
                {"$set": update_fields}
            )
            
            if result.modified_count > 0:
                enriched_count += 1
                
                # Verify the update stuck by reading back
                verification = await db.content.find_one({"id": original_id}, {"_id": 0})
                logging.info(f"Successfully updated {original_title} - Verified TMDB ID: {verification.get('tmdb_id', 'NONE')}")
            else:
                logging.warning(f"No document updated for {original_title} (matched: {result.matched_count})")
                
        except Exception as e:
            logging.error(f"Failed to enrich {content.get('title')}: {str(e)}")
            failed.append(content.get('title'))
    
    logging.info(f"Enrichment complete: {enriched_count} updated out of {len(all_content)}")
    
    return {
        "message": f"Enriched {enriched_count} out of {len(all_content)} content items",
        "enriched": enriched_count,
        "total": len(all_content),
        "failed": failed
    }

@api_router.get("/debug/sample")
async def debug_sample():
    """
    Debug probe: Returns 3-5 enriched titles with full metadata
    """
    content_list = await db.content.find(
        {"tmdb_id": {"$ne": None}},
        {"_id": 0}
    ).limit(5).to_list(5)
    
    if not content_list:
        content_list = await db.content.find({}, {"_id": 0}).limit(5).to_list(5)
    
    # Format for verification
    samples = []
    for item in content_list:
        samples.append({
            "titleId": item.get("id"),
            "title": item.get("title"),
            "tmdb_id": item.get("tmdb_id"),
            "imdb_id": item.get("imdb_id"),
            "vote_average": item.get("vote_average"),
            "imdb_rating": item.get("imdb_rating"),
            "rating_source": item.get("rating_source", "unknown"),
            "poster_url": item.get("poster_url"),
            "thumbnail": item.get("thumbnail"),
            "providers_IN": item.get("providers_in", []),
            "platform": item.get("platform"),
            "platform_content_id": item.get("platform_content_id"),
            "enriched": item.get("tmdb_id") is not None
        })
    
    return {
        "status": "success",
        "count": len(samples),
        "enriched_count": len([s for s in samples if s["enriched"]]),
        "samples": samples
    }

@api_router.get("/debug/item")
async def debug_item(title: str = Query(..., description="Title to search for")):
    """
    Debug probe: Returns a single item by title
    """
    item = await db.content.find_one(
        {"title": {"$regex": title, "$options": "i"}},
        {"_id": 0}
    )
    
    if not item:
        raise HTTPException(status_code=404, detail=f"Title '{title}' not found")
    
    return {
        "status": "success",
        "item": {
            "titleId": item.get("id"),
            "title": item.get("title"),
            "tmdb_id": item.get("tmdb_id"),
            "imdb_id": item.get("imdb_id"),
            "vote_average": item.get("vote_average"),
            "imdb_rating": item.get("imdb_rating"),
            "rating_source": item.get("rating_source", "unknown"),
            "poster_url": item.get("poster_url"),
            "poster_path": item.get("poster_path"),
            "thumbnail": item.get("thumbnail"),
            "providers_IN": item.get("providers_in", []),
            "platform": item.get("platform"),
            "platform_content_id": item.get("platform_content_id"),
            "enriched": item.get("tmdb_id") is not None,
            "last_enriched": item.get("last_enriched")
        }
    }

@api_router.get("/content", response_model=List[Content])
async def get_all_content(response: Response, q: Optional[str] = None):
    # Add cache control headers to prevent caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    # Log search queries
    if q:
        log_search_query(q, "content_fetch")
    
    # Fetch content with Nov25 batch prioritized and sorted by rating
    # Nov25 content first, then rest
    nov25_content = await db.content.find(
        {"freshness_batch": "nov25"}, 
        {"_id": 0}
    ).sort("rating", -1).to_list(100)
    
    other_content = await db.content.find(
        {"freshness_batch": {"$ne": "nov25"}}, 
        {"_id": 0}
    ).sort("rating", -1).to_list(900)
    
    # Combine with Nov25 first
    content_list = nov25_content + other_content
    return content_list

def log_search_query(query: str, event_type: str = "search", result_count: int = 0, content_id: str = None):
    """Log search events to JSON file for analytics"""
    try:
        from datetime import datetime
        import json
        import os
        
        log_dir = "/app/logs"
        os.makedirs(log_dir, exist_ok=True)
        log_file = f"{log_dir}/search_logs.jsonl"
        
        log_entry = {
            "ts": datetime.utcnow().isoformat(),
            "event": event_type,
            "q": query,
            "results": result_count
        }
        
        if content_id:
            log_entry["content_id"] = content_id
        
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        logging.error(f"Failed to log search query: {e}")

@api_router.get("/content/{category}", response_model=List[Content])
async def get_content_by_category(category: str, response: Response):
    # Add cache control headers
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    content_list = await db.content.find({"category": category}, {"_id": 0}).to_list(100)
    return content_list

@api_router.get("/search", response_model=List[Content])
async def search_content(q: str, limit: int = 24, response: Response = None):
    """
    Search content with ranking: exact → startsWith → contains
    """
    if response:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    if not q or len(q) < 2:
        log_search_query(q, "search", 0)
        return []
    
    # Fetch all content
    all_content = await db.content.find({}, {"_id": 0}).to_list(1000)
    
    query_lower = q.lower().strip()
    
    # Rank results
    exact_matches = []
    starts_with = []
    contains = []
    
    for item in all_content:
        title_lower = item.get("title", "").lower()
        
        if title_lower == query_lower:
            exact_matches.append(item)
        elif title_lower.startswith(query_lower):
            starts_with.append(item)
        elif query_lower in title_lower:
            contains.append(item)
    
    # Combine ranked results
    ranked_results = exact_matches + starts_with + contains
    
    # Remove duplicates while preserving order
    seen = set()
    unique_results = []
    for item in ranked_results:
        item_id = item.get("id")
        if item_id not in seen:
            seen.add(item_id)
            unique_results.append(item)
    
    # Limit results
    final_results = unique_results[:limit]
    
    # Log search
    log_search_query(q, "search", len(final_results))
    
    return final_results



# ============================================================================
# GET WITH IT - FEED ENDPOINTS
# ============================================================================

@api_router.get("/feed", response_model=List[FeedItem])
async def get_feed(
    category: Optional[str] = None,
    limit: int = 50,
    response: Response = None
):
    """Get feed items, optionally filtered by category"""
    if response:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    query = {}
    if category and category != "all":
        query["category"] = category
    
    # Get feed items sorted by priority (desc) then published_at (desc)
    feed_items = await db.feed_items.find(query, {"_id": 0}) \
        .sort([("is_hero", -1), ("priority", -1), ("published_at", -1)]) \
        .limit(limit) \
        .to_list(limit)
    
    return feed_items

@api_router.get("/feed/hero", response_model=Optional[FeedItem])
async def get_hero_item(response: Response = None):
    """Get the current hero feed item"""
    if response:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    
    hero_item = await db.feed_items.find_one({"is_hero": True}, {"_id": 0})
    return hero_item

@api_router.post("/feed", response_model=FeedItem)
async def create_feed_item(input: FeedItemCreate):
    """Create a new feed item (admin only for MVP)"""
    
    # If setting as hero, unset any existing hero
    if input.is_hero:
        await db.feed_items.update_many(
            {"is_hero": True},
            {"$set": {"is_hero": False}}
        )
    
    feed_item = FeedItem(**input.model_dump())
    doc = feed_item.model_dump()
    await db.feed_items.insert_one(doc)
    
    return feed_item

@api_router.put("/feed/{feed_id}", response_model=FeedItem)
async def update_feed_item(feed_id: str, update: FeedItemUpdate):
    """Update a feed item"""
    
    # Check if item exists
    existing = await db.feed_items.find_one({"id": feed_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Feed item not found")
    
    # If setting as hero, unset any existing hero
    if update.is_hero is True:
        await db.feed_items.update_many(
            {"is_hero": True, "id": {"$ne": feed_id}},
            {"$set": {"is_hero": False}}
        )
    
    # Update item
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.feed_items.update_one(
        {"id": feed_id},
        {"$set": update_data}
    )
    
    # Return updated item
    updated_item = await db.feed_items.find_one({"id": feed_id}, {"_id": 0})
    return FeedItem(**updated_item)

@api_router.delete("/feed/{feed_id}")
async def delete_feed_item(feed_id: str):
    """Delete a feed item"""
    result = await db.feed_items.delete_one({"id": feed_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feed item not found")
    
    return {"message": "Feed item deleted successfully"}

@api_router.get("/feed/stats")
async def get_feed_stats():
    """Get feed statistics"""
    total = await db.feed_items.count_documents({})
    by_category = {}
    
    for category in ["entertainment", "sports", "ott", "local", "music"]:
        count = await db.feed_items.count_documents({"category": category})
        by_category[category] = count
    
    hero_count = await db.feed_items.count_documents({"is_hero": True})
    
    return {
        "total": total,
        "by_category": by_category,
        "hero_items": hero_count
    }


# ============================================================================
# WIN FEATURE ENDPOINTS (Polls & Quizzes)
# ============================================================================

@api_router.get("/win/polls", response_model=List[Poll])
async def get_polls(active_only: bool = True):
    """Get all active polls"""
    query = {"active": True} if active_only else {}
    polls = await db.polls.find(query).to_list(length=None)
    return [Poll(**poll) for poll in polls]

@api_router.post("/win/polls/{poll_id}/vote")
async def vote_on_poll(poll_id: str, vote: PollVote):
    """Vote on a poll"""
    # Find the poll
    poll = await db.polls.find_one({"id": poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Update vote count for the option
    await db.polls.update_one(
        {"id": poll_id, "options.id": vote.option_id},
        {"$inc": {"options.$.votes": 1, "total_votes": 1}}
    )
    
    # Get updated poll
    updated_poll = await db.polls.find_one({"id": poll_id})
    return Poll(**updated_poll)

@api_router.get("/win/quizzes", response_model=List[Quiz])
async def get_quizzes(active_only: bool = True):
    """Get all active quizzes"""
    query = {"active": True} if active_only else {}
    quizzes = await db.quizzes.find(query).to_list(length=None)
    return [Quiz(**quiz) for quiz in quizzes]

@api_router.post("/win/quizzes/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, response: QuizResponse):
    """Submit quiz answers and get results"""
    # Find the quiz
    quiz = await db.quizzes.find_one({"id": quiz_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz_obj = Quiz(**quiz)
    
    # Calculate score
    correct_answers = []
    score = 0
    for idx, answer in enumerate(response.answers):
        if idx < len(quiz_obj.questions):
            is_correct = answer == quiz_obj.questions[idx].correct_answer
            correct_answers.append(is_correct)
            if is_correct:
                score += 1
    
    total = len(quiz_obj.questions)
    percentage = int((score / total) * 100) if total > 0 else 0
    
    # Calculate percentile (mock for now - in real app, compare with other users)
    # Higher score = better percentile
    percentile_map = {
        5: 8,   # 5/5 = top 8%
        4: 32,  # 4/5 = top 32%
        3: 52,  # 3/5 = top 52%
        2: 75,  # 2/5 = top 75%
        1: 85,  # 1/5 = top 85%
        0: 95   # 0/5 = top 95%
    }
    percentile = percentile_map.get(score, 50)
    
    # Increment attempt counter
    await db.quizzes.update_one(
        {"id": quiz_id},
        {"$inc": {"total_attempts": 1}}
    )
    
    return QuizResult(
        quiz_id=quiz_id,
        score=score,
        total=total,
        percentage=percentage,
        percentile=percentile,
        correct_answers=correct_answers
    )

# ============================================================================
# CREW FEATURE ENDPOINTS
# ============================================================================

@api_router.get("/crew/list", response_model=List[Crew])
async def get_crews():
    """Get all crews"""
    crews = await db.crews.find().to_list(length=None)
    return [Crew(**crew) for crew in crews]

@api_router.post("/crew/create", response_model=Crew)
async def create_crew(crew_data: CrewCreate):
    """Create a new crew"""
    crew = Crew(
        name=crew_data.name,
        icon=crew_data.icon,
        description=crew_data.description or "",
        founder_id=crew_data.founder_id,
        member_count=1,  # Creator is first member
        is_predefined=False
    )
    
    crew_dict = crew.model_dump()
    await db.crews.insert_one(crew_dict)
    
    # Auto-join creator
    user_crew = UserCrew(
        user_id=crew_data.founder_id,
        crew_id=crew.id,
        is_founder=True
    )
    await db.user_crews.insert_one(user_crew.model_dump())
    
    return crew

@api_router.post("/crew/{crew_id}/join")
async def join_crew(crew_id: str, user_id: str = "anonymous"):
    """Join a crew"""
    # Check if already joined
    existing = await db.user_crews.find_one({"user_id": user_id, "crew_id": crew_id})
    if existing:
        return {"message": "Already joined"}
    
    # Add membership
    user_crew = UserCrew(user_id=user_id, crew_id=crew_id, is_founder=False)
    await db.user_crews.insert_one(user_crew.model_dump())
    
    # Increment member count
    await db.crews.update_one({"id": crew_id}, {"$inc": {"member_count": 1}})
    
    return {"message": "Joined successfully"}

@api_router.post("/crew/{crew_id}/leave")
async def leave_crew(crew_id: str, user_id: str = "anonymous"):
    """Leave a crew"""
    # Remove membership
    result = await db.user_crews.delete_one({"user_id": user_id, "crew_id": crew_id})
    
    if result.deleted_count > 0:
        # Decrement member count
        await db.crews.update_one({"id": crew_id}, {"$inc": {"member_count": -1}})
        return {"message": "Left successfully"}
    
    return {"message": "Not a member"}

@api_router.get("/crew/my-crews")
async def get_my_crews(user_id: str = "anonymous"):
    """Get crews user has joined"""
    user_crews = await db.user_crews.find({"user_id": user_id}).to_list(length=None)
    crew_ids = [uc["crew_id"] for uc in user_crews]
    
    if not crew_ids:
        return []
    
    crews = await db.crews.find({"id": {"$in": crew_ids}}).to_list(length=None)
    return [Crew(**crew) for crew in crews]

@api_router.get("/crew/{crew_id}/content")
async def get_crew_content(crew_id: str):
    """Get content relevant to a crew"""
    # Get crew info
    crew = await db.crews.find_one({"id": crew_id})
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    # Get feed items tagged for this crew
    feed_items = await db.feed_items.find(
        {"relevant_crews": crew["name"].lower().replace(" ", "_")}
    ).to_list(length=None)
    
    # Get polls relevant to this crew
    polls = await db.polls.find(
        {"$or": [
            {"relevant_crews": crew["name"].lower().replace(" ", "_")},
            {"relevant_crews": "all"}
        ]}
    ).to_list(length=None)
    
    return {
        "feed_items": feed_items,
        "polls": polls
    }

# ============================================================================
# WATCHLIST ENDPOINTS
# ============================================================================

@api_router.get("/watchlist/my-watchlist")
async def get_my_watchlist(user_id: str = "anonymous"):
    """Get user's watchlist"""
    watchlist = await db.watchlist.find({"user_id": user_id}).to_list(length=None)
    return [Watchlist(**item) for item in watchlist]

@api_router.post("/watchlist/add", response_model=Watchlist)
async def add_to_watchlist(item: WatchlistCreate):
    """Add item to watchlist"""
    # Check if already in watchlist
    existing = await db.watchlist.find_one({
        "user_id": item.user_id,
        "content_id": item.content_id
    })
    
    if existing:
        # Update existing
        await db.watchlist.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "status": item.status,
                "shared_with_crews": item.shared_with_crews
            }}
        )
        return Watchlist(**existing)
    
    # Create new
    watchlist_item = Watchlist(
        user_id=item.user_id,
        content_id=item.content_id,
        content_type=item.content_type,
        content_title=item.content_title,
        content_image=item.content_image,
        status=item.status,
        shared_with_crews=item.shared_with_crews
    )
    
    await db.watchlist.insert_one(watchlist_item.model_dump())
    return watchlist_item

@api_router.delete("/watchlist/{watchlist_id}")
async def remove_from_watchlist(watchlist_id: str, user_id: str = "anonymous"):
    """Remove item from watchlist"""
    result = await db.watchlist.delete_one({"id": watchlist_id, "user_id": user_id})
    
    if result.deleted_count > 0:
        return {"message": "Removed from watchlist"}
    
    raise HTTPException(status_code=404, detail="Item not found")

@api_router.get("/watchlist/crew/{crew_id}")
async def get_crew_watchlist(crew_id: str):
    """Get what crew members are watching"""
    # Get crew name
    crew = await db.crews.find_one({"id": crew_id})
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    # Get watchlist items shared with this crew
    watchlist = await db.watchlist.find(
        {"shared_with_crews": crew_id}
    ).to_list(length=None)
    
    # Convert to Watchlist models and aggregate by content_id
    from collections import Counter
    content_counts = Counter([item["content_id"] for item in watchlist])
    
    # Get unique items with counts
    unique_items = {}
    for item in watchlist:
        cid = item["content_id"]
        if cid not in unique_items:
            # Remove _id before creating Watchlist model
            item_dict = {k: v for k, v in item.items() if k != "_id"}
            watchlist_item = Watchlist(**item_dict)
            unique_items[cid] = {
                **watchlist_item.model_dump(),
                "member_count": content_counts[cid]
            }
    
    return list(unique_items.values())

# ============================================================================
# REACTIONS ENDPOINTS
# ============================================================================

@api_router.post("/reactions/add")
async def add_reaction(reaction: ReactionCreate):
    """Add or update reaction"""
    # Check if user already reacted
    existing = await db.reactions.find_one({
        "user_id": reaction.user_id,
        "content_id": reaction.content_id
    })
    
    if existing:
        # Update reaction
        await db.reactions.update_one(
            {"_id": existing["_id"]},
            {"$set": {"reaction_type": reaction.reaction_type}}
        )
    else:
        # Create new reaction
        reaction_obj = Reaction(
            user_id=reaction.user_id,
            content_id=reaction.content_id,
            reaction_type=reaction.reaction_type
        )
        await db.reactions.insert_one(reaction_obj.model_dump())
    
    return {"message": "Reaction added"}

@api_router.delete("/reactions/remove")
async def remove_reaction(user_id: str, content_id: str):
    """Remove user's reaction"""
    await db.reactions.delete_one({"user_id": user_id, "content_id": content_id})
    return {"message": "Reaction removed"}

@api_router.get("/reactions/{content_id}", response_model=ReactionCounts)
async def get_reactions(content_id: str):
    """Get reaction counts for content"""
    reactions = await db.reactions.find({"content_id": content_id}).to_list(length=None)
    
    counts = {
        "love": 0,
        "fire": 0,
        "must_watch": 0,
        "funny": 0,
        "emotional": 0,
        "dislike": 0
    }
    
    for reaction in reactions:
        reaction_type = reaction.get("reaction_type")
        if reaction_type in counts:
            counts[reaction_type] += 1
    
    return ReactionCounts(
        content_id=content_id,
        love=counts["love"],
        fire=counts["fire"],
        must_watch=counts["must_watch"],
        funny=counts["funny"],
        emotional=counts["emotional"],
        dislike=counts["dislike"],
        total=sum(counts.values())
    )

@api_router.get("/proxy-image")
async def proxy_image(url: str):
    """Proxy TMDB images to avoid ORB blocking"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                return StreamingResponse(
                    io.BytesIO(response.content),
                    media_type=response.headers.get("content-type", "image/jpeg"),
                    headers={
                        "Cache-Control": "public, max-age=86400",
                        "Access-Control-Allow-Origin": "*"
                    }
                )
            else:
                raise HTTPException(status_code=response.status_code, detail="Image not found")
    except Exception as e:
        logging.error(f"Error proxying image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load image")

@api_router.post("/content", response_model=Content)
async def create_content(input: ContentCreate):
    content_obj = Content(**input.model_dump(), likes=0, shares=0)
    doc = content_obj.model_dump()
    await db.content.insert_one(doc)
    return content_obj

@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    existing = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing:
        return User(**existing)
    
    user_obj = User(**input.model_dump())
    doc = user_obj.model_dump()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update: UserUpdate):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return User(**updated_user)

@api_router.get("/leaderboard", response_model=List[User])
async def get_leaderboard(limit: int = 10):
    users = await db.users.find({}, {"_id": 0}).sort("points", -1).limit(limit).to_list(limit)
    return [User(**u) for u in users]

@api_router.post("/content/like")
async def like_content(action: LikeAction):
    content = await db.content.find_one({"id": action.content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if action.content_id in user.get("liked_content", []):
        return {"message": "Already liked", "points_earned": 0}
    
    await db.content.update_one({"id": action.content_id}, {"$inc": {"likes": 1}})
    await db.users.update_one({"id": action.user_id}, {"$push": {"liked_content": action.content_id}})
    await award_points(action.user_id, 5)
    
    updated_user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if len(updated_user.get("liked_content", [])) >= 10:
        await award_points(action.user_id, 0, "Content Lover")
    
    return {"message": "Content liked", "points_earned": 5}

@api_router.post("/content/share")
async def share_content(action: ShareAction):
    content = await db.content.find_one({"id": action.content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.content.update_one({"id": action.content_id}, {"$inc": {"shares": 1}})
    await award_points(action.user_id, 10, "Social Butterfly" if user["points"] + 10 >= 100 else None)
    
    return {"message": "Content shared", "points_earned": 10}

@api_router.post("/community/messages", response_model=CommunityMessage)
async def post_message(input: CommunityMessageCreate):
    user = await db.users.find_one({"id": input.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    message_obj = CommunityMessage(
        user_id=input.user_id,
        username=user["username"],
        avatar=user["avatar"],
        message=input.message,
        content_id=input.content_id
    )
    
    doc = message_obj.model_dump()
    await db.community_messages.insert_one(doc)
    await award_points(input.user_id, 15)
    
    return message_obj

@api_router.get("/community/messages", response_model=List[CommunityMessage])
async def get_messages(content_id: Optional[str] = None, limit: int = 50):
    query = {"content_id": content_id} if content_id else {"content_id": None}
    messages = await db.community_messages.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [CommunityMessage(**m) for m in reversed(messages)]

@api_router.post("/content/seed")
async def seed_content():
    """Seed comprehensive content for The Connector"""
    await db.content.delete_many({})
    
    # Comprehensive content with proper categories and search-friendly approach
    mock_content = [
        # HERO CAROUSEL Category
        {
            "id": str(uuid.uuid4()),
            "title": "Fighter",
            "category": "hero",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 6.2,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "India's first aerial action film featuring Hrithik Roshan and Deepika Padukone.",
            "release_date": "2024-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Fighter+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Fighter",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Sky is the limit",
            "likes": 3200,
            "shares": 850
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Great Indian Kapil Show",
            "category": "hero",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 7.5,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "Kapil Sharma returns with his hilarious talk show featuring Bollywood celebrities.",
            "release_date": "2024-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=The+Great+Indian+Kapil+Show",
                "twitter": "https://twitter.com/search?q=%23KapilSharmaShow",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "series",
            "tagline": "Laughter unlimited",
            "likes": 2100,
            "shares": 550
        },
        {
            "id": str(uuid.uuid4()),
            "title": "House of the Dragon",
            "category": "hero",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.4,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "The Targaryen civil war continues in this epic Game of Thrones prequel.",
            "release_date": "2024-06",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=House+of+the+Dragon+trailer",
                "twitter": "https://twitter.com/search?q=%23HouseOfTheDragon",
                "reddit": "https://www.reddit.com/r/HouseOfTheDragon"
            },
            "content_type": "series",
            "tagline": "Fire will reign",
            "likes": 5600,
            "shares": 1400
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Slow Horses Season 5",
            "category": "hero",
            "platform": "Apple TV",
            "platform_content_id": None,
            "rating": 8.6,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "The misfit MI5 agents return for another thrilling spy adventure.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Slow+Horses+Season+5",
                "twitter": "https://twitter.com/search?q=%23SlowHorses",
                "reddit": "https://www.reddit.com/r/SlowHorses"
            },
            "content_type": "series",
            "tagline": "Old spies never die",
            "likes": 1800,
            "shares": 420
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Hunt for Veerappan",
            "category": "hero",
            "platform": "Sony Liv",
            "platform_content_id": None,
            "rating": 7.8,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "The true story of India's most wanted bandit and the manhunt that captivated a nation.",
            "release_date": "2023-08",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Hunt+for+Veerappan",
                "twitter": "https://twitter.com/search?q=%23Veerappan",
                "reddit": "https://www.reddit.com/r/IndianWebSeries"
            },
            "content_type": "series",
            "tagline": "The chase that defined a generation",
            "likes": 2400,
            "shares": 640
        },
        # BUZZING NOW Category
        {
            "id": str(uuid.uuid4()),
            "title": "Squid Game Season 2",
            "category": "buzzing",
            "platform": "Netflix",
            "platform_content_id": None,  # Will use search fallback
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "The deadly games return with new players and higher stakes.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Squid+Game+Season+2+trailer",
                "twitter": "https://twitter.com/search?q=%23SquidGame",
                "reddit": "https://www.reddit.com/r/squidgame"
            },
            "content_type": "series",
            "tagline": "Survival of the fittest",
            "likes": 4500,
            "shares": 1200
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mirzapur Season 3",
            "category": "buzzing",
            "platform": "Prime Video",
            "platform_content_id": None,
            "rating": 8.7,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "The battle for Mirzapur intensifies in this gripping finale.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Mirzapur+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23Mirzapur",
                "reddit": "https://www.reddit.com/r/mirzapur"
            },
            "content_type": "series",
            "tagline": "Power ki jung",
            "likes": 3800,
            "shares": 950
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Severance Season 2",
            "category": "buzzing",
            "platform": "Apple TV",
            "platform_content_id": None,
            "rating": 9.1,
            "thumbnail": "https://images.unsplash.com/photo-1542204165-19b4f98b48ed?w=400&h=600&fit=crop",
            "description": "The mind-bending thriller returns with more twists.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Severance+Season+2+trailer",
                "twitter": "https://twitter.com/search?q=%23Severance",
                "reddit": "https://www.reddit.com/r/SeveranceAppleTVPlus"
            },
            "content_type": "series",
            "tagline": "Mind = Blown",
            "likes": 3200,
            "shares": 850
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Scam 2003",
            "category": "buzzing",
            "platform": "SonyLIV",
            "platform_content_id": None,
            "rating": 9.0,
            "thumbnail": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
            "description": "The Telgi stamp paper scam that shook the nation.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Scam+2003+trailer",
                "twitter": "https://twitter.com/search?q=%23Scam2003",
                "reddit": "https://www.reddit.com/r/IndianWebSeries"
            },
            "content_type": "series",
            "tagline": "The stamp of deception",
            "likes": 2900,
            "shares": 780
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Family Man Season 3",
            "category": "buzzing",
            "platform": "Prime Video",
            "platform_content_id": None,
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "Srikant Tiwari is back for more action-packed missions.",
            "release_date": "2025-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=The+Family+Man+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23TheFamilyMan",
                "reddit": "https://www.reddit.com/r/TheFamilyMan"
            },
            "content_type": "series",
            "tagline": "Mission impossible",
            "likes": 3400,
            "shares": 920
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Asur Season 2",
            "category": "buzzing",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.6,
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "description": "The psychological thriller continues with new dark twists.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Asur+Season+2+trailer",
                "twitter": "https://twitter.com/search?q=%23Asur",
                "reddit": "https://www.reddit.com/r/IndianWebSeries"
            },
            "content_type": "series",
            "tagline": "Evil never dies",
            "likes": 2700,
            "shares": 690
        },
        # HOT DROP ALERT Category
        {
            "id": str(uuid.uuid4()),
            "title": "Fighter",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.2,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "India's first aerial action film with Hrithik Roshan.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Fighter+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Fighter",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Sky is the limit",
            "likes": 3100,
            "shares": 840
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Maharaja",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "description": "A barber's search for his stolen dustbin leads to shocking revelations.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Maharaja+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Maharaja",
                "reddit": "https://www.reddit.com/r/kollywood"
            },
            "content_type": "movie",
            "tagline": "Revenge served cold",
            "likes": 2800,
            "shares": 750
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Animal",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 7.9,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "A son's dark journey to protect his father at any cost.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Animal+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Animal",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Unleash the beast",
            "likes": 4200,
            "shares": 1100
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dune Part 2",
            "category": "hot_drop",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "Paul Atreides unites with the Fremen to seek revenge.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Dune+Part+2+trailer",
                "twitter": "https://twitter.com/search?q=%23DunePartTwo",
                "reddit": "https://www.reddit.com/r/dune"
            },
            "content_type": "movie",
            "tagline": "The prophecy is real",
            "likes": 3900,
            "shares": 980
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Salaar",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.3,
            "thumbnail": "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop",
            "description": "A violent saga of friendship, loyalty, and power.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Salaar+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Salaar",
                "reddit": "https://www.reddit.com/r/tollywood"
            },
            "content_type": "movie",
            "tagline": "Fire meets fury",
            "likes": 3600,
            "shares": 910
        },
        {
            "id": str(uuid.uuid4()),
            "title": "12th Fail",
            "category": "hot_drop",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 9.2,
            "thumbnail": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
            "description": "An inspiring story of perseverance and the UPSC dream.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=12th+Fail+trailer",
                "twitter": "https://twitter.com/search?q=%2312thFail",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Restart. Rebuild. Reclaim.",
            "likes": 4100,
            "shares": 1050
        },
        # DOCU SERIES Category
        {
            "id": str(uuid.uuid4()),
            "title": "Drive to Survive Season 6",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.7,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "Behind-the-scenes drama of Formula 1's 2024 season.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Drive+to+Survive+Season+6+trailer",
                "twitter": "https://twitter.com/search?q=%23DriveToSurvive",
                "reddit": "https://www.reddit.com/r/formula1"
            },
            "content_type": "documentary",
            "tagline": "Speed. Drama. Glory.",
            "likes": 3300,
            "shares": 870
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Indian Predator Season 3",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.1,
            "thumbnail": "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop",
            "description": "True crime stories that shocked India.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Indian+Predator+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23IndianPredator",
                "reddit": "https://www.reddit.com/r/TrueCrime"
            },
            "content_type": "documentary",
            "tagline": "The darkest minds",
            "likes": 2600,
            "shares": 680
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Last Dance of Indian Cricket",
            "category": "docu_series",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=600&fit=crop",
            "description": "Legends' final moments in international cricket.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Indian+Cricket+Documentary",
                "twitter": "https://twitter.com/search?q=%23IndianCricket",
                "reddit": "https://www.reddit.com/r/Cricket"
            },
            "content_type": "documentary",
            "tagline": "End of an era",
            "likes": 3700,
            "shares": 940
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Planet Earth III",
            "category": "docu_series",
            "platform": "SonyLIV",
            "platform_content_id": None,
            "rating": 9.5,
            "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
            "description": "Breathtaking journey through Earth's most spectacular habitats.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Planet+Earth+III+trailer",
                "twitter": "https://twitter.com/search?q=%23PlanetEarth",
                "reddit": "https://www.reddit.com/r/Documentaries"
            },
            "content_type": "documentary",
            "tagline": "Nature's masterpiece",
            "likes": 2900,
            "shares": 760
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Beckham Beyond the Field",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.4,
            "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop",
            "description": "The untold story of David Beckham's life and career.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Beckham+Documentary+trailer",
                "twitter": "https://twitter.com/search?q=%23Beckham",
                "reddit": "https://www.reddit.com/r/soccer"
            },
            "content_type": "documentary",
            "tagline": "Icon. Legend. Human.",
            "likes": 3100,
            "shares": 820
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Our Universe",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "An epic cosmic journey narrated by Morgan Freeman.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Our+Universe+Documentary+trailer",
                "twitter": "https://twitter.com/search?q=%23OurUniverse",
                "reddit": "https://www.reddit.com/r/space"
            },
            "content_type": "documentary",
            "tagline": "Infinite wonders",
            "likes": 2800,
            "shares": 730
        },
        # SPORTS Category
        {
            "id": str(uuid.uuid4()),
            "title": "IPL 2025 Live",
            "category": "sports",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 9.3,
            "thumbnail": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=600&fit=crop",
            "description": "The biggest cricket carnival is back with thrilling matches.",
            "release_date": "2025-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=IPL+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23IPL2025",
                "reddit": "https://www.reddit.com/r/Cricket"
            },
            "content_type": "sports_event",
            "tagline": "Cricket fever!",
            "likes": 5200,
            "shares": 1400
        },
        {
            "id": str(uuid.uuid4()),
            "title": "UEFA Champions League",
            "category": "sports",
            "platform": "SonyLIV",
            "platform_content_id": None,
            "rating": 9.4,
            "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop",
            "description": "Europe's elite clubs battle for football supremacy.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=UEFA+Champions+League+highlights",
                "twitter": "https://twitter.com/search?q=%23UCL",
                "reddit": "https://www.reddit.com/r/soccer"
            },
            "content_type": "sports_event",
            "tagline": "Glory awaits",
            "likes": 4800,
            "shares": 1300
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Pro Kabaddi League 2025",
            "category": "sports",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=600&fit=crop",
            "description": "India's indigenous sport at its competitive best.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Pro+Kabaddi+League+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23PKL2025",
                "reddit": "https://www.reddit.com/r/Kabaddi"
            },
            "content_type": "sports_event",
            "tagline": "Raid the night",
            "likes": 3400,
            "shares": 890
        },
        {
            "id": str(uuid.uuid4()),
            "title": "NBA Finals 2025",
            "category": "sports",
            "platform": "Fancode",
            "platform_content_id": None,
            "rating": 9.2,
            "thumbnail": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=600&fit=crop",
            "description": "The ultimate basketball showdown for the championship.",
            "release_date": "2025-06",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=NBA+Finals+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23NBAFinals",
                "reddit": "https://www.reddit.com/r/nba"
            },
            "content_type": "sports_event",
            "tagline": "Hoop dreams",
            "likes": 3800,
            "shares": 970
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Formula 1 Season 2025",
            "category": "sports",
            "platform": "Fancode",
            "platform_content_id": None,
            "rating": 9.1,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "The fastest motorsport returns with new regulations.",
            "release_date": "2025-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Formula+1+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23F1",
                "reddit": "https://www.reddit.com/r/formula1"
            },
            "content_type": "sports_event",
            "tagline": "Speed unleashed",
            "likes": 4200,
            "shares": 1080
        },
        {
            "id": str(uuid.uuid4()),
            "title": "ISL 2025",
            "category": "sports",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.6,
            "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop",
            "description": "Indian Super League brings top football action.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=ISL+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23ISL",
                "reddit": "https://www.reddit.com/r/IndianFootball"
            },
            "content_type": "sports_event",
            "tagline": "Indian football rising",
            "likes": 3100,
            "shares": 810
        }
    ]
    
    # Insert the comprehensive content
    await db.content.insert_many(mock_content)
    
    return {"message": "Content seeded successfully with 24 items across all categories"}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=message.session_id,
            system_message="""You are The Connector's AI guide."""
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=message.message)
        response = await chat.send_message(user_message)
        
        chat_doc = {
            "session_id": message.session_id,
            "user_message": message.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chats.insert_one(chat_doc)
        
        return ChatResponse(response=response, session_id=message.session_id)
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# Include sports routers
api_router.include_router(cricket.router)
api_router.include_router(football.router)
api_router.include_router(sports.router)
api_router.include_router(thesportsdb.router)
api_router.include_router(youtube.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
# QA Report Endpoints
@api_router.get("/download/qa-report")
async def download_qa_report():
    """Download the latest QA report CSV"""
    from fastapi.responses import FileResponse
    import os
    
    file_path = "/app/qa_report_nov25.csv"
    
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename="qa_report_nov25.csv",
            media_type="text/csv"
        )
    else:
        raise HTTPException(status_code=404, detail="QA report not found")


@api_router.get("/download/qa-report-json")
async def download_qa_report_json():
    """Get QA report as JSON for web viewer"""
    import pandas as pd
    import os
    
    file_path = "/app/qa_report_nov25.csv"
    
    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        return df.to_dict(orient='records')
    else:
        raise HTTPException(status_code=404, detail="QA report not found")


@api_router.get("/qa-report-viewer", response_class=HTMLResponse)
async def qa_report_viewer():
    """View QA report in browser"""
    from fastapi.responses import HTMLResponse
    import os
    
    file_path = "/app/backend/qa_report_static.html"
    
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>QA Report not found. Please run ingestion first.</h1>")
