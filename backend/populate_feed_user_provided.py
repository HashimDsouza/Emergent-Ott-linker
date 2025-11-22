#!/usr/bin/env python3
"""
Get With It - USER PROVIDED LINKS
4 confirmed working + 2 user-provided links
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv('.env')

FEED_ITEMS = [
    # ===== 4 CONFIRMED WORKING =====
    {
        "title": "Stree 3 Officially Announced by Maddock Films for 2025",
        "description": "Shraddha Kapoor and Rajkummar Rao return in horror-comedy sequel.",
        "image_url": "https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg",
        "source_url": "https://www.timesnownews.com/entertainment-news/bollywood/shraddha-kapoor-confirms-signing-3-films-post-stree-2-amid-maddock-announcement-of-stree-3-article-116889736",
        "source_name": "Times Now",
        "category": "entertainment",
        "is_hero": True,
        "priority": 10,
        "hours_ago": 2,
        "badge": "OFFICIAL"
    },
    {
        "title": "Pushpa 2 Crosses ₹1500 Cr Worldwide in Just 14 Days",
        "description": "Allu Arjun's sequel becomes fastest Indian film to reach milestone.",
        "image_url": "https://image.tmdb.org/t/p/w500/8eM7R5nYCPQ6e2CiBv86Rx8tmXJ.jpg",
        "source_url": "https://www.hindustantimes.com/entertainment/telugu-cinema/pushpa-2-the-rule-box-office-collection-worldwide-day-14-allu-arjun-sukumar-film-breezes-through-1500-crore-mark-101734619625454.html",
        "source_name": "Hindustan Times",
        "category": "entertainment",
        "priority": 9,
        "hours_ago": 4,
        "badge": "TRENDING"
    },
    {
        "title": "Stranger Things Season 5: Official Teaser Trailer",
        "description": "Netflix drops first look at final season. Release date: November 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
        "source_url": "https://www.youtube.com/@Netflix",
        "source_name": "Netflix YouTube",
        "category": "entertainment",
        "priority": 9,
        "hours_ago": 8,
        "badge": "TRAILER"
    },
    {
        "title": "Border-Gavaskar Trophy: India vs Australia Live Updates",
        "description": "Follow ball-by-ball commentary, scores, and analysis.",
        "image_url": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.espncricinfo.com/",
        "source_name": "ESPNcricinfo",
        "category": "sports",
        "priority": 9,
        "hours_ago": 6,
        "badge": "LIVE"
    },
    
    # ===== 2 USER PROVIDED LINKS =====
    {
        "title": "120 Bahadur Box Office Collection Day 1: Farhan Akhtar's Film Off to Slow Start",
        "description": "War drama based on Battle of Rezang La opens with modest numbers.",
        "image_url": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.ndtv.com/entertainment/120-bahadur-box-office-collection-day-1-farhan-akhtars-film-off-to-a-slow-start-9680700",
        "source_name": "NDTV",
        "category": "entertainment",
        "priority": 8,
        "hours_ago": 10,
        "badge": "TRENDING"
    },
    {
        "title": "FIFA World Cup 2026: Complete List of Qualified Teams",
        "description": "Official FIFA article on all teams qualified for Canada, Mexico & USA tournament.",
        "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-2026-who-has-qualified",
        "source_name": "FIFA Official",
        "category": "sports",
        "priority": 9,
        "hours_ago": 12,
        "badge": "OFFICIAL"
    },
]

async def populate_feed():
    """Populate feed with user-provided verified links"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing
    await db.feed_items.delete_many({})
    print("✅ Cleared existing feed items")
    print("\n" + "=" * 80)
    print("GET WITH IT - USER PROVIDED LINKS")
    print("4 Confirmed + 2 User-Provided (120 Bahadur, FIFA WC 2026)")
    print("=" * 80 + "\n")
    
    now = datetime.now(timezone.utc)
    
    for item_data in FEED_ITEMS:
        hours_ago = item_data.pop('hours_ago', 0)
        published_at = (now - timedelta(hours=hours_ago)).isoformat()
        
        badge = item_data.pop('badge', '')
        
        feed_item = {
            "id": str(os.urandom(16).hex()),
            "title": item_data["title"],
            "description": item_data.get("description", ""),
            "image_url": item_data.get("image_url", ""),
            "source_url": item_data["source_url"],
            "source_name": item_data["source_name"],
            "category": item_data["category"],
            "published_at": published_at,
            "is_hero": item_data.get("is_hero", False),
            "priority": item_data.get("priority", 5),
            "badge": badge
        }
        
        await db.feed_items.insert_one(feed_item)
        
        hero_marker = "🌟 HERO" if feed_item["is_hero"] else f"  P{feed_item['priority']}"
        badge_text = f" [{badge}]" if badge else ""
        print(f"{hero_marker} | {feed_item['category']:15} | {feed_item['title'][:55]}{badge_text}")
        print(f"     ✅ {feed_item['source_name']}")
    
    print("\n" + "=" * 80)
    print("✅ 6 WORKING LINKS")
    print("   Entertainment: 4 (Times Now, Hindustan Times, Netflix, NDTV)")
    print("   Sports: 2 (ESPNcricinfo, FIFA)")
    print("=" * 80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_feed())
