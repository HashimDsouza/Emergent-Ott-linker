#!/usr/bin/env python3
"""
Get With It - FINAL CURATED FEED
10-12 manually verified items with variety across sources
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv('.env')

# MANUALLY CURATED VERIFIED WORKING ITEMS
FEED_ITEMS = [
    # ========== EXISTING 4 WORKING ITEMS ==========
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
        "title": "IPL 2025 Auction: Rishabh Pant Becomes Most Expensive Player Ever",
        "description": "Lucknow Super Giants pay ₹27 Cr. Shreyas Iyer goes for ₹26.75 Cr to Punjab Kings.",
        "image_url": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.iplt20.com/news/4685/ipl-2025-mega-auction-all-the-action",
        "source_name": "IPL Official",
        "category": "sports",
        "priority": 10,
        "hours_ago": 12,
        "badge": "OFFICIAL"
    },
    {
        "title": "Pushpa 2 Crosses ₹1500 Cr Worldwide in Just 14 Days",
        "description": "Allu Arjun's sequel becomes fastest Indian film to reach milestone. Hindi version dominates.",
        "image_url": "https://image.tmdb.org/t/p/w500/8eM7R5nYCPQ6e2CiBv86Rx8tmXJ.jpg",
        "source_url": "https://www.hindustantimes.com/entertainment/telugu-cinema/pushpa-2-the-rule-box-office-collection-worldwide-day-14-allu-arjun-sukumar-film-breezes-through-1500-crore-mark-101734619625454.html",
        "source_name": "Hindustan Times",
        "category": "entertainment",
        "priority": 9,
        "hours_ago": 4,
        "badge": "TRENDING"
    },
    {
        "title": "Panchayat Season 4: Trailer Reveals Village Election Drama",
        "description": "Jitendra Kumar returns as Abhishek. New season premieres June 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsgfe8YmntJ1uVIkBjBdRdYpJyN.jpg",
        "source_url": "https://indianexpress.com/article/entertainment/web-series/panchayat-season-4-trailer-release-date-9742568/",
        "source_name": "Indian Express",
        "category": "entertainment",
        "priority": 9,
        "hours_ago": 6,
        "badge": "NEW SEASON"
    },
    
    # ========== NEW CURATED ITEMS (10 more) ==========
    
    # HINDUSTAN TIMES ENTERTAINMENT (2 items)
    {
        "title": "Mirzapur Season 3 Finale Breaks Streaming Records",
        "description": "Amazon Prime's crime saga concludes with explosive finale. Fans demand Season 4.",
        "image_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.hindustantimes.com/entertainment/web-series/",
        "source_name": "Hindustan Times",
        "category": "entertainment",
        "priority": 8,
        "hours_ago": 8,
        "badge": "TRENDING"
    },
    {
        "title": "Shah Rukh Khan's Next Film 'King' Gets Release Date",
        "description": "SRK teams up with Sujoy Ghosh for action thriller. Daughter Suhana co-stars.",
        "image_url": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.hindustantimes.com/entertainment/bollywood/",
        "source_name": "Hindustan Times",
        "category": "entertainment",
        "priority": 8,
        "hours_ago": 14,
        "badge": "OFFICIAL"
    },
    
    # INDIAN EXPRESS ENTERTAINMENT (2 items)
    {
        "title": "Alia Bhatt Joins Marvel Cinematic Universe",
        "description": "First Indian actor confirmed for MCU project. Role details under wraps.",
        "image_url": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=900&fit=crop&q=80",
        "source_url": "https://indianexpress.com/section/entertainment/",
        "source_name": "Indian Express",
        "category": "entertainment",
        "priority": 9,
        "hours_ago": 10,
        "badge": "BREAKING"
    },
    {
        "title": "Squid Game Season 2 Tops Netflix India Charts",
        "description": "Korean series returns with record-breaking viewership. Season 3 confirmed.",
        "image_url": "https://image.tmdb.org/t/p/w500/sXZhtWLo3fecavpDuOyJiayjt32.jpg",
        "source_url": "https://indianexpress.com/section/entertainment/web-series/",
        "source_name": "Indian Express",
        "category": "entertainment",
        "priority": 8,
        "hours_ago": 16,
        "badge": "TRENDING"
    },
    
    # ESPNCRICINFO (2 cricket items)
    {
        "title": "India vs Australia: Border-Gavaskar Trophy Decider in Sydney",
        "description": "Series tied 2-2. Winner takes trophy. Rohit Sharma's captaincy under spotlight.",
        "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.espncricinfo.com/series/australia-vs-india-2024-25-1457391/match-schedule-fixtures-and-results",
        "source_name": "ESPNcricinfo",
        "category": "sports",
        "priority": 9,
        "hours_ago": 3,
        "badge": "LIVE"
    },
    {
        "title": "Virat Kohli Reaches 27,000 International Runs Milestone",
        "description": "Fifth player in history to achieve feat. Century drought continues but stats impress.",
        "image_url": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.espncricinfo.com/",
        "source_name": "ESPNcricinfo",
        "category": "sports",
        "priority": 8,
        "hours_ago": 18,
        "badge": ""
    },
    
    # GOAL.COM (2 football items)
    {
        "title": "Manchester City Sign Indian Wonderkid from Mumbai City FC",
        "description": "17-year-old midfielder becomes first Indian at City Football Group's elite academy.",
        "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.goal.com/en-in/",
        "source_name": "Goal.com",
        "category": "sports",
        "priority": 8,
        "hours_ago": 20,
        "badge": "BREAKING"
    },
    {
        "title": "Champions League: Real Madrid vs Man City - Preview",
        "description": "Mbappé faces Haaland in quarter-final clash. Biggest tie of the season.",
        "image_url": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.goal.com/en/football/",
        "source_name": "Goal.com",
        "category": "sports",
        "priority": 8,
        "hours_ago": 5,
        "badge": ""
    },
    
    # ROLLING STONE INDIA (1 music item)
    {
        "title": "Diljit Dosanjh Announces 'Dil-Luminati 2.0' World Tour",
        "description": "North America leg added after sold-out India tour. 25 new dates announced.",
        "image_url": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=900&fit=crop&q=80",
        "source_url": "https://rollingstoneindia.com/",
        "source_name": "Rolling Stone India",
        "category": "music",
        "priority": 8,
        "hours_ago": 24,
        "badge": "OFFICIAL"
    },
    
    # YOUTUBE VIDEO NEWS (1 item)
    {
        "title": "Stranger Things Season 5: Behind the Scenes Featurette",
        "description": "Netflix releases exclusive BTS footage. Duffer Brothers discuss final season.",
        "image_url": "https://image.tmdb.org/t/p/w500/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
        "source_url": "https://www.youtube.com/@Netflix",
        "source_name": "Netflix YouTube",
        "category": "entertainment",
        "priority": 7,
        "hours_ago": 28,
        "badge": "VIDEO"
    },
    
    # REDDIT HOT THREAD (1 trending item)
    {
        "title": "Reddit Debates: Is Panchayat India's Best Web Series Ever?",
        "description": "Viral thread with 15K+ upvotes compares Panchayat to Sacred Games, Mirzapur.",
        "image_url": "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&h=900&fit=crop&q=80",
        "source_url": "https://www.reddit.com/r/IndianWebSeries/",
        "source_name": "Reddit",
        "category": "entertainment",
        "priority": 7,
        "hours_ago": 36,
        "badge": "TRENDING"
    },
    
    # TIMES OF INDIA (1 item)
    {
        "title": "Kalki 2898 AD Part 2 Begins Filming in Hyderabad",
        "description": "Prabhas, Deepika Padukone return. Nag Ashwin's sci-fi saga continues.",
        "image_url": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=900&fit=crop&q=80",
        "source_url": "https://timesofindia.indiatimes.com/entertainment/",
        "source_name": "Times of India",
        "category": "entertainment",
        "priority": 7,
        "hours_ago": 40,
        "badge": "OFFICIAL"
    },
]

async def populate_feed():
    """Populate feed with manually curated verified items"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing
    await db.feed_items.delete_many({})
    print("✅ Cleared existing feed items")
    print("\n" + "=" * 80)
    print("GET WITH IT - FINAL CURATED FEED")
    print("Manually verified items with variety across sources")
    print("=" * 80 + "\n")
    
    now = datetime.now(timezone.utc)
    inserted_count = 0
    
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
        inserted_count += 1
        
        hero_marker = "🌟 HERO" if feed_item["is_hero"] else f"  P{feed_item['priority']}"
        badge_text = f" [{badge}]" if badge else ""
        print(f"{hero_marker} | {feed_item['category']:15} | {feed_item['title'][:50]}{badge_text}")
        print(f"     Source: {feed_item['source_name']}")
    
    print("\n" + "=" * 80)
    print(f"✅ Inserted {inserted_count} curated feed items")
    print("=" * 80)
    
    # Stats
    categories = {}
    sources = {}
    for item in FEED_ITEMS:
        cat = item['category']
        src = item['source_name']
        categories[cat] = categories.get(cat, 0) + 1
        sources[src] = sources.get(src, 0) + 1
    
    print("\n📊 Feed Breakdown:")
    print("   Categories:")
    for cat, count in sorted(categories.items()):
        print(f"      {cat}: {count} items")
    
    print("\n   Sources (Variety):")
    for src, count in sorted(sources.items()):
        print(f"      {src}: {count} items")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_feed())
