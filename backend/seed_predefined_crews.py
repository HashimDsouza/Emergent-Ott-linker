#!/usr/bin/env python3
"""
Seed 6 Predefined Popular Crews for Header Capsules
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('.env')

PREDEFINED_CREWS = [
    {
        "id": "cricket-crazy",
        "name": "Cricket Crazy",
        "icon": "🏏",
        "description": "For fans who live and breathe cricket. IPL, World Cups, Test matches - we cover it all!",
        "member_count": 12547,
        "is_predefined": True,
        "color": "#00A651"  # Cricket green
    },
    {
        "id": "bollywood-buffs",
        "name": "Bollywood Buffs",
        "icon": "🎬",
        "description": "Lights, camera, action! Your home for all things Bollywood - from blockbusters to indie gems.",
        "member_count": 10234,
        "is_predefined": True,
        "color": "#FFD700"  # Gold
    },
    {
        "id": "international-bingers",
        "name": "International Bingers",
        "icon": "🌍",
        "description": "Netflix, HBO, Disney+ and beyond. For lovers of global streaming content.",
        "member_count": 9876,
        "is_predefined": True,
        "color": "#FF4F64"  # Coral
    },
    {
        "id": "football-fanatics",
        "name": "Football Fanatics",
        "icon": "⚽",
        "description": "Premier League, La Liga, Champions League - unite with fellow football lovers here.",
        "member_count": 8234,
        "is_predefined": True,
        "color": "#0066CC"  # Football blue
    },
    {
        "id": "music-mavens",
        "name": "Music Mavens",
        "icon": "🎵",
        "description": "From Diljit to Drake, Arijit to Ariana - celebrate all genres and artists.",
        "member_count": 7123,
        "is_predefined": True,
        "color": "#9333EA"  # Purple
    },
    {
        "id": "regional-riders",
        "name": "Regional Riders",
        "icon": "🇮🇳",
        "description": "Tamil, Telugu, Malayalam, Kannada, Bengali - regional cinema finds its home here.",
        "member_count": 6543,
        "is_predefined": True,
        "color": "#FF6B2C"  # Saffron
    },
]

async def seed_crews():
    """Seed predefined popular crews"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    print("✅ Starting to seed predefined crews...")
    print("=" * 80)
    
    now = datetime.now(timezone.utc).isoformat()
    
    for crew_data in PREDEFINED_CREWS:
        # Check if crew already exists
        existing = await db.crews.find_one({"id": crew_data["id"]})
        
        if existing:
            # Update it
            await db.crews.update_one(
                {"id": crew_data["id"]},
                {"$set": {
                    **crew_data,
                    "updated_at": now
                }}
            )
            print(f"✅ Updated: {crew_data['icon']} {crew_data['name']} ({crew_data['member_count']:,} members)")
        else:
            # Insert new
            crew_doc = {
                **crew_data,
                "founder_id": "system",
                "created_at": now,
                "updated_at": now
            }
            await db.crews.insert_one(crew_doc)
            print(f"✨ Created: {crew_data['icon']} {crew_data['name']} ({crew_data['member_count']:,} members)")
    
    print("=" * 80)
    print(f"✅ Seeded {len(PREDEFINED_CREWS)} predefined crews")
    print("\n📋 Header Capsules Ready:")
    for i, crew in enumerate(PREDEFINED_CREWS, 1):
        print(f"   {i}. {crew['icon']} {crew['name']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_crews())
