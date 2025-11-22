#!/usr/bin/env python3
"""
Get With It - ONLY VERIFIED WORKING LINKS
Dropped all non-working/inaccurate items
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv('.env')

# ONLY ITEMS WITH VERIFIED WORKING LINKS
FEED_ITEMS = [
    # User confirmed: First 4 working fine
    {
        "title": "Stree 3 Officially Announced by Maddock Films for 2025",
        "description": "Shraddha Kapoor and Rajkummar Rao return in horror-comedy sequel.",
        "image_url": "https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg",
        "source_url": "https://www.timesnownews.com/entertainment-news/bollywood/shraddha-kapoor-confirms-signing-3-films-post-stree-2-amid-maddock-announcement-of-stree-3-article-116889736",
        "category": "entertainment",
        "is_hero": True,
        "priority": 10,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 2,
        "badge": "OFFICIAL"
    },
    {
        "title": "Panchayat Season 4 Premieres June 24, 2025 on Prime Video",
        "description": "Official trailer released. Village elections take center stage in Phulera.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsgfe8YmntJ1uVIkBjBdRdYpJyN.jpg",
        "source_url": "https://www.aboutamazon.in/news/entertainment/trailer-alert-panchayat-s4-to-release-on-prime-video-on-june-24",
        "category": "entertainment",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 6,
        "badge": "NEW SEASON"
    },
    {
        "title": "IPL 2025 Auction: Rishabh Pant Becomes Most Expensive Player Ever",
        "description": "Lucknow Super Giants pay ₹27 Cr. Shreyas Iyer goes for ₹26.75 Cr to Punjab Kings.",
        "image_url": "https://image.tmdb.org/t/p/w500/kOYlMHtNSqnf1FgsoK1JJypfkrY.jpg",
        "source_url": "https://www.iplt20.com/news/4685/ipl-2025-mega-auction-all-the-action",
        "category": "sports",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "sport",
        "hours_ago": 12,
        "badge": "OFFICIAL"
    },
    {
        "title": "Pushpa 2 Crosses ₹1500 Cr Worldwide in Just 14 Days",
        "description": "Allu Arjun's sequel becomes fastest Indian film to reach milestone. Hindi version dominates.",
        "image_url": "https://image.tmdb.org/t/p/w500/8eM7R5nYCPQ6e2CiBv86Rx8tmXJ.jpg",
        "source_url": "https://www.hindustantimes.com/entertainment/telugu-cinema/pushpa-2-the-rule-box-office-collection-worldwide-day-14-allu-arjun-sukumar-film-breezes-through-1500-crore-mark-101734619625454.html",
        "category": "entertainment",
        "priority": 9,
        "source_type": "trend",
        "entity_type": "movie",
        "hours_ago": 4,
        "badge": "TRENDING"
    },
    
    # ALL OTHER ITEMS DROPPED - Not working or inaccurate per user feedback
]

async def populate_feed():
    """Populate feed with ONLY verified working links"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing
    await db.feed_items.delete_many({})
    print("✅ Cleared existing feed items")
    print("\n" + "=" * 80)
    print("GET WITH IT - ONLY VERIFIED WORKING LINKS")
    print("Dropped all non-working items per user feedback")
    print("=" * 80 + "\n")
    
    now = datetime.now(timezone.utc)
    inserted_count = 0
    
    for item_data in FEED_ITEMS:
        hours_ago = item_data.pop('hours_ago', 0)
        published_at = (now - timedelta(hours=hours_ago)).isoformat()
        
        badge = item_data.pop('badge', '')
        
        feed_item = {
            "id": item_data.get("id", str(os.urandom(16).hex())),
            "title": item_data["title"],
            "description": item_data.get("description", ""),
            "image_url": item_data.get("image_url", ""),
            "source_url": item_data["source_url"],
            "source_name": item_data["source_url"].split('/')[2].replace('www.', ''),
            "category": item_data["category"],
            "published_at": published_at,
            "is_hero": item_data.get("is_hero", False),
            "priority": item_data.get("priority", 5),
            "badge": badge
        }
        
        await db.feed_items.insert_one(feed_item)
        inserted_count += 1
        
        hero_marker = "🌟 HERO" if feed_item["is_hero"] else f"  P{feed_item['priority']}"
        badge_text = f" [{badge}]" if badge else ""
        print(f"{hero_marker} | {feed_item['category']:15} | {feed_item['title'][:50]}{badge_text}")
        print(f"     Source: {feed_item['source_name']}")
    
    print("\n" + "=" * 80)
    print(f"✅ Inserted {inserted_count} VERIFIED WORKING feed items")
    print("=" * 80)
    
    print("\n⚠️  NOTE: Only 4 items with confirmed working links")
    print("   All other items dropped per user feedback")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_feed())
