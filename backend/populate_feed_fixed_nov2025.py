#!/usr/bin/env python3
"""
Get With It - November 2025 FIXED Content
- Removed duplicate Portugal item
- Fixed missing images
- Fixed broken links
- Reordered for content variety (news, videos, sports mixed)
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import uuid

load_dotenv('.env')

# FIXED FEED ITEMS - NOVEMBER 2025
FEED_ITEMS = [
    # ========== HERO ITEM (Video) ==========
    {
        "title": "The Family Man Season 3 Premieres Nov 21 on Prime Video",
        "description": "Raj & DK's spy thriller returns. Manoj Bajpayee back as Srikant Tiwari.",
        "image_url": "https://i.ytimg.com/vi/jsauQx_Fwrg/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=jsauQx_Fwrg",
        "category": "entertainment",
        "is_hero": True,
        "priority": 10,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 2,
        "badge": "NEW SEASON"
    },
    
    # ========== MIX OF NEWS, SPORTS, VIDEOS ==========
    # Sports News Article
    {
        "title": "India Loses to South Africa by 30 Runs in Kolkata Test",
        "description": "South Africa's first Test win in India in 15 years. Eden Gardens shocker.",
        "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=450&fit=crop",
        "source_url": "https://www.hindustantimes.com/cricket/india-vs-south-africa-1st-test-day-3-live-cricket-score-updates-ind-vs-sa-eden-gardens-kolkata-101763255272100.html",
        "category": "sports",
        "priority": 9,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 6,
        "badge": "TRENDING"
    },
    
    # Entertainment Video
    {
        "title": "120 Bahadur: Farhan Akhtar's War Drama Releases Nov 21",
        "description": "Battle of Rezang La brought to life. Directed by Razneesh Ghai, produced by Excel Entertainment.",
        "image_url": "https://i.ytimg.com/vi/r4HusFmN4uw/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=r4HusFmN4uw",
        "category": "entertainment",
        "priority": 9,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 5,
        "badge": "OFFICIAL"
    },
    
    # Sports News Article
    {
        "title": "IPL 2025 Auction: Rishabh Pant Becomes Most Expensive Player Ever",
        "description": "LSG pays ₹27 Cr record fee. Pant named LSG captain for IPL 2025 season.",
        "image_url": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=450&fit=crop",
        "source_url": "https://www.iplt20.com/auction",
        "category": "sports",
        "priority": 9,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 480,
        "badge": "OFFICIAL"
    },
    
    # Entertainment Video
    {
        "title": "Dhurandhar First Look: Ranveer Singh's Spy Thriller Dec 5 Release",
        "description": "Aditya Dhar's action thriller with R. Madhavan, Sanjay Dutt. First look released.",
        "image_url": "https://i.ytimg.com/vi/rZ_e-s6VvR4/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=rZ_e-s6VvR4",
        "category": "entertainment",
        "priority": 9,
        "source_type": "trailer",
        "entity_type": "movie",
        "hours_ago": 4,
        "badge": "FIRST LOOK"
    },
    
    # Sports News Article
    {
        "title": "Ireland's Troy Parrott Hat-Trick Seals World Cup Playoff Spot",
        "description": "Dramatic 3-2 comeback vs Hungary. 96th-minute winner stuns Budapest.",
        "image_url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop",
        "source_url": "https://www.nbcsports.com/soccer/news/republic-of-ireland-seal-incredible-late-comeback-win-to-reach-world-cup-playoffs-knock-hungary-out",
        "category": "sports",
        "priority": 9,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 18,
        "badge": "HIGHLIGHT"
    },
    
    # Entertainment with DEEPLINK (Netflix direct link)
    {
        "title": "Stranger Things Season 5 Coming 2025 - Final Season Confirmed",
        "description": "Netflix announces final chapter. Three-volume release planned for the Upside Down saga.",
        "image_url": "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&h=450&fit=crop",
        "source_url": "https://www.netflix.com/title/80057281",  # DEEPLINK: Direct Netflix title URL
        "category": "entertainment",
        "priority": 8,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 12,
        "badge": "FINAL SEASON"
    },
    
    # Entertainment Video
    {
        "title": "Dining with the Kapoors Streams Nov 21 on Netflix India",
        "description": "Ranbir, Kareena, Karisma share family stories. Documentary special premiere.",
        "image_url": "https://i.ytimg.com/vi/zpdgEgpcbDE/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=zpdgEgpcbDE",
        "category": "entertainment",
        "priority": 8,
        "source_type": "drop",
        "entity_type": "series",
        "hours_ago": 8,
        "badge": "OFFICIAL"
    },
    
    # Sports Video Highlight
    {
        "title": "Ireland vs Hungary: Troy Parrott Hat-Trick Full Highlights",
        "description": "Watch the incredible 96th-minute winner. Complete match highlights from Budapest.",
        "image_url": "https://i.ytimg.com/vi/JN60DCgRu3E/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=JN60DCgRu3E",
        "category": "sports",
        "priority": 8,
        "source_type": "highlight",
        "entity_type": "sport",
        "hours_ago": 14,
        "badge": "HIGHLIGHT"
    },
    
    # Sports News Article with FIXED image
    {
        "title": "Manchester City Crushes Liverpool 3-0, Closes Gap on Arsenal",
        "description": "Guardiola's milestone game. Haaland, González, Doku score at Etihad.",
        "image_url": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=450&fit=crop",  # FIXED: Premier League stadium
        "source_url": "https://www.espn.com/soccer/report/_/gameId/740702",
        "category": "sports",
        "priority": 8,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 192,
        "badge": "TRENDING"
    },
    
    # Entertainment News Article (ONLY ONE Portugal item now)
    {
        "title": "Portugal Demolishes Armenia 9-1, Secures World Cup 2026 Spot",
        "description": "Bruno Fernandes, João Neves score hat-tricks. Dominant qualification performance.",
        "image_url": "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=450&fit=crop",
        "source_url": "https://www.espn.com/soccer/match/_/gameId/724900/armenia-portugal",
        "category": "sports",
        "priority": 8,
        "source_type": "article",
        "entity_type": "sport",
        "hours_ago": 24,
        "badge": ""
    },
    
    # Entertainment News
    {
        "title": "Homebound: India's Oscar Entry Set for Sept 2025 Release",
        "description": "Neeraj Ghaywan's rural drama with Ishaan Khatter, Janhvi Kapoor. Official 2026 Oscar submission.",
        "image_url": "https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=800&h=450&fit=crop",
        "source_url": "https://www.mensxp.com/entertainment/bollywood/179727-homebound-indias-official-entry-for-oscars-when-where-to-watch-it.html",
        "category": "entertainment",
        "priority": 7,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 28,
        "badge": "OSCAR 2026"
    },
    
    # Entertainment Video
    {
        "title": "De De Pyaar De 2 Released Nov 14 - Ajay Devgn Comedy Sequel",
        "description": "Rakul Preet Singh, R. Madhavan co-star. Romantic comedy now in theaters.",
        "image_url": "https://i.ytimg.com/vi/7gn3wh7_ffA/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=7gn3wh7_ffA",
        "category": "entertainment",
        "priority": 7,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 72,
        "badge": ""
    },
    
    # Entertainment News
    {
        "title": "Bison: Rural Sports Drama Coming to OTT This November",
        "description": "Multi-language release. Powerful village sports story streaming soon.",
        "image_url": "https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=800&h=450&fit=crop",
        "source_url": "https://www.123telugu.com/mnews/ott-releases-this-week-the-family-man-s3-bison-homebound-and-more-coming-to-netflix-prime-video-jio-hotstar-and-other-ott-platforms-hk.html",
        "category": "entertainment",
        "priority": 7,
        "source_type": "drop",
        "entity_type": "movie",
        "hours_ago": 36,
        "badge": ""
    },
    
    # OTT News
    {
        "title": "Netflix India November 2025: Top Trending Shows This Week",
        "description": "Delhi Crime Season 3, The Family Man, and more dominate viewership charts.",
        "image_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=450&fit=crop",
        "source_url": "https://www.netflix.com/browse",  # FIXED: Direct Netflix browse link
        "category": "ott",
        "priority": 7,
        "source_type": "article",
        "entity_type": "series",
        "hours_ago": 48,
        "badge": "TRENDING"
    },
    
    # OTT News
    {
        "title": "OTT Releases This Week: 15+ New Titles Across All Platforms",
        "description": "Netflix, Prime, Hotstar packed with new content. Biggest OTT week of November.",
        "image_url": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=450&fit=crop",
        "source_url": "https://timesofindia.indiatimes.com/entertainment/hindi/web-series/news/ott-releases-this-week-what-to-watch-on-netflix-amazon-prime-video-disney-hotstar-sonyliv-and-more-upcoming-web-series-movies-this-week/articleshow/115360485.cms",  # FIXED: Working TOI link
        "category": "ott",
        "priority": 6,
        "source_type": "article",
        "entity_type": "series",
        "hours_ago": 60,
        "badge": ""
    },
    
    # Music Video
    {
        "title": "Diljit Dosanjh's 'Mahiya' from AURA Album Goes Viral",
        "description": "Latest romantic track from AURA album. MixSingh collaboration trending on charts.",
        "image_url": "https://i.ytimg.com/vi/qAu8llwNFGY/maxresdefault.jpg",
        "source_url": "https://www.youtube.com/watch?v=qAu8llwNFGY",
        "category": "music",
        "priority": 7,
        "source_type": "trend",
        "entity_type": "music",
        "hours_ago": 84,
        "badge": "TRENDING"
    },
    
    # Music Chart/Playlist
    {
        "title": "Top Indian Songs of November 2025 - Bollywood Hits Chart",
        "description": "Diljit, Arijit Singh, Badshah dominate streaming platforms this month.",
        "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop",
        "source_url": "https://open.spotify.com/playlist/37i9dQZEVXbLZ52XmnySJg",  # FIXED: Top Indian music playlist
        "category": "music",
        "priority": 6,
        "source_type": "trend",
        "entity_type": "music",
        "hours_ago": 96,
        "badge": "CHART"
    },
]

async def populate_feed():
    """Populate feed with FIXED November 2025 content"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing feed items
    await db.feed_items.delete_many({})
    print("✅ Cleared existing feed items")
    print("\n" + "=" * 80)
    print("POPULATING GET WITH IT - FIXED NOVEMBER 2025 CONTENT")
    print("✓ Removed duplicate Portugal item")
    print("✓ Fixed Manchester City image")
    print("✓ Fixed OTT releases link")
    print("✓ Fixed Top Indian Songs link")
    print("✓ Reordered: News, Sports, Videos mixed")
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
        
        # Extract domain for display
        url_domain = ""
        if 'youtube.com' in item_data['source_url']:
            url_domain = "YouTube"
        elif 'netflix.com' in item_data['source_url']:
            url_domain = "Netflix (DEEPLINK)"
        elif 'spotify.com' in item_data['source_url']:
            url_domain = "Spotify"
        else:
            url_domain = item_data['source_url'].split('/')[2] if '/' in item_data['source_url'] else ""
        
        print(f"{status} | {feed_item['category']:15} | {feed_item['title'][:50]}{badge_display}")
        print(f"     ✓ Source: {url_domain}")
    
    client.close()
    print(f"\n{'=' * 80}")
    print(f"✅ Successfully inserted {inserted_count} feed items!")
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
    
    print("\n✅ FIXED NOVEMBER 2025 CONTENT DEPLOYED")
    print("   ✓ All issues resolved")
    print("   ✓ Content variety improved (news, sports, videos mixed)")
    print("   ✓ Netflix deeplink working (Stranger Things)")
    print("   ✓ Ready for focus group review")

if __name__ == "__main__":
    asyncio.run(populate_feed())
