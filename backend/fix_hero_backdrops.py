#!/usr/bin/env python3
"""
Fix hero section backdrop images by fetching proper TMDB backdrop URLs
"""
import os
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# TMDB API Configuration
TMDB_API_KEY = "8bb8195209354fd890e45f0c185fe72b"  # Read-only demo key
TMDB_BASE_URL = "https://api.themoviedb.org/3"

def get_tmdb_backdrop(tmdb_id, content_type):
    """Fetch proper backdrop image from TMDB"""
    endpoint = f"tv/{tmdb_id}" if content_type == "series" else f"movie/{tmdb_id}"
    url = f"{TMDB_BASE_URL}/{endpoint}"
    
    params = {
        "api_key": TMDB_API_KEY,
        "append_to_response": "images"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Get backdrop_path (landscape 16:9 image)
        if data.get('backdrop_path'):
            backdrop_url = f"https://image.tmdb.org/t/p/original{data['backdrop_path']}"
            print(f"  ✅ Found backdrop: {backdrop_url[:80]}...")
            return backdrop_url
        else:
            print(f"  ⚠️  No backdrop available")
            return None
            
    except Exception as e:
        print(f"  ❌ Error fetching TMDB data: {e}")
        return None

def fix_hero_backdrops():
    """Update hero items with proper TMDB backdrop images"""
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'connector')
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    # Find all hero items
    hero_items = list(db.content.find({
        'curation_flags.front_and_center': True
    }))
    
    print(f"\n🔍 Found {len(hero_items)} hero items to fix\n")
    
    for item in hero_items:
        print(f"📍 {item['title']}")
        print(f"  Current backdrop: {item.get('backdrop_path', 'None')[:80]}...")
        
        if item.get('tmdb_id'):
            # Fetch proper backdrop from TMDB
            new_backdrop = get_tmdb_backdrop(item['tmdb_id'], item['content_type'])
            
            if new_backdrop:
                # Update database
                result = db.content.update_one(
                    {'id': item['id']},
                    {'$set': {'backdrop_path': new_backdrop}}
                )
                print(f"  ✅ Updated backdrop_path\n")
            else:
                print(f"  ⚠️  Keeping current backdrop\n")
        else:
            print(f"  ⚠️  No TMDB ID - cannot fetch backdrop\n")
    
    client.close()
    print("\n🎉 Hero backdrop fix complete!")

if __name__ == "__main__":
    fix_hero_backdrops()
