"""
Fresh Content Ingestion System
================================
3-Pillar Strategy:
1. TOP 10 TRENDING (Immediate Priority)
2. NEW ON PLATFORMS (This Week)
3. HIGHLY RATED RECENT (Last 30 Days, Rating > 7.0)

Tech Stack: TMDB API + MongoDB
"""

import os
import asyncio
import requests
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# TMDB Configuration
TMDB_API_KEY = "8c0e8b3bd67c0c7835ca319332855c38"  # Public demo key
TMDB_BASE_URL = "https://api.themoviedb.org/3"

# Platform mapping (TMDB Watch Provider IDs for India)
PLATFORM_MAPPING = {
    8: "Netflix",
    119: "Prime Video", 
    122: "JioHotstar",
    531: "Sony Liv",
    283: "Zee5",
    350: "Apple TV"
}

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.test_database

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")


def make_tmdb_request(endpoint, params=None):
    """Make TMDB API request with error handling"""
    if params is None:
        params = {}
    params['api_key'] = TMDB_API_KEY
    
    try:
        response = requests.get(f"{TMDB_BASE_URL}{endpoint}", params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print_error(f"TMDB API Error: {e}")
        return None


def get_platform_from_providers(providers_data):
    """Extract platform from TMDB watch providers"""
    if not providers_data or 'results' not in providers_data:
        return None
    
    india_data = providers_data['results'].get('IN', {})
    
    # Check flatrate (subscription) providers first
    if 'flatrate' in india_data:
        for provider in india_data['flatrate']:
            provider_id = provider.get('provider_id')
            if provider_id in PLATFORM_MAPPING:
                return PLATFORM_MAPPING[provider_id]
    
    # Check buy/rent providers as fallback
    for key in ['buy', 'rent']:
        if key in india_data:
            for provider in india_data[key]:
                provider_id = provider.get('provider_id')
                if provider_id in PLATFORM_MAPPING:
                    return PLATFORM_MAPPING[provider_id]
    
    return None


def fetch_trending_content(time_window='week', media_type='all'):
    """
    Pillar 1: Fetch trending content
    time_window: 'day' or 'week'
    media_type: 'all', 'movie', or 'tv'
    """
    print_info(f"Fetching trending {media_type} ({time_window})...")
    
    endpoint = f"/trending/{media_type}/{time_window}"
    params = {
        'language': 'en-US',
        'region': 'IN'
    }
    
    data = make_tmdb_request(endpoint, params)
    if data and 'results' in data:
        print_success(f"Found {len(data['results'])} trending items")
        return data['results'][:15]  # Top 15
    return []


def fetch_new_releases(platform_id=None, days_back=7):
    """
    Pillar 2: Fetch new releases on platforms
    """
    print_info(f"Fetching new releases (last {days_back} days)...")
    
    today = datetime.now()
    start_date = (today - timedelta(days=days_back)).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')
    
    results = []
    
    # Fetch movies
    movie_params = {
        'language': 'en-US',
        'region': 'IN',
        'release_date.gte': start_date,
        'release_date.lte': end_date,
        'with_original_language': 'hi|ta|te|ml|kn|en',  # Indian languages + English
        'sort_by': 'popularity.desc',
        'vote_count.gte': 10  # Minimum votes for quality
    }
    
    if platform_id:
        movie_params['with_watch_providers'] = platform_id
        movie_params['watch_region'] = 'IN'
    
    movie_data = make_tmdb_request('/discover/movie', movie_params)
    if movie_data and 'results' in movie_data:
        results.extend(movie_data['results'][:10])
    
    # Fetch TV shows
    tv_params = {
        'language': 'en-US',
        'region': 'IN',
        'first_air_date.gte': start_date,
        'first_air_date.lte': end_date,
        'with_original_language': 'hi|ta|te|ml|kn|en',
        'sort_by': 'popularity.desc',
        'vote_count.gte': 10
    }
    
    if platform_id:
        tv_params['with_watch_providers'] = platform_id
        tv_params['watch_region'] = 'IN'
    
    tv_data = make_tmdb_request('/discover/tv', tv_params)
    if tv_data and 'results' in tv_data:
        results.extend(tv_data['results'][:10])
    
    print_success(f"Found {len(results)} new releases")
    return results


def fetch_highly_rated_recent(days_back=30, min_rating=7.0):
    """
    Pillar 3: Fetch highly rated recent content
    """
    print_info(f"Fetching highly rated content (last {days_back} days, rating ≥ {min_rating})...")
    
    today = datetime.now()
    start_date = (today - timedelta(days=days_back)).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')
    
    results = []
    
    # Fetch movies
    movie_params = {
        'language': 'en-US',
        'region': 'IN',
        'release_date.gte': start_date,
        'release_date.lte': end_date,
        'with_original_language': 'hi|ta|te|ml|kn|en',
        'vote_average.gte': min_rating,
        'vote_count.gte': 50,  # Higher threshold for rated content
        'sort_by': 'vote_average.desc'
    }
    
    movie_data = make_tmdb_request('/discover/movie', movie_params)
    if movie_data and 'results' in movie_data:
        results.extend(movie_data['results'][:15])
    
    # Fetch TV shows
    tv_params = {
        'language': 'en-US',
        'region': 'IN',
        'first_air_date.gte': start_date,
        'first_air_date.lte': end_date,
        'with_original_language': 'hi|ta|te|ml|kn|en',
        'vote_average.gte': min_rating,
        'vote_count.gte': 50,
        'sort_by': 'vote_average.desc'
    }
    
    tv_data = make_tmdb_request('/discover/tv', tv_params)
    if tv_data and 'results' in tv_data:
        results.extend(tv_data['results'][:15])
    
    print_success(f"Found {len(results)} highly rated items")
    return results


def enrich_content_item(item):
    """Enrich content with full TMDB details"""
    media_type = item.get('media_type', 'movie' if 'title' in item else 'tv')
    tmdb_id = item['id']
    
    # Fetch full details
    endpoint = f"/{media_type}/{tmdb_id}"
    params = {
        'language': 'en-US',
        'append_to_response': 'credits,watch/providers'
    }
    
    details = make_tmdb_request(endpoint, params)
    if not details:
        return None
    
    # Extract platform
    providers = details.get('watch/providers', {})
    platform = get_platform_from_providers(providers)
    
    if not platform:
        platform = "Netflix"  # Default fallback
    
    # Build enriched content
    title = details.get('title') or details.get('name', 'Unknown')
    year = None
    if details.get('release_date'):
        year = int(details['release_date'][:4])
    elif details.get('first_air_date'):
        year = int(details['first_air_date'][:4])
    
    enriched = {
        "id": f"tmdb_{media_type}_{tmdb_id}",
        "title": title,
        "platform": platform,
        "content_type": "movie" if media_type == 'movie' else "series",
        "category": "entertainment",
        "year": year,
        "description": details.get('overview', '')[:500],
        "poster_url": f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details.get('poster_path') else "",
        "backdrop_url": f"https://image.tmdb.org/t/p/original{details['backdrop_path']}" if details.get('backdrop_path') else "",
        "genres": [g['name'] for g in details.get('genres', [])][:3],
        "rating": float(details.get('vote_average', 0.0)),
        "release_date": details.get('release_date') or details.get('first_air_date'),
        "thumbnail": f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details.get('poster_path') else "",
        "likes": 0,
        "shares": 0,
        "tmdb_id": tmdb_id,
        "ingestion_date": datetime.utcnow().isoformat(),
        "freshness_score": calculate_freshness_score(details)
    }
    
    return enriched


def calculate_freshness_score(details):
    """Calculate freshness score based on recency and rating"""
    # Get release date
    release_date_str = details.get('release_date') or details.get('first_air_date')
    if not release_date_str:
        return 50
    
    try:
        release_date = datetime.strptime(release_date_str, '%Y-%m-%d')
        days_old = (datetime.now() - release_date).days
        
        # Recency score (0-50): newer = higher
        recency_score = max(0, 50 - (days_old / 2))
        
        # Rating score (0-50): higher rating = higher score
        rating = details.get('vote_average', 0)
        rating_score = (rating / 10) * 50
        
        return int(recency_score + rating_score)
    except:
        return 50


async def ingest_content_batch(content_items):
    """Ingest content batch into MongoDB"""
    if not content_items:
        return 0
    
    inserted = 0
    skipped = 0
    
    for item in content_items:
        try:
            # Check if already exists
            existing = await db.content.find_one({"id": item['id']})
            if existing:
                skipped += 1
                continue
            
            await db.content.insert_one(item)
            inserted += 1
            print_success(f"Ingested: {item['title']} ({item['platform']})")
        except Exception as e:
            print_error(f"Failed to ingest {item.get('title', 'Unknown')}: {e}")
    
    return inserted, skipped


async def main():
    """Main execution"""
    print_header("FRESH CONTENT INGESTION SYSTEM")
    print_info("3-Pillar Strategy: Trending + New Releases + Highly Rated")
    
    all_content = []
    seen_ids = set()
    
    # PILLAR 1: Top 10 Trending (Priority)
    print_header("PILLAR 1: TOP 10 TRENDING")
    trending = fetch_trending_content(time_window='week', media_type='all')
    
    # PILLAR 2: New Releases (This Week)
    print_header("PILLAR 2: NEW ON PLATFORMS")
    new_releases = fetch_new_releases(days_back=7)
    
    # PILLAR 3: Highly Rated Recent (Last 30 Days)
    print_header("PILLAR 3: HIGHLY RATED RECENT")
    highly_rated = fetch_highly_rated_recent(days_back=30, min_rating=7.0)
    
    # Combine and deduplicate
    raw_items = trending + new_releases + highly_rated
    print_info(f"Total raw items: {len(raw_items)}")
    
    # Enrich and filter
    print_header("ENRICHING CONTENT")
    for item in raw_items:
        item_id = item['id']
        if item_id in seen_ids:
            continue
        seen_ids.add(item_id)
        
        enriched = enrich_content_item(item)
        if enriched and enriched.get('poster_url'):
            all_content.append(enriched)
    
    print_success(f"Enriched {len(all_content)} unique items")
    
    # Ingest into MongoDB
    print_header("INGESTING INTO DATABASE")
    inserted, skipped = await ingest_content_batch(all_content)
    
    # Final Report
    print_header("INGESTION COMPLETE")
    print_success(f"✅ New titles added: {inserted}")
    print_warning(f"⏭️  Duplicates skipped: {skipped}")
    print_info(f"📊 Total unique items processed: {len(all_content)}")
    
    # Get total count in DB
    total_in_db = await db.content.count_documents({})
    print_success(f"🗄️  Total titles in catalog: {total_in_db}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
