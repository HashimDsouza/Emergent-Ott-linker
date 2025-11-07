"""
Targeted Ingestion: Top 10 Trending Indian Content (Nov 2024)
Based on actual viewership data and platform trends
"""

import os
import asyncio
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.environ.get('TMDB_API_KEY', "0ec85c952e2d4ee771180e3068544ddf")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# Top 10 Indian hits from November 2024 research
TOP_10_INDIAN_HITS = [
    {"title": "Mirzapur", "year": 2024, "season": 3, "type": "tv", "platform": "Prime Video"},
    {"title": "IC 814: The Kandahar Hijack", "year": 2024, "type": "tv", "platform": "Netflix"},
    {"title": "Do Patti", "year": 2024, "type": "movie", "platform": "Netflix"},
    {"title": "Heeramandi", "year": 2024, "type": "tv", "platform": "Netflix"},
    {"title": "Amaran", "year": 2024, "type": "movie", "platform": "Netflix"},
    {"title": "Sector 36", "year": 2024, "type": "movie", "platform": "Netflix"},
    {"title": "Sikandar Ka Muqaddar", "year": 2024, "type": "movie", "platform": "Netflix"},
    {"title": "Lucky Baskhar", "year": 2024, "type": "movie", "platform": "Netflix"},
    {"title": "Yeh Kaali Kaali Ankhein", "year": 2024, "season": 2, "type": "tv", "platform": "Netflix"},
    {"title": "Save the Tiger", "year": 2024, "season": 2, "type": "tv", "platform": "JioHotstar"}
]

def search_tmdb(title, year, media_type):
    """Search TMDB for exact title"""
    params = {
        'api_key': TMDB_API_KEY,
        'query': title,
        'year': year,
        'language': 'en-US'
    }
    
    endpoint = f"/search/{media_type}"
    try:
        response = requests.get(f"{TMDB_BASE_URL}{endpoint}", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('results'):
            # Return first result
            return data['results'][0]
        return None
    except Exception as e:
        print(f"❌ Search error for {title}: {e}")
        return None


def get_full_details(tmdb_id, media_type):
    """Get full TMDB details"""
    params = {
        'api_key': TMDB_API_KEY,
        'language': 'en-US',
        'append_to_response': 'credits'
    }
    
    endpoint = f"/{media_type}/{tmdb_id}"
    try:
        response = requests.get(f"{TMDB_BASE_URL}{endpoint}", params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Details error for ID {tmdb_id}: {e}")
        return None


async def ingest_title(title_info):
    """Search, enrich and ingest a single title"""
    print(f"\n🔍 Searching: {title_info['title']} ({title_info['year']})")
    
    # Search TMDB
    result = search_tmdb(title_info['title'], title_info['year'], title_info['type'])
    
    if not result:
        print(f"   ⚠️  Not found on TMDB, skipping...")
        return None
    
    # Get full details
    details = get_full_details(result['id'], title_info['type'])
    if not details:
        print(f"   ⚠️  Could not fetch details, skipping...")
        return None
    
    # Build enriched content
    title = details.get('title') or details.get('name', 'Unknown')
    year = None
    if details.get('release_date'):
        year = int(details['release_date'][:4])
    elif details.get('first_air_date'):
        year = int(details['first_air_date'][:4])
    
    enriched = {
        "id": f"tmdb_{title_info['type']}_{result['id']}",
        "title": title,
        "platform": title_info['platform'],
        "content_type": "movie" if title_info['type'] == 'movie' else "series",
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
        "tmdb_id": result['id'],
        "trending_india": True,  # Special flag
        "ingestion_date": "2024-11-07T00:00:00"
    }
    
    print(f"   ✅ Found: {title} | {title_info['platform']} | ⭐{enriched['rating']:.1f}")
    return enriched


async def main():
    print("\n" + "="*80)
    print("TOP 10 TRENDING INDIAN CONTENT INGESTION")
    print("Based on Nov 2024 viewership data")
    print("="*80)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.test_database
    
    enriched_titles = []
    
    # Process each title
    for title_info in TOP_10_INDIAN_HITS:
        enriched = await ingest_title(title_info)
        if enriched:
            enriched_titles.append(enriched)
    
    print("\n" + "="*80)
    print("INGESTING INTO DATABASE")
    print("="*80)
    
    inserted = 0
    skipped = 0
    
    for item in enriched_titles:
        try:
            # Check if exists
            existing = await db.content.find_one({"id": item['id']})
            if existing:
                print(f"⏭️  Skipped (exists): {item['title']}")
                skipped += 1
                continue
            
            await db.content.insert_one(item)
            print(f"✅ Ingested: {item['title']} ({item['platform']})")
            inserted += 1
        except Exception as e:
            print(f"❌ Error ingesting {item['title']}: {e}")
    
    # Final count
    total_in_db = await db.content.count_documents({})
    
    print("\n" + "="*80)
    print("INGESTION COMPLETE")
    print("="*80)
    print(f"✅ New titles added: {inserted}")
    print(f"⏭️  Duplicates skipped: {skipped}")
    print(f"🗄️  Total catalog: {total_in_db} titles")
    print("="*80 + "\n")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
