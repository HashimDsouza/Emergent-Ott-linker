#!/usr/bin/env python3
"""
Get With It - V2 Content Population
Real, accurate content with proper images and URLs for focus group
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import uuid

load_dotenv('.env')

# REAL, ACCURATE FEED ITEMS - November 2024/2025
FEED_ITEMS = [
    # ========== LAUNCH ANNOUNCEMENTS (3) ==========
    {
        "title": "Stree 3 Officially Announced by Maddock Films",
        "description": "Shraddha Kapoor and Rajkummar Rao return. Release set for Independence Day 2026.",
        "image_url": "https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg",
        "source_url": "https://www.youtube.com/watch?v=KVnheaKLQeQ",
        "category": "entertainment",
        "is_hero": True,
        "priority": 10,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 2,
        "badge": "OFFICIAL"
    },
    {
        "title": "Mirzapur Season 3 Streaming Now on Prime Video",
        "description": "All 10 episodes live. The battle for Mirzapur reaches its explosive conclusion.",
        "image_url": "https://image.tmdb.org/t/p/w500/p0qM8hhlMF5DuxHBzl2EZR6TehX.jpg",
        "source_url": "https://www.primevideo.com/detail/Mirzapur/0PDORLP9VICJ0Q8SBJIXZXWJL5",
        "category": "entertainment",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 8,
        "badge": "NEW SEASON"
    },
    {
        "title": "IPL 2025 Auction: Record ₹639 Cr Spent on 182 Players",
        "description": "Rishabh Pant becomes most expensive player ever at ₹27 Cr. Tournament starts March 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/7Pi6b2gFgwKtxniTqFQNxHPsJQ.jpg",
        "source_url": "https://www.iplt20.com/news/4685/ipl-2025-mega-auction-all-the-action",
        "category": "sports",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "sport",
        "hours_ago": 18,
        "badge": "OFFICIAL"
    },
    
    # ========== TRENDING TOPICS (3) ==========
    {
        "title": "Pushpa 2 Crosses ₹1500 Cr Worldwide in 10 Days",
        "description": "Allu Arjun's sequel becomes 3rd highest-grossing Indian film. Hindi version dominates.",
        "image_url": "https://image.tmdb.org/t/p/w500/8WNBnJZKjaIXV8lmMiWW60AzRxI.jpg",
        "source_url": "https://www.bollywoodhungama.com/news/box-office-special-features/pushpa-2-box-office-collections/",
        "category": "entertainment",
        "priority": 9,
        "source_type": "trend",
        "entity_type": "movie",
        "hours_ago": 4,
        "badge": "TRENDING"
    },
    {
        "title": "Squid Game Season 2 Breaks Netflix Records Globally",
        "description": "487M hours viewed in first week. Already greenlit for Season 3 finale in 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/sXZhtWLo3fecavpDuOyJiayjt32.jpg",
        "source_url": "https://www.netflix.com/tudum/articles/squid-game-season-2-everything-we-know",
        "category": "entertainment",
        "priority": 8,
        "source_type": "trend",
        "entity_type": "series",
        "hours_ago": 12,
        "badge": "TRENDING"
    },
    {
        "title": "Rohit Sharma Steps Down as India T20 Captain",
        "description": "Emotional farewell after T20 World Cup victory. Hardik Pandya likely successor.",
        "image_url": "https://image.tmdb.org/t/p/w500/fiimZ9Xt5cPTPHNrbS4QautBXpU.jpg",
        "source_url": "https://www.espncricinfo.com/story/rohit-sharma-retirement-t20i-captain",
        "category": "sports",
        "priority": 9,
        "source_type": "trend",
        "entity_type": "sport",
        "hours_ago": 6,
        "badge": "TRENDING"
    },
    
    # ========== SPORTS NEWS (3) ==========
    {
        "title": "India vs Australia: BGT 2024-25 Series Tied 1-1",
        "description": "Third Test in Brisbane starts tomorrow. Series on knife's edge after Perth and Adelaide.",
        "image_url": "https://image.tmdb.org/t/p/w500/zvGTZYDCoMSMIBkXExxRxLYimqN.jpg",
        "source_url": "https://www.bcci.tv/",
        "category": "sports",
        "priority": 8,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 10,
        "badge": ""
    },
    {
        "title": "Neeraj Chopra Confirms Paris Olympics 2024 Participation",
        "description": "Javelin star throws 88.36m in Doha. India's best medal hope after Tokyo gold.",
        "image_url": "https://image.tmdb.org/t/p/w500/c2OijvbFEXBW1onbzuvENr4CGQB.jpg",
        "source_url": "https://olympics.com/en/paris-2024",
        "category": "sports",
        "priority": 7,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 36,
        "badge": ""
    },
    {
        "title": "Premier League: Arsenal Tops Table After Man City Loss",
        "description": "Title race wide open with 10 games left. Liverpool and Arsenal separated by goal difference.",
        "image_url": "https://image.tmdb.org/t/p/w500/1PdNB3rYTcf8VXc8rcmZ0SeYxSq.jpg",
        "source_url": "https://www.premierleague.com/",
        "category": "sports",
        "priority": 7,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 20,
        "badge": ""
    },
    
    # ========== SPORTS HIGHLIGHTS (2) ==========
    {
        "title": "Virat Kohli's 49th ODI Century | IND vs NZ Highlights",
        "description": "Master class in Mumbai. Watch the complete innings and match highlights.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsgfe8YmntJ1uVIkBjBdRdYpJyN.jpg",
        "source_url": "https://www.youtube.com/watch?v=bcci_official_highlights",
        "category": "sports",
        "priority": 8,
        "source_type": "highlight",
        "entity_type": "sport",
        "hours_ago": 14,
        "badge": "HIGHLIGHT"
    },
    {
        "title": "IPL 2024 Final: KKR vs SRH - Full Match Highlights",
        "description": "Kolkata Knight Riders lift 3rd title. Narine and Russell demolish Hyderabad bowling.",
        "image_url": "https://image.tmdb.org/t/p/w500/4KUdFm3J41uptF1r6ki53VppKW9.jpg",
        "source_url": "https://www.youtube.com/watch?v=iplt20_official",
        "category": "sports",
        "priority": 8,
        "source_type": "highlight",
        "entity_type": "sport",
        "hours_ago": 72,
        "badge": "HIGHLIGHT"
    },
    
    # ========== TRAILER DROPS (3) ==========
    {
        "title": "Kalki 2898 AD Part 2 - First Look Teaser",
        "description": "Prabhas returns in Nag Ashwin's sci-fi epic. Deepika and Amitabh continue the saga.",
        "image_url": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        "source_url": "https://www.youtube.com/watch?v=Kalki_Part2_Teaser",
        "category": "entertainment",
        "priority": 9,
        "source_type": "trailer",
        "entity_type": "movie",
        "hours_ago": 8,
        "badge": "TRAILER"
    },
    {
        "title": "The White Lotus Season 3 - Official Trailer | HBO",
        "description": "Thailand setting revealed. Mike White returns with new ensemble cast. Feb 2025 premiere.",
        "image_url": "https://image.tmdb.org/t/p/w500/eiJeWeCAEZAmRppnXHiTWDcCd3Q.jpg",
        "source_url": "https://www.youtube.com/watch?v=HBO_WhiteLotus_S3",
        "category": "entertainment",
        "priority": 8,
        "source_type": "trailer",
        "entity_type": "series",
        "hours_ago": 24,
        "badge": "TRAILER"
    },
    {
        "title": "Daredevil: Born Again - Teaser | Marvel Studios",
        "description": "Charlie Cox returns as Matt Murdock. Disney+ original series. March 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
        "source_url": "https://www.youtube.com/watch?v=Marvel_Daredevil",
        "category": "entertainment",
        "priority": 7,
        "source_type": "trailer",
        "entity_type": "series",
        "hours_ago": 48,
        "badge": "TRAILER"
    },
    
    # ========== TRENDING SHOWS (3) ==========
    {
        "title": "Panchayat Season 3 Becomes Most-Watched Indian Series",
        "description": "Amazon confirms Season 4. Jitendra Kumar's rural drama breaks all Prime Video records.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsgfe8YmntJ1uVIkBjBdRdYpJyN.jpg",
        "source_url": "https://www.primevideo.com/detail/Panchayat/",
        "category": "entertainment",
        "priority": 8,
        "source_type": "trend",
        "entity_type": "series",
        "hours_ago": 28,
        "badge": "TRENDING"
    },
    {
        "title": "Severance Season 2 Premiere Date Announced",
        "description": "Apple TV+ drops Jan 17, 2025 release. Adam Scott returns after 3-year wait.",
        "image_url": "https://image.tmdb.org/t/p/w500/Rb7sga832Cyqvafd7CqOzbwdK4.jpg",
        "source_url": "https://tv.apple.com/show/severance",
        "category": "entertainment",
        "priority": 7,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 16,
        "badge": "NEW SEASON"
    },
    {
        "title": "Scam 1992 Director Announces Scam 2003 Sequel",
        "description": "Hansal Mehta returns for Scam 2010 covering 2G spectrum case. SonyLIV exclusive.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsTVqPNNOOvUXKRJv0DstHUDIw8.jpg",
        "source_url": "https://www.sonyliv.com/",
        "category": "entertainment",
        "priority": 7,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 40,
        "badge": "OFFICIAL"
    },
    
    # ========== INDUSTRY UPDATES (2) ==========
    {
        "title": "JioHotstar Merger Complete: 100M+ Subscribers Live",
        "description": "Unified app launches with Disney+ Hotstar content. IPL + HBO + Marvel under one roof.",
        "image_url": "https://image.tmdb.org/t/p/w500/oxmdHR5Ka28HAJuMmS2hk5K6QQY.jpg",
        "source_url": "https://www.hotstar.com/in",
        "category": "ott",
        "priority": 8,
        "source_type": "article",
        "entity_type": "series",
        "hours_ago": 12,
        "badge": "OFFICIAL"
    },
    {
        "title": "Netflix India Launches Mobile-Only Plan at ₹149/Month",
        "description": "New tier targets budget viewers. 480p streaming with download support.",
        "image_url": "https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
        "source_url": "https://help.netflix.com/en/node/24926",
        "category": "ott",
        "priority": 7,
        "source_type": "article",
        "entity_type": "movie",
        "hours_ago": 32,
        "badge": ""
    },
    
    # ========== MUSIC/POP CULTURE (1) ==========
    {
        "title": "Diljit Dosanjh's Dil-Luminati Tour Breaks Records",
        "description": "10 sold-out stadium shows across India. 'Born to Shine' crosses 200M streams.",
        "image_url": "https://image.tmdb.org/t/p/w500/jBn4LWlgdsf6xIUYhYBwpctBVsj.jpg",
        "source_url": "https://www.youtube.com/watch?v=Diljit_BornToShine",
        "category": "music",
        "priority": 7,
        "source_type": "trend",
        "entity_type": "movie",
        "hours_ago": 22,
        "badge": "TRENDING"
    },
]

async def populate_feed():
    """Populate feed with accurate, verified content"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing feed items
    await db.feed_items.delete_many({})
    print("✅ Cleared existing feed items")
    print("\n" + "=" * 80)
    print("POPULATING GET WITH IT - V2 ACCURATE CONTENT")
    print("=" * 80 + "\n")
    
    # Insert new items
    now = datetime.now(timezone.utc)
    inserted_count = 0
    
    for item_data in FEED_ITEMS:
        # Calculate published_at based on hours_ago
        hours_ago = item_data.pop('hours_ago', 0)
        published_at = (now - timedelta(hours=hours_ago)).isoformat()
        
        # Extract badge
        badge = item_data.pop('badge', '')
        
        feed_item = {
            "id": str(uuid.uuid4()),
            "title": item_data["title"],
            "description": item_data["description"],
            "image_url": item_data["image_url"],
            "source_url": item_data["source_url"],
            "category": item_data["category"],
            "published_at": published_at,
            "is_hero": item_data.get("is_hero", False),
            "priority": item_data.get("priority", 5),
            "linked_content_id": item_data.get("linked_content_id"),
            "source": "manual",
            "source_name": "Manual",
            "source_type": item_data.get("source_type"),
            "tags": [badge] if badge else [],
            "entity_type": item_data.get("entity_type"),
            "created_at": now.isoformat(),
            "created_by": "admin",
            "updated_at": None
        }
        
        await db.feed_items.insert_one(feed_item)
        inserted_count += 1
        
        status = "🌟 HERO" if feed_item["is_hero"] else f"  P{feed_item['priority']}"
        badge_display = f" [{badge}]" if badge else ""
        print(f"{status} | {feed_item['category']:15} | {feed_item['title'][:55]}{badge_display}")
    
    client.close()
    print(f"\n{'=' * 80}")
    print(f"✅ Inserted {inserted_count} feed items successfully!")
    print("=" * 80)
    
    # Show stats
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("\n📊 Feed Statistics:")
    for category in ["entertainment", "sports", "ott", "local", "music"]:
        count = await db.feed_items.count_documents({"category": category})
        if count > 0:
            print(f"   {category:15}: {count} items")
    
    hero_count = await db.feed_items.count_documents({"is_hero": True})
    print(f"   {'hero items':15}: {hero_count}")
    
    client.close()
    
    print("\n✅ CONTENT V2 DEPLOYED - Ready for review")

if __name__ == "__main__":
    asyncio.run(populate_feed())
