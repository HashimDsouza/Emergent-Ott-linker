#!/usr/bin/env python3
"""
Populate Crew Feature - Predefined Crews
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv
import uuid

load_dotenv('.env')

# Predefined Crews
CREWS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Bollywood Buffs",
        "icon": "🎬",
        "description": "Where every premiere is an event. Every debate is personal. Bollywood isn't just cinema—it's our culture.",
        "founder_id": None,
        "member_count": 12543,
        "is_predefined": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Cricket Crazy",
        "icon": "🏏",
        "description": "We don't just watch cricket. We live it. Every ball, every boundary, every controversy.",
        "founder_id": None,
        "member_count": 8234,
        "is_predefined": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "International Bingers",
        "icon": "🌍",
        "description": "Hollywood blockbusters. K-drama marathons. Anime deep dives. The world is our content library.",
        "founder_id": None,
        "member_count": 15678,
        "is_predefined": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Football Fanatics",
        "icon": "⚽",
        "description": "Match day is sacred. Rivalries are real. Football is religion.",
        "founder_id": None,
        "member_count": 6892,
        "is_predefined": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Music Mavens",
        "icon": "🎵",
        "description": "From chartbusters to indie gems. Music is the soundtrack to everything.",
        "founder_id": None,
        "member_count": 9456,
        "is_predefined": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Regional Riders",
        "icon": "🌏",
        "description": "Tamil, Telugu, Punjabi, Marathi. Regional cinema hits different. We celebrate it all.",
        "founder_id": None,
        "member_count": 11234,
        "is_predefined": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def populate_crews():
    """Populate predefined crews"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing crews
    await db.crews.delete_many({"is_predefined": True})
    print("✅ Cleared existing predefined crews")
    
    print("\n" + "=" * 80)
    print("POPULATING CREW FEATURE - PREDEFINED CREWS")
    print("Statement-driven, personality-rich descriptions")
    print("=" * 80 + "\n")
    
    # Insert crews
    print("👥 CREWS:")
    for crew in CREWS:
        await db.crews.insert_one(crew)
        print(f"   {crew['icon']} {crew['name']}")
        print(f"      {crew['member_count']:,} members")
        print(f"      \"{crew['description'][:60]}...\"")
        print()
    
    client.close()
    
    print("=" * 80)
    print(f"✅ Successfully inserted {len(CREWS)} predefined crews!")
    print("=" * 80)
    
    print("\n🎯 Features Ready:")
    print("   ✓ 6 Predefined crews with personality")
    print("   ✓ Statement-driven descriptions")
    print("   ✓ Social proof (member counts)")
    print("   ✓ Users can create their own crews")
    print("   ✓ Watchlist integration ready")
    print("   ✓ Reactions system ready")
    print("\n🚀 Crew feature deployed!")

if __name__ == "__main__":
    asyncio.run(populate_crews())
