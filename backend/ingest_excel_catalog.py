"""
Excel Catalog Ingestion Script
Enriches titles from Excel with TMDB + OMDb metadata and safely inserts into MongoDB

Usage:
    # Dry run (no DB writes, generates QA report only)
    python ingest_excel_catalog.py --file /path/to/excel.xlsx --dry-run
    
    # Production run (writes to MongoDB)
    python ingest_excel_catalog.py --file /path/to/excel.xlsx
"""

import argparse
import asyncio
import re
import logging
import pandas as pd
import httpx
import os
from datetime import datetime, timezone
from typing import Optional, Dict, List, Tuple
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from difflib import SequenceMatcher
import uuid

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/ingestion_logs/nov25_run.log'),
        logging.StreamHandler()
    ]
)

# API Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
OMDB_API_KEY = os.environ.get('OMDB_API_KEY')
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Platform Mapping
PLATFORM_MAPPING = {
    'JioHotstar': 'jiohotstar',
    'Netflix': 'netflix',
    'Prime': 'prime_video',
    'Prime Video': 'prime_video',
    'SonyLIV': 'sonyliv',
    'Sony LIV': 'sonyliv',
    'Zee5': 'zee5',
    'Zee 5': 'zee5',
    'Aha': 'aha',
    'Appletv': 'apple_tv',
    'Apple TV': 'apple_tv',
    'Apple TV+': 'apple_tv',
    'Dazn': 'dazn'
}


def normalize_platform(platform_raw: str) -> str:
    """Normalize platform name to internal enum"""
    if not platform_raw:
        return 'unknown'
    return PLATFORM_MAPPING.get(platform_raw, platform_raw.lower().replace(' ', '_'))


def parse_excel_row(title_str: str, release_date_str: str) -> Dict:
    """
    Parse Excel row into structured data
    
    Input: 
        "* Stranger Things S5 Vol 1 (Netflix)", "26-Nov'25"
    
    Output: {
        'original_title': '* Stranger Things S5 Vol 1 (Netflix)',
        'title': 'Stranger Things',
        'platform': 'netflix',
        'season': 5,
        'volume': 1,
        'release_date': datetime(2025, 11, 26),
        'year': 2025
    }
    """
    if not title_str:
        return None
    
    # Strip leading markers and whitespace
    title_str = str(title_str).strip().lstrip('*').strip()
    
    # Extract platform (text in parentheses at end)
    platform_match = re.search(r'\(([^)]+)\)$', title_str)
    platform_raw = platform_match.group(1) if platform_match else None
    platform = normalize_platform(platform_raw)
    
    # Remove platform portion
    base_title = re.sub(r'\s*\([^)]+\)$', '', title_str).strip()
    
    # Extract season/volume
    season_match = re.search(r'\bS(\d+)\b', base_title, re.I)
    volume_match = re.search(r'\bVol(?:ume)?\s*(\d+)\b', base_title, re.I)
    
    season = int(season_match.group(1)) if season_match else None
    volume = int(volume_match.group(1)) if volume_match else None
    
    # Clean title (remove season/volume markers)
    clean_title = re.sub(r'\s*\bS\d+\b', '', base_title, flags=re.I)
    clean_title = re.sub(r'\s*\bVol(?:ume)?\s*\d+\b', '', clean_title, flags=re.I)
    clean_title = clean_title.strip()
    
    # Parse release date
    release_date = None
    year = None
    if release_date_str and str(release_date_str).strip():
        try:
            # Handle "26-Nov'25" format
            date_clean = str(release_date_str).replace('Release Date:', '').strip()
            
            # Try multiple date formats
            for fmt in ["%d-%b'%y", "%d-%b-%y", "%d-%b-%Y", "%Y-%m-%d"]:
                try:
                    release_date = datetime.strptime(date_clean, fmt)
                    year = release_date.year
                    break
                except:
                    continue
        except Exception as e:
            logging.warning(f"Could not parse date '{release_date_str}': {e}")
    
    return {
        'original_title': title_str,
        'title': clean_title,
        'platform': platform,
        'season': season,
        'volume': volume,
        'release_date': release_date,
        'year': year
    }


def compute_similarity(str1: str, str2: str) -> float:
    """Compute string similarity ratio (0-1)"""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()


async def search_tmdb_tv(title: str, year: Optional[int], api_key: str) -> List[Dict]:
    """Search TMDB for TV series"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            params = {
                'api_key': api_key,
                'query': title,
                'include_adult': 'false'
            }
            if year:
                params['first_air_date_year'] = year
            
            response = await client.get('https://api.themoviedb.org/3/search/tv', params=params)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                # Add media_type to each result
                for r in results:
                    r['media_type'] = 'tv'
                return results
            else:
                logging.error(f"TMDB TV search failed: {response.status_code}")
                return []
    except Exception as e:
        logging.error(f"TMDB TV search error: {e}")
        return []


async def search_tmdb_movie(title: str, year: Optional[int], api_key: str) -> List[Dict]:
    """Search TMDB for movies"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            params = {
                'api_key': api_key,
                'query': title,
                'include_adult': 'false'
            }
            if year:
                params['year'] = year
            
            response = await client.get('https://api.themoviedb.org/3/search/movie', params=params)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                # Add media_type to each result
                for r in results:
                    r['media_type'] = 'movie'
                return results
            else:
                logging.error(f"TMDB movie search failed: {response.status_code}")
                return []
    except Exception as e:
        logging.error(f"TMDB movie search error: {e}")
        return []


def calculate_confidence(results: List[Dict], original_title: str, year: Optional[int], season: Optional[int]) -> Tuple[str, Optional[Dict]]:
    """
    Calculate confidence score for TMDB match
    
    Returns: ('high'|'medium'|'low', best_match_dict)
    """
    if not results:
        return 'low', None
    
    best = results[0]
    title_similarity = compute_similarity(original_title, best.get('name') or best.get('title', ''))
    
    # Get year from result
    result_year = None
    if 'release_date' in best and best['release_date']:
        result_year = int(best['release_date'][:4])
    elif 'first_air_date' in best and best['first_air_date']:
        result_year = int(best['first_air_date'][:4])
    
    year_diff = abs(result_year - year) if (result_year and year) else 999
    
    # Confidence scoring
    if title_similarity > 0.9 and year_diff <= 1:
        return 'high', best
    elif title_similarity > 0.75 and year_diff <= 2:
        return 'medium', best
    elif title_similarity > 0.6:
        return 'low', best
    else:
        return 'low', None


async def get_imdb_id_from_tmdb(tmdb_id: int, media_type: str, api_key: str) -> Optional[str]:
    """Get IMDb ID from TMDB using external_ids endpoint"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            endpoint = f"https://api.themoviedb.org/3/{media_type}/{tmdb_id}/external_ids"
            response = await client.get(endpoint, params={'api_key': api_key})
            
            if response.status_code == 200:
                data = response.json()
                return data.get('imdb_id')
            else:
                logging.warning(f"Failed to get IMDb ID for TMDB {media_type} {tmdb_id}")
                return None
    except Exception as e:
        logging.error(f"Error fetching IMDb ID: {e}")
        return None


async def fetch_omdb(imdb_id: str, api_key: str) -> Optional[Dict]:
    """Fetch data from OMDb using IMDb ID"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                'http://www.omdbapi.com/',
                params={'i': imdb_id, 'apikey': api_key}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logging.warning(f"OMDb fetch failed for {imdb_id}")
                return None
    except Exception as e:
        logging.error(f"OMDb fetch error: {e}")
        return None


async def fetch_tmdb_credits(tmdb_id: int, media_type: str, api_key: str) -> Dict:
    """Fetch cast/crew credits from TMDB"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            endpoint = f"https://api.themoviedb.org/3/{media_type}/{tmdb_id}/credits"
            response = await client.get(endpoint, params={'api_key': api_key})
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'cast': [], 'crew': []}
    except Exception as e:
        logging.error(f"Error fetching credits: {e}")
        return {'cast': [], 'crew': []}


async def fetch_tmdb_season(tmdb_id: int, season_number: int, api_key: str) -> Dict:
    """Fetch season details from TMDB"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            endpoint = f"https://api.themoviedb.org/3/tv/{tmdb_id}/season/{season_number}"
            response = await client.get(endpoint, params={'api_key': api_key})
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'episodes': []}
    except Exception as e:
        logging.error(f"Error fetching season details: {e}")
        return {'episodes': []}


async def enrich_title(parsed_data: Dict, tmdb_api_key: str, omdb_api_key: str) -> Dict:
    """
    Enrich parsed Excel data with TMDB + OMDb metadata
    
    Returns: {
        'tmdb_match': {...},
        'omdb_data': {...},
        'imdb_id': str,
        'imdb_rating': float,
        'tmdb_rating': float,
        'confidence': 'high'|'medium'|'low',
        'status': 'ok'|'needs_review',
        'match_reason': str
    }
    """
    title = parsed_data['title']
    year = parsed_data['year']
    season = parsed_data['season']
    volume = parsed_data['volume']
    
    # Initialize all variables at the top for safety
    tmdb_match = None
    omdb_data = None
    imdb_id = None
    imdb_rating = None
    tmdb_rating = None
    confidence = 'low'
    status = 'needs_review'
    match_reason = 'No match found'
    
    # Step 1: Determine content type
    is_series = season is not None or volume is not None
    
    # Step 2: TMDB Search
    try:
        if is_series:
            tmdb_results = await search_tmdb_tv(title, year, tmdb_api_key)
            media_type = 'tv'
        else:
            # Search both TV and movies
            tv_results = await search_tmdb_tv(title, year, tmdb_api_key)
            movie_results = await search_tmdb_movie(title, year, tmdb_api_key)
            tmdb_results = tv_results + movie_results
            media_type = None  # Will be determined from best match
        
        # Step 3: Confidence Scoring
        if tmdb_results:
            confidence, tmdb_match = calculate_confidence(tmdb_results, title, year, season)
            
            if tmdb_match:
                # Ensure media_type is set
                if media_type is None:
                    media_type = tmdb_match.get('media_type', 'movie')
                else:
                    tmdb_match['media_type'] = media_type
                
                match_reason = f"Title match + year proximity (confidence: {confidence})"
                status = 'ok' if confidence == 'high' else 'needs_review'
                
                # Get ratings
                tmdb_rating = tmdb_match.get('vote_average')
                
                # Get IMDb rating via OMDb safely
                imdb_id = await get_imdb_id_from_tmdb(
                    tmdb_match['id'], 
                    tmdb_match['media_type'],
                    tmdb_api_key
                )
                
                if imdb_id:
                    try:
                        omdb_data = await fetch_omdb(imdb_id, omdb_api_key)
                        if omdb_data:
                            imdb_rating_raw = omdb_data.get('imdbRating')
                            if imdb_rating_raw and imdb_rating_raw != 'N/A':
                                imdb_rating = float(imdb_rating_raw)
                    except Exception as e:
                        logging.warning(f"OMDb fetch failed for {imdb_id}: {e}")
                        omdb_data = None
    
    except Exception as e:
        logging.error(f"Error enriching {title}: {e}")
        match_reason = f"Error during enrichment: {str(e)}"
    
    # Return all variables guaranteed initialized
    return {
        'tmdb_match': tmdb_match,
        'omdb_data': omdb_data,
        'imdb_id': imdb_id,
        'imdb_rating': imdb_rating,
        'tmdb_rating': tmdb_rating,
        'confidence': confidence,
        'status': status,
        'match_reason': match_reason
    }


async def map_tmdb_to_content(tmdb_data: Dict, omdb_data: Optional[Dict], parsed_excel: Dict, 
                               enrichment_data: Dict, tmdb_api_key: str, batch_name: str, default_year: int) -> Dict:
    """
    Map TMDB/OMDb data to Content schema with season-aware fields
    Matches canonical JSON schema exactly
    
    Field Mapping:
    - title: Canonical series/movie name (e.g., "Indian Idol", "Squid Game")
    - series_title: Mirrors title for series, None for movies
    - display_title: Computed for S2+ (e.g., "Indian Idol – Season 16"), None otherwise
    - content_type: 'movie' or 'series'
    - year: User-facing year for sorting/filtering
        * Movies: release_year
        * Series S1: series_start_year
        * Series S2+: season_year (from Excel or default_year)
    - series_start_year: Original air year from TMDB (series only)
    - season: Season number from Excel
    - season_year: Year this season released (S2+ only)
    - season_release_date: ISO date from Excel if available
    - is_new_season: True ONLY for season > 1 (False for movies, S1, None)
    - freshness_batch: Batch identifier (e.g., "nov25")
    - episodes: Episode count from TMDB season endpoint
    """
    is_tv = tmdb_data.get('media_type') == 'tv' or 'first_air_date' in tmdb_data
    tmdb_id = tmdb_data['id']
    media_type = 'tv' if is_tv else 'movie'
    
    # Get canonical title
    canonical_title = tmdb_data.get('title') or tmdb_data.get('name')
    
    # Fetch additional data
    credits = await fetch_tmdb_credits(tmdb_id, media_type, tmdb_api_key)
    
    # Build cast array with full structure: {name, character, profile_url}
    cast = []
    for actor in credits.get('cast', [])[:10]:  # Get top 10 cast
        cast.append({
            'name': actor.get('name', ''),
            'character': actor.get('character', ''),
            'profile_url': f"https://image.tmdb.org/t/p/w185{actor['profile_path']}" if actor.get('profile_path') else None
        })
    
    # Build crew structure
    crew = {'directors': [], 'writers': []}
    for person in credits.get('crew', []):
        if person.get('job') == 'Director':
            crew['directors'].append(person.get('name', ''))
        elif person.get('job') in ['Writer', 'Screenplay']:
            crew['writers'].append(person.get('name', ''))
    
    # Season logic
    season_number = parsed_excel.get('season')
    
    # Get episode count for TV series with season
    episodes = None
    if is_tv and season_number:
        season_details = await fetch_tmdb_season(tmdb_id, season_number, tmdb_api_key)
        episodes = len(season_details.get('episodes', []))
    
    # Extract series_start_year safely (for TV series)
    series_start_year = None
    if is_tv:
        if 'first_air_date' in tmdb_data and tmdb_data['first_air_date']:
            series_start_year = int(tmdb_data['first_air_date'][:4])
    
    # Compute season_year (for new seasons)
    season_year = None
    season_release_date = None
    
    if season_number and season_number > 1:
        # This is a new season
        if parsed_excel.get('release_date'):
            season_release_date = parsed_excel['release_date'].isoformat()
            season_year = parsed_excel['release_date'].year
        else:
            # Missing date: use default_year from batch
            season_year = default_year
            logging.info(f"Missing date for {canonical_title} S{season_number}: defaulting season_year={default_year}")
    
    # Compute is_new_season (ONLY True for S2+)
    is_new_season = False
    if season_number and season_number > 1:
        is_new_season = True
    
    # Compute display_title (ONLY for new seasons)
    display_title = None
    if is_new_season:
        display_title = f"{canonical_title} – Season {season_number}"
    
    # Compute user-facing year
    # Movies: release_year
    # Series S1 or None: series_start_year
    # Series S2+: season_year
    if not is_tv:
        # Movie
        if 'release_date' in tmdb_data and tmdb_data['release_date']:
            year = int(tmdb_data['release_date'][:4])
        else:
            year = parsed_excel.get('year') or default_year
    else:
        # Series
        if is_new_season:
            # New season: use season_year
            year = season_year
        else:
            # S1 or no season: use series_start_year
            year = series_start_year or parsed_excel.get('year') or default_year
    
    # Get release date
    release_date_iso = None
    if parsed_excel.get('release_date'):
        release_date_iso = parsed_excel['release_date'].strftime('%Y-%m')
    elif not is_tv and tmdb_data.get('release_date'):
        release_date_iso = tmdb_data['release_date'][:7]  # YYYY-MM
    elif is_tv and tmdb_data.get('first_air_date'):
        release_date_iso = tmdb_data['first_air_date'][:7]  # YYYY-MM
    
    # Platform handling - match existing DB display names exactly
    platform_str = parsed_excel['platform']
    if platform_str == 'jiohotstar':
        platform_display = 'JioHotstar'
    elif platform_str == 'netflix':
        platform_display = 'Netflix'
    elif platform_str == 'prime_video':
        platform_display = 'Prime Video'
    elif platform_str == 'sonyliv':
        platform_display = 'SonyLIV'
    elif platform_str == 'zee5':
        platform_display = 'Zee5'
    elif platform_str == 'aha':
        platform_display = 'Aha'
    elif platform_str == 'apple_tv':
        platform_display = 'Apple TV'
    elif platform_str == 'dazn':
        platform_display = 'Dazn'
    else:
        platform_display = platform_str.title()
    
    # Social links structure
    search_query = canonical_title.replace(' ', '+')
    social_links = {
        'youtube': f"https://www.youtube.com/results?search_query={search_query}",
        'twitter': f"https://twitter.com/search?q=%23{canonical_title.replace(' ', '')}",
        'reddit': f"https://www.reddit.com/r/{canonical_title.replace(' ', '')}"
    }
    
    # Poster and backdrop paths
    poster_path = f"https://image.tmdb.org/t/p/w500{tmdb_data['poster_path']}" if tmdb_data.get('poster_path') else None
    backdrop_path = f"https://image.tmdb.org/t/p/original{tmdb_data['backdrop_path']}" if tmdb_data.get('backdrop_path') else None
    
    # Streaming platforms structure
    streaming_platforms = [{
        'platform_name': platform_display,
        'platform_logo': None,
        'type': 'flatrate'
    }]
    
    # Extract genres (need genre names, not IDs - for now use IDs)
    genres = [str(g) for g in tmdb_data.get('genre_ids', [])]
    
    # Get language
    language = omdb_data.get('Language', 'English') if omdb_data else 'English'
    if ',' in language:
        language = language.split(',')[0].strip()
    
    # Get runtime
    runtime = None
    if omdb_data and omdb_data.get('Runtime') and omdb_data['Runtime'] != 'N/A':
        runtime_str = omdb_data['Runtime'].replace(' min', '').strip()
        try:
            runtime = int(runtime_str)
        except:
            runtime = None
    
    # Get IMDb votes
    imdb_votes = None
    if omdb_data and omdb_data.get('imdbVotes') and omdb_data['imdbVotes'] != 'N/A':
        imdb_votes = omdb_data['imdbVotes']
    
    # Tagline
    tagline = f"Season {season_number}" if is_new_season else None
    
    # Rating and source (match existing DB schema)
    # Primary rating: IMDb if available, otherwise TMDB
    imdb_rating_value = enrichment_data.get('imdb_rating')
    tmdb_rating_value = enrichment_data.get('tmdb_rating')
    
    if imdb_rating_value:
        rating = imdb_rating_value
        rating_source = 'imdb'
    elif tmdb_rating_value:
        rating = tmdb_rating_value
        rating_source = 'tmdb'
    else:
        rating = 0
        rating_source = 'tmdb'
    
    # Category assignment (match existing DB categories)
    # Assign based on rating and content type
    # hero: high-rated content (8.0+)
    # buzzing: very high-rated (8.5+) or popular series
    # hot_drop: new seasons with high ratings (7.5+)
    # entertainment: default
    
    if rating >= 8.5:
        category = 'buzzing'
    elif is_new_season and rating >= 7.5:
        category = 'hot_drop'
    elif rating >= 8.0:
        category = 'hero'
    else:
        category = 'entertainment'
    
    # Build content object matching existing DB schema EXACTLY
    content = {
        # IDs
        'id': str(uuid.uuid4()),
        
        # Title fields
        'title': canonical_title,
        'series_title': canonical_title if is_tv else None,
        'display_title': display_title,
        'normalized_title': canonical_title,
        
        # Category and type
        'category': category,
        'content_type': 'series' if is_tv else 'movie',
        
        # Platform (SINGLE STRING, not array)
        'platform': platform_display,
        'platform_content_id': None,
        
        # Rating
        'rating': rating,
        
        # Images
        'thumbnail': poster_path,
        'poster_path': poster_path,
        'poster_url': poster_path,
        'backdrop_path': backdrop_path,
        
        # Description
        'description': tmdb_data.get('overview', 'No description available'),
        'tagline': tagline,
        
        # Release info
        'release_date': release_date_iso,
        
        # Social
        'social_links': social_links,
        'likes': 0,
        'shares': 0,
        
        # Cast and crew (CORRECT STRUCTURE)
        'cast': cast,
        'crew': crew,
        
        # Episode and season info
        'episodes': episodes,
        'genres': genres,
        'seasons': season_number if is_tv else None,
        'season': season_number,
        
        # IDs
        'imdb_id': enrichment_data.get('imdb_id'),
        'tmdb_id': tmdb_id,
        'watchmode_id': None,
        
        # Ratings
        'imdb_rating': enrichment_data.get('imdb_rating'),
        'imdb_votes': imdb_votes,
        'rating_source': rating_source,
        'vote_average': enrichment_data.get('tmdb_rating'),
        'vote_count': tmdb_data.get('vote_count', 0),
        
        # Language and runtime
        'language': language,
        'runtime': runtime,
        
        # Year fields (user-facing year for sorting/filtering)
        'year': year,
        'series_start_year': series_start_year,
        'season_year': season_year,
        'season_release_date': season_release_date,
        'is_new_season': is_new_season,
        
        # Freshness tracking
        'freshness_batch': batch_name,
        
        # Streaming
        'streaming_platforms': streaming_platforms,
        'providers_in': [platform_display],
        
        # Trailer
        'trailer_url': None,
        
        # Timestamps
        'last_enriched': datetime.now(timezone.utc).isoformat()
    }
    
    return content


async def safe_upsert_content(new_content: Dict, db, dry_run: bool = False) -> Dict:
    """
    Insert-only strategy to avoid overwrites
    
    Primary Key Strategy: tmdb_id + season (for series) OR tmdb_id alone (for movies)
    
    Logic:
    1. If tmdb_id + season exists → Skip (don't overwrite)
    2. Check for possible duplicates (same title + year + platform, no tmdb_id)
    3. If no match found → Insert new
    
    Returns: {
        'action': 'inserted'|'skipped',
        'id': str,
        'possible_duplicate': 'Yes'|'No',
        'reason': str
    }
    """
    if dry_run:
        return {
            'action': 'dry_run',
            'id': 'N/A',
            'possible_duplicate': 'N/A',
            'reason': 'Dry run mode - no DB writes'
        }
    
    # Check for existing entry by tmdb_id + season
    query = {'tmdb_id': new_content['tmdb_id']}
    if new_content.get('season'):
        query['season'] = new_content['season']
    
    existing_by_tmdb = await db.content.find_one(query)
    
    if existing_by_tmdb:
        logging.info(f"⚠️  SKIPPING: {new_content['title']} - Already exists with tmdb_id={new_content['tmdb_id']}, season={new_content.get('season')}")
        return {
            'action': 'skipped',
            'id': str(existing_by_tmdb['id']),
            'possible_duplicate': 'No',
            'reason': 'duplicate_tmdb_id'
        }
    
    # Check for possible duplicates (manual entries without tmdb_id)
    possible_duplicate = 'No'
    duplicate_reason = None
    
    duplicate_query = {
        'title': {'$regex': f'^{re.escape(new_content["title"])}', '$options': 'i'},
        'year': new_content.get('year'),
        'platform': new_content.get('platform')
    }
    
    existing_by_metadata = await db.content.find_one(duplicate_query)
    
    if existing_by_metadata and not existing_by_metadata.get('tmdb_id'):
        possible_duplicate = 'Yes'
        duplicate_reason = f"Matches existing manual entry (id={existing_by_metadata['id']})"
        logging.warning(f"⚠️  POSSIBLE DUPLICATE: {new_content['title']} matches existing manual entry (id={existing_by_metadata['id']})")
    
    # Add timestamps (id already generated in map_tmdb_to_content)
    new_content['created_at'] = datetime.now(timezone.utc).isoformat()
    new_content['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Insert into MongoDB
    await db.content.insert_one(new_content)
    logging.info(f"✅ INSERTED: {new_content['title']} (id={new_content['id']})")
    
    return {
        'action': 'inserted',
        'id': new_content['id'],
        'possible_duplicate': possible_duplicate,
        'reason': duplicate_reason
    }


def generate_qa_report(ingestion_results: List[Dict], output_path: str):
    """
    Generate QA report CSV with safe None handling
    
    Columns:
    - Original Excel Title
    - Parsed Title
    - Platform (Normalized)
    - Season / Volume
    - Release Year (Excel)
    - TMDB Match Found
    - TMDB Title / Year
    - Year Mismatch
    - Confidence
    - IMDb Rating Found
    - Status
    - Action Taken
    - Possible Duplicate
    """
    rows = []
    
    for result in ingestion_results:
        # Safe extraction of excel year
        excel_year = result['parsed'].get('year')
        
        # Safe extraction of TMDB year
        tmdb_year = None
        if result.get('tmdb_match'):
            tmdb_match = result['tmdb_match']
            if 'release_date' in tmdb_match and tmdb_match['release_date']:
                try:
                    tmdb_year = int(tmdb_match['release_date'][:4])
                except:
                    pass
            elif 'first_air_date' in tmdb_match and tmdb_match['first_air_date']:
                try:
                    tmdb_year = int(tmdb_match['first_air_date'][:4])
                except:
                    pass
        
        # Compute year mismatch safely
        year_mismatch = 'Unknown'
        if excel_year and tmdb_year:
            year_mismatch = 'Yes' if abs(tmdb_year - excel_year) > 1 else 'No'
        elif not excel_year:
            year_mismatch = 'Excel year missing'
        elif not tmdb_year:
            year_mismatch = 'TMDB year missing'
        
        # Get display_title and is_new_season from result if available
        display_title = 'N/A'
        is_new_season = 'N/A'
        computed_year = 'N/A'
        
        if result.get('content_data'):
            display_title = result['content_data'].get('display_title') or result['content_data'].get('title', 'N/A')
            is_new_season = 'Yes' if result['content_data'].get('is_new_season') else 'No'
            computed_year = result['content_data'].get('year', 'N/A')
        
        rows.append({
            'Original Excel Title': result['original_title'],
            'Parsed Title': result['parsed']['title'],
            'Display Title': display_title,
            'Platform (Normalized)': result['parsed']['platform'],
            'Season': result['parsed'].get('season', 'N/A'),
            'Is New Season': is_new_season,
            'Release Year (Excel)': excel_year or 'Missing',
            'TMDB Match Found': 'Yes' if result.get('tmdb_match') else 'No',
            'TMDB Title': result['tmdb_match']['title'] if result.get('tmdb_match') and 'title' in result['tmdb_match'] else (result['tmdb_match']['name'] if result.get('tmdb_match') else 'N/A'),
            'TMDB Year': tmdb_year or 'N/A',
            'Computed Year (Final)': computed_year,
            'Year Mismatch': year_mismatch,
            'Confidence': result.get('confidence', 'N/A'),
            'IMDb Rating Found': 'Yes' if result.get('imdb_rating') else 'No',
            'IMDb Rating': result.get('imdb_rating') or 'N/A',
            'Status': result.get('status', 'N/A'),
            'Action Taken': result.get('db_action', {}).get('action', 'N/A'),
            'Possible Duplicate': result.get('db_action', {}).get('possible_duplicate', 'N/A'),
            'Match Reason': result.get('match_reason', 'N/A')
        })
    
    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    logging.info(f"✅ QA Report saved to {output_path}")
    
    # Print summary
    print("\n" + "="*80)
    print("📊 INGESTION SUMMARY")
    print("="*80)
    print(f"Total titles processed: {len(rows)}")
    print(f"TMDB matches found: {sum(1 for r in rows if r['TMDB Match Found'] == 'Yes')}")
    print(f"IMDb ratings found: {sum(1 for r in rows if r['IMDb Rating Found'] == 'Yes')}")
    print(f"High confidence matches: {sum(1 for r in rows if r['Confidence'] == 'high')}")
    print(f"Needs review: {sum(1 for r in rows if r['Status'] == 'needs_review')}")
    print(f"Inserted: {sum(1 for r in rows if r['Action Taken'] == 'inserted')}")
    print(f"Skipped (duplicates): {sum(1 for r in rows if r['Action Taken'] == 'skipped')}")
    print(f"Possible duplicates flagged: {sum(1 for r in rows if r['Possible Duplicate'] == 'Yes')}")
    print("="*80 + "\n")
    
    return df


async def process_excel_file(file_path: str, dry_run: bool = False, batch_name: str = 'nov25', default_year: int = 2025):
    """
    Main processing function
    
    Steps:
    1. Load Excel file
    2. Parse each row
    3. Enrich with TMDB + OMDb
    4. Map to Content schema (with season-aware fields)
    5. Safe upsert to MongoDB (if not dry-run)
    6. Generate QA report
    
    Parameters:
    - batch_name: Identifier for this ingestion batch (e.g., 'nov25', 'dec25')
    - default_year: Default year for entries with missing dates (e.g., 2025)
    """
    logging.info(f"Starting ingestion from {file_path} (dry_run={dry_run}, batch={batch_name}, default_year={default_year})")
    
    # Load Excel
    try:
        df = pd.read_excel(file_path)
        logging.info(f"Loaded {len(df)} rows from Excel")
    except Exception as e:
        logging.error(f"Failed to load Excel file: {e}")
        return
    
    # Connect to MongoDB (if not dry-run)
    db = None
    if not dry_run:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        logging.info(f"Connected to MongoDB: {DB_NAME}")
    
    # Process each row
    results = []
    
    for idx, row in df.iterrows():
        try:
            # Parse Excel row
            title_col = row.iloc[0] if len(row) > 0 else None
            date_col = row.iloc[1] if len(row) > 1 else None
            
            parsed = parse_excel_row(title_col, date_col)
            
            if not parsed or not parsed['title']:
                logging.warning(f"Row {idx}: Could not parse - skipping")
                continue
            
            logging.info(f"Processing [{idx+1}/{len(df)}]: {parsed['title']}")
            
            # Enrich with TMDB + OMDb
            enrichment = await enrich_title(parsed, TMDB_API_KEY, OMDB_API_KEY)
            
            # Prepare result object
            result = {
                'original_title': parsed['original_title'],
                'parsed': parsed,
                'tmdb_match': enrichment['tmdb_match'],
                'imdb_rating': enrichment['imdb_rating'],
                'tmdb_rating': enrichment['tmdb_rating'],
                'confidence': enrichment['confidence'],
                'status': enrichment['status'],
                'match_reason': enrichment['match_reason']
            }
            
            # Map to Content schema and insert (if TMDB match found)
            if enrichment['tmdb_match']:
                content = await map_tmdb_to_content(
                    enrichment['tmdb_match'],
                    enrichment['omdb_data'],
                    parsed,
                    enrichment,
                    TMDB_API_KEY,
                    batch_name,
                    default_year
                )
                
                # Store content data in result for QA report
                result['content_data'] = content
                
                db_action = await safe_upsert_content(content, db, dry_run)
                result['db_action'] = db_action
            else:
                result['db_action'] = {
                    'action': 'no_match',
                    'id': 'N/A',
                    'possible_duplicate': 'N/A',
                    'reason': 'No TMDB match found'
                }
            
            results.append(result)
            
        except Exception as e:
            logging.error(f"Row {idx} failed: {e}")
            continue
    
    # Generate QA report
    output_path = '/app/qa_report_nov25.csv'
    generate_qa_report(results, output_path)
    
    logging.info(f"✅ Ingestion complete! Processed {len(results)} titles")
    
    if not dry_run:
        client.close()


def main():
    parser = argparse.ArgumentParser(description='Excel Catalog Ingestion Script')
    parser.add_argument('--file', required=True, help='Path to Excel file')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode (no DB writes)')
    parser.add_argument('--batch-name', default='nov25', help='Batch identifier (e.g., nov25, dec25)')
    parser.add_argument('--default-year', type=int, default=2025, help='Default year for entries with missing dates')
    
    args = parser.parse_args()
    
    # Create logs directory if not exists
    Path('/app/ingestion_logs').mkdir(exist_ok=True)
    
    # Run async process with batch parameters
    asyncio.run(process_excel_file(args.file, args.dry_run, args.batch_name, args.default_year))


if __name__ == '__main__':
    main()
