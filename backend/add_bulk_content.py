#!/usr/bin/env python3
"""
Bulk Content Addition Script
Adds curated titles to MongoDB and enriches them with TMDB data
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Add parent directory to path to import from server
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# MongoDB connection  
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
print(f"📊 Using database: {DB_NAME}")

# Import enrichment function from server
from server import enrich_content_item

# Curated title lists with strict platform naming
NETFLIX_TITLES = [
    {"title": "Stranger Things Season 4", "content_type": "series", "year": 2022},
    {"title": "Money Heist", "content_type": "series", "year": 2017},
    {"title": "Sacred Games", "content_type": "series", "year": 2018},
    {"title": "Delhi Crime", "content_type": "series", "year": 2019},
    {"title": "Paatal Lok", "content_type": "series", "year": 2020},
    {"title": "Kota Factory", "content_type": "series", "year": 2019},
    {"title": "Mismatched", "content_type": "series", "year": 2020},
    {"title": "Selection Day", "content_type": "series", "year": 2018},
    {"title": "She", "content_type": "series", "year": 2020},
    {"title": "Decoupled", "content_type": "series", "year": 2021},
    {"title": "Yeh Kaali Kaali Ankhein", "content_type": "series", "year": 2022},
    {"title": "Jamtara", "content_type": "series", "year": 2020},
    {"title": "Aranyak", "content_type": "series", "year": 2021},
    {"title": "Typewriter", "content_type": "series", "year": 2019},
    {"title": "Ghoul", "content_type": "series", "year": 2018},
    {"title": "Bulbbul", "content_type": "movie", "year": 2020},
    {"title": "Raat Akeli Hai", "content_type": "movie", "year": 2020},
    {"title": "Class of '83", "content_type": "movie", "year": 2020},
    {"title": "Chopsticks", "content_type": "movie", "year": 2019},
    {"title": "Guilty", "content_type": "movie", "year": 2020},
    {"title": "Mrs Serial Killer", "content_type": "movie", "year": 2020},
    {"title": "House Arrest", "content_type": "movie", "year": 2019},
    {"title": "Dolly Kitty Aur Woh Chamakte Sitare", "content_type": "movie", "year": 2020},
    {"title": "Pihu", "content_type": "movie", "year": 2018},
    {"title": "Extraction", "content_type": "movie", "year": 2020},
]

PRIME_TITLES = [
    {"title": "Mirzapur Season 3", "content_type": "series", "year": 2020},
    {"title": "The Family Man Season 3", "content_type": "series", "year": 2019},
    {"title": "Panchayat Season 3", "content_type": "series", "year": 2020},
    {"title": "Made in Heaven Season 2", "content_type": "series", "year": 2019},
    {"title": "Four More Shots Please", "content_type": "series", "year": 2019},
    {"title": "Inside Edge", "content_type": "series", "year": 2017},
    {"title": "Breathe", "content_type": "series", "year": 2018},
    {"title": "The Forgotten Army", "content_type": "series", "year": 2020},
    {"title": "Afsos", "content_type": "series", "year": 2020},
    {"title": "Bandish Bandits", "content_type": "series", "year": 2020},
    {"title": "Comicstaan", "content_type": "series", "year": 2018},
    {"title": "Hostel Daze", "content_type": "series", "year": 2019},
    {"title": "Pushpavalli", "content_type": "series", "year": 2017},
    {"title": "Laakhon Mein Ek", "content_type": "series", "year": 2017},
    {"title": "Chacha Vidhayak Hain Humare", "content_type": "series", "year": 2018},
    {"title": "Tripling", "content_type": "series", "year": 2016},
    {"title": "Mind the Malhotras", "content_type": "series", "year": 2019},
    {"title": "The Boys", "content_type": "series", "year": 2019},
    {"title": "Reacher", "content_type": "series", "year": 2022},
    {"title": "Invincible", "content_type": "series", "year": 2021},
    {"title": "Tandav", "content_type": "series", "year": 2021},
    {"title": "Mumbai Diaries 26/11", "content_type": "series", "year": 2021},
    {"title": "Guilty Minds", "content_type": "series", "year": 2022},
    {"title": "Shershaah", "content_type": "movie", "year": 2021},
    {"title": "Sardar Udham", "content_type": "movie", "year": 2021},
]

JIOHOTSTAR_TITLES = [
    {"title": "House of the Dragon Season 2", "content_type": "series", "year": 2022},
    {"title": "Succession", "content_type": "series", "year": 2018},
    {"title": "Loki Season 2", "content_type": "series", "year": 2021},
    {"title": "Ahsoka", "content_type": "series", "year": 2023},
    {"title": "The Mandalorian", "content_type": "series", "year": 2019},
    {"title": "Laapataa Ladies", "content_type": "movie", "year": 2024},
    {"title": "Crew", "content_type": "movie", "year": 2024},
    {"title": "Merry Christmas", "content_type": "movie", "year": 2024},
    {"title": "Article 370", "content_type": "movie", "year": 2024},
    {"title": "Bade Miyan Chote Miyan", "content_type": "movie", "year": 2024},
    {"title": "Teri Baaton Mein Aisa Uljha Jiya", "content_type": "movie", "year": 2024},
    {"title": "Shaitaan", "content_type": "movie", "year": 2024},
    {"title": "Yodha", "content_type": "movie", "year": 2024},
    {"title": "Ae Watan Mere Watan", "content_type": "movie", "year": 2024},
    {"title": "Madgaon Express", "content_type": "movie", "year": 2024},
    {"title": "Do Aur Do Pyaar", "content_type": "movie", "year": 2024},
    {"title": "Murder Mubarak", "content_type": "movie", "year": 2024},
    {"title": "Silence 2", "content_type": "movie", "year": 2024},
    {"title": "Showtime", "content_type": "series", "year": 2024},
    {"title": "The Railway Men", "content_type": "series", "year": 2023},
    {"title": "Kaala Paani", "content_type": "series", "year": 2023},
    {"title": "The Night Manager", "content_type": "series", "year": 2023},
    {"title": "Rudra", "content_type": "series", "year": 2022},
    {"title": "Aarya Season 3", "content_type": "series", "year": 2020},
    {"title": "Special Ops", "content_type": "series", "year": 2020},
]

SONYLIV_TITLES = [
    {"title": "Scam 1992", "content_type": "series", "year": 2020},
    {"title": "Scam 2003", "content_type": "series", "year": 2023},
    {"title": "Rocket Boys", "content_type": "series", "year": 2022},
    {"title": "Gullak", "content_type": "series", "year": 2019},
    {"title": "Undekhi", "content_type": "series", "year": 2020},
    {"title": "JL50", "content_type": "series", "year": 2020},
    {"title": "Your Honor", "content_type": "series", "year": 2020},
    {"title": "Avrodh", "content_type": "series", "year": 2020},
    {"title": "Kathmandu Connection", "content_type": "series", "year": 2021},
    {"title": "College Romance", "content_type": "series", "year": 2018},
    {"title": "Maharani", "content_type": "series", "year": 2021},
    {"title": "Tabbar", "content_type": "series", "year": 2021},
    {"title": "Tanaav", "content_type": "series", "year": 2022},
    {"title": "Trial by Fire", "content_type": "series", "year": 2023},
    {"title": "Freedom at Midnight", "content_type": "series", "year": 2024},
]

APPLETV_TITLES = [
    {"title": "Ted Lasso", "content_type": "series", "year": 2020},
    {"title": "The Morning Show", "content_type": "series", "year": 2019},
    {"title": "Slow Horses Season 5", "content_type": "series", "year": 2022},
    {"title": "Foundation", "content_type": "series", "year": 2021},
    {"title": "Silo", "content_type": "series", "year": 2023},
    {"title": "Hijack", "content_type": "series", "year": 2023},
    {"title": "For All Mankind", "content_type": "series", "year": 2019},
    {"title": "Severance", "content_type": "series", "year": 2022},
    {"title": "Shrinking", "content_type": "series", "year": 2023},
    {"title": "See", "content_type": "series", "year": 2019},
]

async def add_content_batch(platform: str, titles: list):
    """Add a batch of titles for a platform"""
    print(f"\n🎬 Adding {len(titles)} titles for {platform}...")
    
    added_count = 0
    skipped_count = 0
    
    for title_data in titles:
        try:
            # Check if already exists
            existing = await db.content.find_one({
                "title": title_data["title"],
                "platform": platform
            })
            
            if existing:
                print(f"  ⏭️  Skipped: {title_data['title']} (already exists)")
                skipped_count += 1
                continue
            
            # Create content object
            content = {
                "id": f"{platform.lower().replace(' ', '_')}_{title_data['title'].lower().replace(' ', '_').replace(':', '')}_{title_data['year']}",
                "title": title_data["title"],
                "platform": platform,
                "content_type": title_data["content_type"],
                "category": "entertainment",
                "year": title_data["year"],
                "description": "",
                "poster_url": "",
                "genres": [],
                "rating": 0.0,
                "likes": 0,
                "shares": 0
            }
            
            # Insert to database
            await db.content.insert_one(content)
            
            # Enrich with TMDB data
            enriched = await enrich_content_item(content)
            
            # Update with enriched data
            if enriched.get("tmdb_id"):
                await db.content.update_one(
                    {"id": content["id"]},
                    {"$set": enriched}
                )
                print(f"  ✅ Added: {title_data['title']} (enriched)")
                added_count += 1
            else:
                print(f"  ⚠️  Added: {title_data['title']} (no TMDB data)")
                added_count += 1
            
            # Small delay to avoid rate limits
            await asyncio.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Error adding {title_data['title']}: {str(e)}")
    
    print(f"\n✅ {platform} complete: {added_count} added, {skipped_count} skipped")
    return added_count, skipped_count

async def main():
    """Main execution function"""
    print("🚀 Starting bulk content addition...")
    print("=" * 60)
    
    total_added = 0
    total_skipped = 0
    
    # Add Netflix titles
    added, skipped = await add_content_batch("Netflix", NETFLIX_TITLES)
    total_added += added
    total_skipped += skipped
    
    # Add Prime Video titles
    added, skipped = await add_content_batch("Prime Video", PRIME_TITLES)
    total_added += added
    total_skipped += skipped
    
    # Add JioHotstar titles
    added, skipped = await add_content_batch("JioHotstar", JIOHOTSTAR_TITLES)
    total_added += added
    total_skipped += skipped
    
    # Add SonyLIV titles
    added, skipped = await add_content_batch("SonyLIV", SONYLIV_TITLES)
    total_added += added
    total_skipped += skipped
    
    # Add Apple TV titles
    added, skipped = await add_content_batch("Apple TV", APPLETV_TITLES)
    total_added += added
    total_skipped += skipped
    
    print("\n" + "=" * 60)
    print(f"🎉 COMPLETE!")
    print(f"   Total added: {total_added}")
    print(f"   Total skipped: {total_skipped}")
    print(f"   Final catalog size: {total_added + total_skipped + 29} titles")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
