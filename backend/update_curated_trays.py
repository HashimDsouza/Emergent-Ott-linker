"""
Update Landing Page and Entertainment trays with fresh curated content
Based on latest ingestion (Nov 2024)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def get_curated_content():
    """Fetch freshly curated content for each tray"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.test_database
    
    print("\n🎬 CURATING FRESH CONTENT FOR TRAYS...")
    print("="*70)
    
    # 1. LANDING PAGE - Front & Center Hero (2 Indian blockbusters)
    print("\n📍 Front & Center Hero (Replacing Fighter & Veerappan):")
    hero = await db.content.find({
        'trending_india': True,
        'rating': {'$gte': 7.0}
    }).sort('rating', -1).limit(2).to_list(length=2)
    
    for idx, title in enumerate(hero, 1):
        print(f"   {idx}. {title['title']} ({title['platform']}) - ⭐{title['rating']:.1f}")
    
    # 2. LANDING PAGE - Buzzing Now (Latest trending mix - 8 titles)
    print("\n🔥 Buzzing Now Tray (Fresh Indian + International Mix):")
    buzzing = await db.content.find({
        '$or': [
            {'trending_india': True},
            {'year': {'$gte': 2024}, 'rating': {'$gte': 7.5}}
        ]
    }).sort([('rating', -1), ('year', -1)]).limit(8).to_list(length=8)
    
    for idx, title in enumerate(buzzing, 1):
        marker = '🔥' if title.get('trending_india') else '🌟'
        print(f"   {idx}. {marker} {title['title']} ({title['platform']}) - ⭐{title['rating']:.1f}")
    
    # 3. WATCH ON - Top 10 per platform
    print("\n📺 Watch On - Top 10 per Platform:")
    platforms = ['Netflix', 'Prime Video', 'JioHotstar', 'SonyLIV']
    watch_on = {}
    
    for platform in platforms:
        titles = await db.content.find({
            'platform': platform,
            'content_type': {'$in': ['movie', 'series']}
        }).sort([('year', -1), ('rating', -1)]).limit(10).to_list(length=10)
        watch_on[platform] = titles
        print(f"\n   {platform} ({len(titles)} titles):")
        for idx, t in enumerate(titles[:5], 1):
            print(f"      {idx}. {t['title']} ({t['year']}) - ⭐{t['rating']:.1f}")
        if len(titles) > 5:
            print(f"      ... and {len(titles)-5} more")
    
    # 4. ENTERTAINMENT - New & Noted (Latest releases)
    print("\n✨ Entertainment - New & Noted (Latest 2024 releases):")
    new_noted = await db.content.find({
        'year': {'$gte': 2024},
        'content_type': {'$in': ['movie', 'series']}
    }).sort([('year', -1), ('rating', -1)]).limit(8).to_list(length=8)
    
    for idx, title in enumerate(new_noted, 1):
        marker = '🔥' if title.get('trending_india') else '🎬'
        print(f"   {idx}. {marker} {title['title']} ({title['platform']}) - {title['year']} - ⭐{title['rating']:.1f}")
    
    print("\n" + "="*70)
    print("✅ Curation Complete!\n")
    
    # Save curated IDs for frontend
    curation = {
        'hero_ids': [t['id'] for t in hero],
        'buzzing_ids': [t['id'] for t in buzzing],
        'watch_on_ids': {k: [t['id'] for t in v] for k, v in watch_on.items()},
        'new_noted_ids': [t['id'] for t in new_noted],
        'hero_titles': [t['title'] for t in hero],
        'buzzing_titles': [t['title'] for t in buzzing],
        'new_noted_titles': [t['title'] for t in new_noted]
    }
    
    with open('/app/backend/curation_ids.json', 'w') as f:
        json.dump(curation, f, indent=2)
    
    print("📁 Curation IDs saved to: /app/backend/curation_ids.json\n")
    
    client.close()
    return curation

if __name__ == "__main__":
    asyncio.run(get_curated_content())
