#!/usr/bin/env python3
"""
Populate Get With It feed with 20 curated items for focus group demo
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import uuid

load_dotenv('.env')

# Feed items based on the content matrix
FEED_ITEMS = [
    # A. Major Launch Announcements (3)
    {
        "title": "Stree 3 Confirmed: Shraddha Kapoor & Rajkummar Rao Return",
        "description": "Horror-comedy franchise expands with third installment. Production begins Q1 2026.",
        "image_url": "https://image.tmdb.org/t/p/w500/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg",
        "source_url": "https://www.youtube.com/watch?v=BZiOfVGDW_k",
        "category": "entertainment",
        "is_hero": True,
        "priority": 10,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 3
    },
    {
        "title": "Mirzapur: The Film – Official Announcement",
        "description": "Amazon Prime confirms Mirzapur movie spin-off. Release date: Diwali 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/p0qM8hhlMF5DuxHBzl2EZR6TehX.jpg",
        "source_url": "https://www.primevideo.com/",
        "category": "entertainment",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 6
    },
    {
        "title": "IPL 2025: Opening Ceremony ft. Diljit Dosanjh",
        "description": "Biggest cricket festival kicks off March 22nd. 10 teams, 74 matches, JioHotstar live.",
        "image_url": "https://image.tmdb.org/t/p/w500/kOYlMHtNSqnf1FgsoK1JJypfkrY.jpg",
        "source_url": "https://www.hotstar.com/in",
        "category": "sports",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "sport",
        "hours_ago": 12
    },
    
    # B. Trending Topics (3)
    {
        "title": "Pushpa 2: The Rule Crosses ₹1500 Cr Worldwide",
        "description": "Allu Arjun's blockbuster becomes 3rd highest-grossing Indian film ever.",
        "image_url": "https://image.tmdb.org/t/p/w500/8WNBnJZKjaIXV8lmMiWW60AzRxI.jpg",
        "source_url": "https://www.youtube.com/watch?v=KC3rD6WQLzE",
        "category": "entertainment",
        "priority": 8,
        "source_type": "trend",
        "entity_type": "movie",
        "hours_ago": 5
    },
    {
        "title": "The White Lotus Season 3 Breaks HBO Records",
        "description": "Thailand setting captivates viewers. 15M premiere views in first 48 hours.",
        "image_url": "https://image.tmdb.org/t/p/w500/eiJeWeCAEZAmRppnXHiTWDcCd3Q.jpg",
        "source_url": "https://www.hotstar.com/in",
        "category": "entertainment",
        "priority": 7,
        "source_type": "trend",
        "entity_type": "series",
        "hours_ago": 18
    },
    {
        "title": "Virat Kohli Retirement Rumors: BCCI Responds",
        "description": "Official statement expected tomorrow. Indian cricket fans on edge.",
        "image_url": "https://image.tmdb.org/t/p/w500/rhxP4qaHvheSzM5iVIxSg9D6nU4.jpg",
        "source_url": "https://www.cricbuzz.com/",
        "category": "sports",
        "priority": 10,
        "source_type": "trend",
        "entity_type": "sport",
        "hours_ago": 2
    },
    
    # C. Sports News (3)
    {
        "title": "Rohit Sharma Named T20 World Cup Captain",
        "description": "BCCI announces squad for June tournament. Hardik Pandya vice-captain.",
        "image_url": "https://image.tmdb.org/t/p/w500/ggb3Qr0TKFxSXnidFuOCKCt3iT4.jpg",
        "source_url": "https://www.espncricinfo.com/",
        "category": "sports",
        "priority": 7,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 24
    },
    {
        "title": "Man City vs Arsenal: Title Decider This Sunday",
        "description": "Premier League's biggest clash. Both teams level on points with 5 games left.",
        "image_url": "https://image.tmdb.org/t/p/w500/1PdNB3rYTcf8VXc8rcmZ0SeYxSq.jpg",
        "source_url": "https://www.premierleague.com/",
        "category": "sports",
        "priority": 8,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 8
    },
    {
        "title": "Neeraj Chopra Qualifies for Paris Olympics 2024",
        "description": "Javelin star throws 87.92m in Finland. India's medal hope confirmed.",
        "image_url": "https://image.tmdb.org/t/p/w500/c2OijvbFEXBW1onbzuvENr4CGQB.jpg",
        "source_url": "https://olympics.com/",
        "category": "sports",
        "priority": 6,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 48
    },
    
    # D. Sports Highlights (2)
    {
        "title": "MI vs CSK: Last Over Thriller | IPL 2024 Highlights",
        "description": "Dhoni finishes in style. 6, 4, 6 off final 3 balls. Watch extended highlights.",
        "image_url": "https://image.tmdb.org/t/p/w500/4KUdFm3J41uptF1r6ki53VppKW9.jpg",
        "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "category": "sports",
        "priority": 9,
        "source_type": "highlight",
        "entity_type": "sport",
        "hours_ago": 4
    },
    {
        "title": "Messi's Free Kick vs Brazil | Copa América Final",
        "description": "Argentina captain seals 16th international trophy. Emotional celebration.",
        "image_url": "https://image.tmdb.org/t/p/w500/eEwe68oPFFDU4ehZ3sXiETE44Rt.jpg",
        "source_url": "https://www.youtube.com/watch?v=FreeKick2024",
        "category": "sports",
        "priority": 8,
        "source_type": "highlight",
        "entity_type": "sport",
        "hours_ago": 36
    },
    
    # E. Trailer Drops (3)
    {
        "title": "Kalki 2898 AD – Final Trailer",
        "description": "Prabhas, Deepika, Amitabh in epic sci-fi saga. June 27 worldwide release.",
        "image_url": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        "source_url": "https://www.youtube.com/watch?v=Kalki2898",
        "category": "entertainment",
        "priority": 9,
        "source_type": "trailer",
        "entity_type": "movie",
        "hours_ago": 10
    },
    {
        "title": "Daredevil: Born Again – Official Trailer | Marvel",
        "description": "Charlie Cox returns. Disney+ original. March 4, 2025.",
        "image_url": "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
        "source_url": "https://www.youtube.com/watch?v=Daredevil2025",
        "category": "entertainment",
        "priority": 7,
        "source_type": "trailer",
        "entity_type": "series",
        "hours_ago": 72
    },
    {
        "title": "The Last of Us Part II – Teaser | HBO",
        "description": "Season 2 first look. Pedro Pascal, Bella Ramsey. 2026 premiere confirmed.",
        "image_url": "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg",
        "source_url": "https://www.youtube.com/watch?v=TLOU_S2",
        "category": "entertainment",
        "priority": 8,
        "source_type": "trailer",
        "entity_type": "series",
        "hours_ago": 20
    },
    
    # F. Trending Shows (3)
    {
        "title": "Squid Game S2 Tops Global Netflix Charts",
        "description": "456M hours viewed in first week. Already renewed for Season 3.",
        "image_url": "https://image.tmdb.org/t/p/w500/sXZhtWLo3fecavpDuOyJiayjt32.jpg",
        "source_url": "https://www.netflix.com/title/81040344",
        "category": "entertainment",
        "priority": 8,
        "source_type": "trend",
        "entity_type": "series",
        "hours_ago": 14
    },
    {
        "title": "Panchayat Season 4 Confirmed by Amazon",
        "description": "Beloved comedy-drama returns 2025. Jitendra Kumar teases major plot twist.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsgfe8YmntJ1uVIkBjBdRdYpJyN.jpg",
        "source_url": "https://www.primevideo.com/",
        "category": "entertainment",
        "priority": 7,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 28
    },
    {
        "title": "Scam 2003: The Telgi Story Wins Best Series",
        "description": "SonyLIV original sweeps Filmfare OTT Awards. Gagan Dev Riar praised.",
        "image_url": "https://image.tmdb.org/t/p/w500/wsTVqPNNOOvUXKRJv0DstHUDIw8.jpg",
        "source_url": "https://www.sonyliv.com/",
        "category": "entertainment",
        "priority": 6,
        "source_type": "trend",
        "entity_type": "series",
        "hours_ago": 60
    },
    
    # G. Industry Updates (2)
    {
        "title": "Netflix India Announces ₹500 Mobile-Only Plan",
        "description": "New pricing tier targets budget-conscious viewers. 10M+ sign-ups expected.",
        "image_url": "https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
        "source_url": "https://www.netflix.com/in/",
        "category": "ott",
        "priority": 6,
        "source_type": "article",
        "entity_type": "movie",
        "hours_ago": 32
    },
    {
        "title": "JioHotstar Merger Complete: 100M+ Subscribers",
        "description": "Combined platform launches unified app. IPL + HBO + Disney content library.",
        "image_url": "https://image.tmdb.org/t/p/w500/oxmdHR5Ka28HAJuMmS2hk5K6QQY.jpg",
        "source_url": "https://www.hotstar.com/in",
        "category": "ott",
        "priority": 7,
        "source_type": "article",
        "entity_type": "series",
        "hours_ago": 16
    },
    
    # H. Music / Pop Culture (1)
    {
        "title": "Diljit Dosanjh's 'Born to Shine' Hits 100M Views",
        "description": "Punjabi superstar's latest track goes viral. Collaboration with Ed Sheeran rumored.",
        "image_url": "https://image.tmdb.org/t/p/w500/jBn4LWlgdsf6xIUYhYBwpctBVsj.jpg",
        "source_url": "https://www.youtube.com/watch?v=BornToShine",
        "category": "music",
        "priority": 7,
        "source_type": "trend",
        "entity_type": "movie",
        "hours_ago": 22
    },
]

async def populate_feed():
    """Populate feed with curated items"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing feed items
    await db.feed_items.delete_many({})
    print("✅ Cleared existing feed items")
    
    # Insert new items
    now = datetime.now(timezone.utc)
    inserted_count = 0
    
    for item_data in FEED_ITEMS:
        # Calculate published_at based on hours_ago
        hours_ago = item_data.pop('hours_ago', 0)
        published_at = (now - timedelta(hours=hours_ago)).isoformat()
        
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
            "tags": item_data.get("tags", []),
            "entity_type": item_data.get("entity_type"),
            "created_at": now.isoformat(),
            "created_by": "admin",
            "updated_at": None
        }
        
        await db.feed_items.insert_one(feed_item)
        inserted_count += 1
        status = "🌟 HERO" if feed_item["is_hero"] else f"  P{feed_item['priority']}"
        print(f"{status} | {feed_item['category']:15} | {feed_item['title'][:60]}")
    
    client.close()
    print(f"\n✅ Inserted {inserted_count} feed items successfully!")
    
    # Show stats
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("\n📊 Feed Statistics:")
    for category in ["entertainment", "sports", "ott", "local", "music"]:
        count = await db.feed_items.count_documents({"category": category})
        print(f"   {category:15}: {count} items")
    
    hero_count = await db.feed_items.count_documents({"is_hero": True})
    print(f"   {'hero items':15}: {hero_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_feed())
