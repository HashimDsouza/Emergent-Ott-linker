"""
Curate Trays with 60-40 International-Indian Balance
=====================================================
Strategy:
- Top 10 trays: 6 international + 4 Indian
- Buzzing Now: 6 international + 4 Indian  
- New content: 60% international + 40% Indian
- All platforms balanced
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from datetime import datetime

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# Color codes
class Colors:
    HEADER = '\033[95m'
    OKGREEN = '\033[92m'
    OKCYAN = '\033[96m'
    WARNING = '\033[93m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")


def is_indian_content(content):
    """Determine if content is Indian based on language"""
    indian_languages = ['hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'pa']
    language = content.get('language', 'en')
    
    if language in indian_languages:
        return True
    
    # Check title and description for Indian keywords
    text = f"{content.get('title', '')} {content.get('description', '')}".lower()
    indian_keywords = ['bollywood', 'hindi', 'tamil', 'telugu', 'mumbai', 'delhi', 'india']
    
    return any(keyword in text for keyword in indian_keywords)


async def get_balanced_content(db, query, total_count=10, international_ratio=0.6):
    """Fetch content with specified international-Indian balance"""
    international_count = int(total_count * international_ratio)
    indian_count = total_count - international_count
    
    # Fetch all matching content
    all_content = await db.content.find(query).sort([('rating', -1), ('year', -1)]).to_list(length=100)
    
    international = []
    indian = []
    
    # Separate into international and Indian
    for content in all_content:
        if is_indian_content(content):
            indian.append(content)
        else:
            international.append(content)
    
    # Select based on ratio
    selected_international = international[:international_count]
    selected_indian = indian[:indian_count]
    
    # Combine and return
    result = selected_international + selected_indian
    
    return result, len(selected_international), len(selected_indian)


async def curate_trays():
    """Main curation function with 60-40 balance"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.test_database
    
    print_header("Curating Trays with 60-40 International-Indian Balance")
    
    curation_data = {}
    
    # 1. TOP 10 TRENDING (6 international + 4 Indian)
    print_header("🔥 Top 10 Trending (6 International + 4 Indian)")
    
    top10_query = {'is_trending': True, 'rating': {'$gte': 6.0}}
    top10, int_count, ind_count = await get_balanced_content(db, top10_query, total_count=10, international_ratio=0.6)
    
    curation_data['top10'] = []
    for idx, title in enumerate(top10, 1):
        marker = '🇮🇳' if is_indian_content(title) else '🌍'
        print_info(f"{idx}. {marker} {title['title']} ({title['platform']}) - ⭐{title['rating']:.1f}")
        curation_data['top10'].append(str(title['_id']))
    
    print_success(f"Balance: {int_count} international, {ind_count} Indian")
    
    # 2. BUZZING NOW (6 international + 4 Indian)
    print_header("🔥 Buzzing Now (6 International + 4 Indian)")
    
    buzzing_query = {
        '$or': [
            {'is_trending': True},
            {'year': {'$gte': '2024'}, 'rating': {'$gte': 7.0}}
        ]
    }
    buzzing, int_count, ind_count = await get_balanced_content(db, buzzing_query, total_count=10, international_ratio=0.6)
    
    curation_data['buzzing_now'] = []
    for idx, title in enumerate(buzzing, 1):
        marker = '🇮🇳' if is_indian_content(title) else '🌍'
        print_info(f"{idx}. {marker} {title['title']} ({title['platform']}) - ⭐{title['rating']:.1f}")
        curation_data['buzzing_now'].append(str(title['_id']))
    
    print_success(f"Balance: {int_count} international, {ind_count} Indian")
    
    # 3. NEW CONTENT (60% international + 40% Indian)
    print_header("✨ New Content (60% International + 40% Indian)")
    
    new_query = {'year': {'$gte': '2024'}}
    new_content, int_count, ind_count = await get_balanced_content(db, new_query, total_count=10, international_ratio=0.6)
    
    curation_data['new_content'] = []
    for idx, title in enumerate(new_content, 1):
        marker = '🇮🇳' if is_indian_content(title) else '🌍'
        print_info(f"{idx}. {marker} {title['title']} ({title['platform']}) - {title['year']} - ⭐{title['rating']:.1f}")
        curation_data['new_content'].append(str(title['_id']))
    
    print_success(f"Balance: {int_count} international, {ind_count} Indian")
    
    # 4. PLATFORM-SPECIFIC TOP 10 (60-40 balance per platform)
    print_header("📺 Platform-Specific Top 10s")
    
    platforms = ['Netflix', 'Prime Video', 'Disney+', 'JioHotstar', 'Apple TV']
    curation_data['platforms'] = {}
    
    for platform in platforms:
        platform_query = {'platform': platform}
        platform_content, int_count, ind_count = await get_balanced_content(
            db, platform_query, total_count=10, international_ratio=0.6
        )
        
        curation_data['platforms'][platform] = []
        print_info(f"\n{platform} Top 10:")
        
        for idx, title in enumerate(platform_content, 1):
            marker = '🇮🇳' if is_indian_content(title) else '🌍'
            print(f"   {idx}. {marker} {title['title']} - ⭐{title['rating']:.1f}")
            curation_data['platforms'][platform].append(str(title['_id']))
        
        print_success(f"   Balance: {int_count} international, {ind_count} Indian")
    
    # 5. HERO CAROUSEL (2-3 high-rated titles, mixed)
    print_header("🎬 Hero Carousel")
    
    hero_query = {'rating': {'$gte': 7.5}, 'year': {'$gte': '2023'}}
    hero_content = await db.content.find(hero_query).sort('rating', -1).limit(3).to_list(length=3)
    
    curation_data['hero'] = []
    for idx, title in enumerate(hero_content, 1):
        marker = '🇮🇳' if is_indian_content(title) else '🌍'
        print_info(f"{idx}. {marker} {title['title']} ({title['platform']}) - ⭐{title['rating']:.1f}")
        curation_data['hero'].append(str(title['_id']))
    
    # Save curation data
    print_header("💾 Saving Curation Data")
    
    with open('/app/backend/curation_ids.json', 'w') as f:
        json.dump(curation_data, f, indent=2)
    
    print_success("Curation data saved to: /app/backend/curation_ids.json")
    
    # Summary
    print_header("📊 Curation Summary")
    print_success(f"Top 10 Trending: {len(curation_data['top10'])} titles curated")
    print_success(f"Buzzing Now: {len(curation_data['buzzing_now'])} titles curated")
    print_success(f"New Content: {len(curation_data['new_content'])} titles curated")
    print_success(f"Hero Carousel: {len(curation_data['hero'])} titles curated")
    
    for platform, ids in curation_data['platforms'].items():
        print_success(f"{platform}: {len(ids)} titles curated")
    
    print_header("✅ All Trays Curated Successfully!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(curate_trays())
