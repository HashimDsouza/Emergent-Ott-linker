"""
November 2025 Fresh Content Ingestion
======================================
Strategy: Fetch latest trending content from TMDB with 60-40 international-Indian balance

Key Features:
- Fetch top 10 titles for Netflix, Prime Video, Disney+, etc.
- Search for specific Nov 2025 trending titles
- Maintain 60-40 international to Indian content ratio
- Use TMDB API for metadata enrichment
"""

import os
import asyncio
import requests
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# TMDB Configuration
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', "0ec85c952e2d4ee771180e3068544ddf")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

# Platform mapping (TMDB Watch Provider IDs for India)
PLATFORM_MAPPING = {
    8: "Netflix",
    119: "Prime Video", 
    337: "Disney+",
    122: "JioHotstar",
    531: "Sony Liv",
    283: "Zee5",
    350: "Apple TV",
    2: "Apple TV"
}

# TMDB Genre ID to Name mapping
TMDB_GENRE_MAPPING = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    # TV genres
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics"
}

# Known Nov 2025 Netflix Top 10 titles (user provided)
NOV_2025_NETFLIX_TOP10 = [
    "Kurukshetra",
    "The Witcher",
    "Squid Game",
    "Wednesday",
    "The Night Agent",
    "Stranger Things",
    "Money Heist",
    "Breaking Bad",
    "Peaky Blinders",
    "Cobra Kai"
]

# Recent Indian trending titles (Nov 2025)
RECENT_INDIAN_TITLES = [
    "Pushpa 2",
    "Mirzapur",
    "Fighter",
    "12th Fail",
    "Asur",
    "Animal",
    "Dunki",
    "Sam Bahadur",
    "Tiger 3",
    "Jawan"
]

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.test_database

# Color codes
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
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

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


def search_title_on_tmdb(title, year=None):
    """Search for a title on TMDB and return the best match"""
    print_info(f"Searching TMDB for: {title}")
    
    # Try movie search first
    params = {'query': title, 'language': 'en-US', 'include_adult': 'false'}
    if year:
        params['year'] = year
    
    movie_results = make_tmdb_request('/search/movie', params)
    if movie_results and movie_results.get('results'):
        result = movie_results['results'][0]
        return {
            'tmdb_id': result['id'],
            'media_type': 'movie',
            'title': result.get('title', title),
            'year': result.get('release_date', '')[:4] if result.get('release_date') else '',
            'rating': result.get('vote_average', 0.0),
            'genres': result.get('genre_ids', []),
            'poster_path': result.get('poster_path', ''),
            'overview': result.get('overview', ''),
            'language': result.get('original_language', 'en')
        }
    
    # Try TV search
    tv_results = make_tmdb_request('/search/tv', params)
    if tv_results and tv_results.get('results'):
        result = tv_results['results'][0]
        return {
            'tmdb_id': result['id'],
            'media_type': 'tv',
            'title': result.get('name', title),
            'year': result.get('first_air_date', '')[:4] if result.get('first_air_date') else '',
            'rating': result.get('vote_average', 0.0),
            'genres': result.get('genre_ids', []),
            'poster_path': result.get('poster_path', ''),
            'overview': result.get('overview', ''),
            'language': result.get('original_language', 'en')
        }
    
    print_warning(f"No TMDB match found for: {title}")
    return None


def get_tmdb_trending(media_type='all', time_window='week', region=None):
    """Fetch trending content from TMDB"""
    endpoint = f'/trending/{media_type}/{time_window}'
    params = {}
    if region:
        params['region'] = region
    
    data = make_tmdb_request(endpoint, params)
    if data and 'results' in data:
        return data['results'][:20]  # Return top 20
    return []


def get_platform_for_content(tmdb_id, media_type):
    """Get streaming platform for content"""
    endpoint = f'/{media_type}/{tmdb_id}/watch/providers'
    data = make_tmdb_request(endpoint)
    
    if not data or 'results' not in data:
        return "Netflix"  # Default fallback
    
    india_data = data['results'].get('IN', {})
    
    # Check flatrate (subscription) providers
    if 'flatrate' in india_data:
        for provider in india_data['flatrate']:
            provider_id = provider.get('provider_id')
            if provider_id in PLATFORM_MAPPING:
                return PLATFORM_MAPPING[provider_id]
    
    return "Netflix"  # Default fallback


def is_indian_content(language, title, overview):
    """Determine if content is Indian"""
    indian_languages = ['hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'pa']
    
    if language in indian_languages:
        return True
    
    # Check title and overview for Indian keywords
    text = f"{title} {overview}".lower()
    indian_keywords = ['bollywood', 'mumbai', 'delhi', 'india', 'hindi', 'tamil', 'telugu']
    
    return any(keyword in text for keyword in indian_keywords)


async def content_exists(title, platform):
    """Check if content already exists in database"""
    existing = await db.content.find_one({
        'title': {'$regex': f'^{title}$', '$options': 'i'},
        'platform': platform
    })
    return existing is not None


async def ingest_title(title_data, platform):
    """Ingest a single title into the database"""
    if not title_data:
        return False
    
    # Check if already exists
    if await content_exists(title_data['title'], platform):
        print_info(f"Skipping (exists): {title_data['title']}")
        return False
    
    # Convert genre IDs to genre names
    genre_ids = title_data.get('genres', [])
    genre_names = []
    for genre_id in genre_ids:
        if genre_id in TMDB_GENRE_MAPPING:
            genre_names.append(TMDB_GENRE_MAPPING[genre_id])
    
    # If no genres mapped, default to a generic one
    if not genre_names:
        genre_names = ['Entertainment']
    
    # Create content document
    content_doc = {
        'id': str(__import__('uuid').uuid4()),
        'title': title_data['title'],
        'category': 'buzzing',  # Required field - all trending content goes to buzzing category
        'platform': platform,
        'content_type': title_data['media_type'],
        'rating': float(title_data.get('rating', 0.0)),
        'year': title_data.get('year'),
        'language': title_data.get('language', 'en'),
        'description': title_data.get('overview', ''),
        'genres': genre_names,  # Now list of strings, not integers
        'tmdb_id': title_data.get('tmdb_id'),
        'thumbnail': f"https://image.tmdb.org/t/p/w500{title_data['poster_path']}" if title_data.get('poster_path') else '',
        'tagline': '',  # Required field
        'is_trending': True,
        'added_date': datetime.now().isoformat()
    }
    
    try:
        await db.content.insert_one(content_doc)
        print_success(f"Added: {title_data['title']} ({platform}) - Rating: {title_data.get('rating', 0.0)} - Genres: {', '.join(genre_names[:2])}")
        return True
    except Exception as e:
        print_error(f"Error adding {title_data['title']}: {e}")
        return False


async def ingest_nov_2025_content():
    """Main ingestion function with 60-40 international-Indian balance"""
    print_header("November 2025 Content Ingestion")
    
    ingested_count = 0
    international_count = 0
    indian_count = 0
    
    # Phase 1: Ingest specific Netflix Nov 2025 Top 10 titles
    print_header("Phase 1: Netflix Nov 2025 Top 10")
    for title in NOV_2025_NETFLIX_TOP10:
        title_data = search_title_on_tmdb(title)
        if title_data:
            # Determine platform
            platform = get_platform_for_content(title_data['tmdb_id'], title_data['media_type'])
            
            if await ingest_title(title_data, platform):
                ingested_count += 1
                if is_indian_content(title_data.get('language', 'en'), title_data['title'], title_data.get('overview', '')):
                    indian_count += 1
                else:
                    international_count += 1
        
        await asyncio.sleep(0.3)  # Rate limiting
    
    # Phase 2: Fetch trending international content
    print_header("Phase 2: Trending International Content")
    trending_international = get_tmdb_trending('all', 'week')
    
    for item in trending_international:
        if international_count >= ingested_count * 0.6:  # Stop when 60% international reached
            break
        
        media_type = item.get('media_type', 'movie')
        title = item.get('title') or item.get('name', 'Unknown')
        language = item.get('original_language', 'en')
        
        # Skip if Indian content
        if is_indian_content(language, title, item.get('overview', '')):
            continue
        
        title_data = {
            'tmdb_id': item['id'],
            'media_type': media_type,
            'title': title,
            'year': (item.get('release_date') or item.get('first_air_date', ''))[:4],
            'rating': item.get('vote_average', 0.0),
            'genres': item.get('genre_ids', []),
            'poster_path': item.get('poster_path', ''),
            'overview': item.get('overview', ''),
            'language': language
        }
        
        platform = get_platform_for_content(item['id'], media_type)
        
        if await ingest_title(title_data, platform):
            ingested_count += 1
            international_count += 1
        
        await asyncio.sleep(0.3)
    
    # Phase 3: Fetch Indian trending content
    print_header("Phase 3: Trending Indian Content")
    
    # First try specific Indian titles
    for title in RECENT_INDIAN_TITLES:
        if indian_count >= ingested_count * 0.4:  # Stop when 40% Indian reached
            break
        
        title_data = search_title_on_tmdb(title)
        if title_data and is_indian_content(title_data.get('language', 'en'), title_data['title'], title_data.get('overview', '')):
            platform = get_platform_for_content(title_data['tmdb_id'], title_data['media_type'])
            
            if await ingest_title(title_data, platform):
                ingested_count += 1
                indian_count += 1
        
        await asyncio.sleep(0.3)
    
    # Then fetch from TMDB trending in India region
    trending_india = get_tmdb_trending('all', 'week', 'IN')
    
    for item in trending_india:
        if indian_count >= ingested_count * 0.4:
            break
        
        media_type = item.get('media_type', 'movie')
        title = item.get('title') or item.get('name', 'Unknown')
        language = item.get('original_language', 'en')
        
        # Only add if Indian content
        if not is_indian_content(language, title, item.get('overview', '')):
            continue
        
        title_data = {
            'tmdb_id': item['id'],
            'media_type': media_type,
            'title': title,
            'year': (item.get('release_date') or item.get('first_air_date', ''))[:4],
            'rating': item.get('vote_average', 0.0),
            'genres': item.get('genre_ids', []),
            'poster_path': item.get('poster_path', ''),
            'overview': item.get('overview', ''),
            'language': language
        }
        
        platform = get_platform_for_content(item['id'], media_type)
        
        if await ingest_title(title_data, platform):
            ingested_count += 1
            indian_count += 1
        
        await asyncio.sleep(0.3)
    
    # Final Summary
    print_header("Ingestion Complete")
    print_success(f"Total content ingested: {ingested_count}")
    print_info(f"International content: {international_count} ({international_count/max(ingested_count, 1)*100:.1f}%)")
    print_info(f"Indian content: {indian_count} ({indian_count/max(ingested_count, 1)*100:.1f}%)")
    
    international_ratio = international_count / max(ingested_count, 1)
    indian_ratio = indian_count / max(ingested_count, 1)
    
    if 0.55 <= international_ratio <= 0.65:
        print_success("✅ Content balance achieved: ~60-40 international-Indian")
    else:
        print_warning(f"⚠️  Content balance: {international_ratio*100:.1f}-{indian_ratio*100:.1f}")


if __name__ == "__main__":
    asyncio.run(ingest_nov_2025_content())
