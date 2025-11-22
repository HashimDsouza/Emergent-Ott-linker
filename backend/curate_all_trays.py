#!/usr/bin/env python3
"""
Comprehensive Tray Curation Script
Implements refined curation rules across all app sections
"""

import pymongo
from datetime import datetime, timedelta
from collections import defaultdict
import random

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["connector"]

# Content Mix Ratios (Global Rule)
CONTENT_MIX = {
    'international': 0.50,
    'hindi': 0.35,
    'regional': 0.14,  # Tamil, Telugu, Malayalam
    'anime': 0.01
}

# Language Categories
INTERNATIONAL_LANGS = ['English', 'en']
HINDI_LANGS = ['Hindi', 'hi']
REGIONAL_LANGS = ['Tamil', 'Telugu', 'Malayalam', 'ta', 'te', 'ml']
ANIME_CATEGORY = 'anime'

# Track used titles to prevent duplicates
used_titles = set()

def get_language_category(language):
    """Categorize content by language"""
    if not language:
        return 'international'
    lang_lower = language.lower()
    if lang_lower in [l.lower() for l in INTERNATIONAL_LANGS]:
        return 'international'
    elif lang_lower in [l.lower() for l in HINDI_LANGS]:
        return 'hindi'
    elif lang_lower in [l.lower() for l in REGIONAL_LANGS]:
        return 'regional'
    return 'international'  # Default

def apply_content_mix(titles, target_count, mix_override=None):
    """Apply content mix ratio to title selection"""
    mix = mix_override or CONTENT_MIX
    
    # Categorize titles
    categorized = defaultdict(list)
    for title in titles:
        if title['id'] in used_titles:
            continue
        
        # Check if anime
        if title.get('category') == 'anime' or 'anime' in title.get('genres', []):
            categorized['anime'].append(title)
        else:
            cat = get_language_category(title.get('language', ''))
            categorized[cat].append(title)
    
    # Calculate target counts
    targets = {
        'international': int(target_count * mix['international']),
        'hindi': int(target_count * mix['hindi']),
        'regional': int(target_count * mix['regional']),
        'anime': max(1, int(target_count * mix['anime']))  # At least 1 if available
    }
    
    # Select titles
    selected = []
    for category, count in targets.items():
        available = categorized[category][:count]
        selected.extend(available)
    
    # Fill remaining slots if needed
    while len(selected) < target_count:
        # Try each category in priority order
        for cat in ['international', 'hindi', 'regional', 'anime']:
            remaining = [t for t in categorized[cat] if t not in selected]
            if remaining:
                selected.append(remaining[0])
                break
        else:
            break  # No more titles available
    
    return selected[:target_count]

def mark_titles_used(titles):
    """Mark titles as used to prevent duplicates"""
    for title in titles:
        used_titles.add(title['id'])

def get_current_month_range():
    """Get date range for current month"""
    now = datetime.now()
    start = datetime(now.year, now.month, 1)
    if now.month == 12:
        end = datetime(now.year + 1, 1, 1)
    else:
        end = datetime(now.year, now.month + 1, 1)
    return start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')

def curate_front_and_center():
    """
    Front & Center: Top 5 biggest shows of current year
    - NO SPORTS - Entertainment only
    - Pool of 10 titles (rotate 5 at a time)
    - Best ratings + recent releases
    """
    print("\n" + "="*60)
    print("CURATING: FRONT & CENTER (NO SPORTS)")
    print("="*60)
    
    # STRICT: Current year, no sports, high ratings
    year_start = f"{datetime.now().year}-01-01"
    
    query = {
        'release_date': {'$gte': year_start},
        'rating': {'$gte': 7.5},
        'category': {'$ne': 'sports'}  # EXCLUDE SPORTS
    }
    
    titles = list(db.content.find(query).sort([('rating', -1), ('release_date', -1)]).limit(30))
    
    if len(titles) < 10:
        # Fallback: Lower rating but keep current year
        query['rating'] = {'$gte': 7.0}
        titles = list(db.content.find(query).sort([('rating', -1), ('release_date', -1)]).limit(30))
    
    # Custom mix for hero
    hero_mix = {
        'international': 0.40,
        'hindi': 0.40,
        'regional': 0.10,
        'anime': 0.10
    }
    
    selected = apply_content_mix(titles, 10, mix_override=hero_mix)
    
    # Mark first 5 as primary, next 5 as rotation
    for i, title in enumerate(selected[:5]):
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                'curation_flags.front_and_center': True,
                'curation_flags.front_and_center_priority': i + 1,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    mark_titles_used(selected)
    
    print(f"✅ Selected {len(selected)} titles (5 primary, 5 rotation)")
    for i, t in enumerate(selected[:5]):
        print(f"   {i+1}. {t['title']} - {t.get('language', 'N/A')} - ⭐ {t['rating']}")
    
    return selected

def curate_buzzing_now():
    """
    Buzzing Now: Top shows of current week
    - IMDB 7.0+
    - NO SPORTS - Entertainment only
    - Latest releases from current year
    - Content mix: 50/35/14/1
    """
    print("\n" + "="*60)
    print("CURATING: BUZZING NOW (NO SPORTS)")
    print("="*60)
    
    # STRICT: Last 6 months only for freshness
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
    
    query = {
        'rating': {'$gte': 7.0},
        'release_date': {'$gte': six_months_ago},
        'category': {'$ne': 'sports'}  # EXCLUDE SPORTS
    }
    
    titles = list(db.content.find(query).sort([('release_date', -1), ('rating', -1)]).limit(30))
    
    if len(titles) < 6:
        # Fallback: Current year, no sports
        year_start = f"{datetime.now().year}-01-01"
        query['release_date'] = {'$gte': year_start}
        titles = list(db.content.find(query).sort([('release_date', -1), ('rating', -1)]).limit(30))
    
    selected = apply_content_mix(titles, 6)
    
    for i, title in enumerate(selected):
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                'curation_flags.buzzing_now': True,
                'curation_flags.buzzing_now_rank': i + 1,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    mark_titles_used(selected)
    
    print(f"✅ Selected {len(selected)} titles")
    for i, t in enumerate(selected):
        print(f"   {i+1}. {t['title']} - ⭐ {t['rating']}")
    
    return selected

def curate_must_watch_today():
    """
    Your Must Watch Today: Top shows of current year
    - NO SPORTS - Entertainment only
    - IMDB 7.5+ for quality
    - From current year
    """
    print("\n" + "="*60)
    print("CURATING: YOUR MUST WATCH TODAY (NO SPORTS)")
    print("="*60)
    
    # STRICT: Current year only, no sports
    year_start = f"{datetime.now().year}-01-01"
    
    query = {
        'release_date': {'$gte': year_start},
        'rating': {'$gte': 7.5},
        'category': {'$ne': 'sports'}  # EXCLUDE SPORTS
    }
    
    titles = list(db.content.find(query).sort([('rating', -1), ('release_date', -1)]).limit(30))
    
    if len(titles) < 6:
        # Fallback: Lower rating threshold but keep current year
        query['rating'] = {'$gte': 7.0}
        titles = list(db.content.find(query).sort([('rating', -1), ('release_date', -1)]).limit(30))
    
    selected = apply_content_mix(titles, 6)
    
    for i, title in enumerate(selected):
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                'curation_flags.must_watch_today': True,
                'curation_flags.must_watch_rank': i + 1,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    mark_titles_used(selected)
    
    print(f"✅ Selected {len(selected)} titles")
    for i, t in enumerate(selected):
        print(f"   {i+1}. {t['title']} - ⭐ {t['rating']}")
    
    return selected

def curate_new_and_noted():
    """
    New & Noted: Latest releases ONLY
    - NO SPORTS - Entertainment only
    - Last 90 days (strict freshness)
    - Sorted newest first
    """
    print("\n" + "="*60)
    print("CURATING: NEW & NOTED (LATEST RELEASES ONLY, NO SPORTS)")
    print("="*60)
    
    # STRICT: Last 90 days for true "new" content
    ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    
    query = {
        'release_date': {'$gte': ninety_days_ago},
        'category': {'$ne': 'sports'}  # EXCLUDE SPORTS
    }
    
    titles = list(db.content.find(query).sort('release_date', -1).limit(30))
    
    if len(titles) < 8:
        # Fallback: Last 6 months
        six_months_ago = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        query['release_date'] = {'$gte': six_months_ago}
        titles = list(db.content.find(query).sort('release_date', -1).limit(30))
    
    selected = apply_content_mix(titles, 8)
    
    for i, title in enumerate(selected):
        days_ago = (datetime.now() - datetime.strptime(title['release_date'], '%Y-%m-%d')).days
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                'curation_flags.new_and_noted': True,
                'curation_flags.new_and_noted_rank': i + 1,
                'curation_flags.days_since_release': days_ago,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    mark_titles_used(selected)
    
    print(f"✅ Selected {len(selected)} titles")
    for i, t in enumerate(selected):
        days_ago = (datetime.now() - datetime.strptime(t['release_date'], '%Y-%m-%d')).days
        print(f"   {i+1}. {t['title']} - Released {days_ago} days ago")
    
    return selected

def curate_bro_recommends():
    """
    Bro Recommends: Curated mix of underrated + trending
    - 3 underrated gems (IMDB 7.5+, <100k votes if available)
    - 2 trending up (recent, gaining buzz)
    - 1 Bro's wildcard pick
    """
    print("\n" + "="*60)
    print("CURATING: BRO RECOMMENDS")
    print("="*60)
    
    selected = []
    
    # 3 underrated gems (high rating, recent, not in other trays, NO SPORTS)
    year_start = f"{datetime.now().year}-01-01"
    query = {
        'rating': {'$gte': 7.5},
        'release_date': {'$gte': year_start},
        'category': {'$ne': 'sports'}  # NO SPORTS
    }
    gems = list(db.content.find(query).sort('rating', -1).limit(20))
    # Filter out already used titles
    gems = [t for t in gems if t['id'] not in used_titles]
    selected.extend(apply_content_mix(gems, 3))
    
    # 2 trending (recent releases, good ratings, NO SPORTS)
    month_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    query = {
        'rating': {'$gte': 7.0},
        'release_date': {'$gte': month_ago},
        'category': {'$ne': 'sports'}  # NO SPORTS
    }
    trending = list(db.content.find(query).sort([('release_date', -1), ('rating', -1)]).limit(15))
    trending = [t for t in trending if t['id'] not in used_titles]
    selected.extend(apply_content_mix(trending, 2))
    
    # 1 wildcard (high rating, any time, NO SPORTS)
    query = {
        'rating': {'$gte': 8.0},
        'category': {'$ne': 'sports'}  # NO SPORTS
    }
    wildcard = list(db.content.find(query).sort('rating', -1).limit(10))
    wildcard = [t for t in wildcard if t['id'] not in used_titles]
    if wildcard:
        selected.append(wildcard[0])
    
    for i, title in enumerate(selected):
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                'curation_flags.bro_recommends': True,
                'curation_flags.bro_recommends_rank': i + 1,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    mark_titles_used(selected)
    
    print(f"✅ Selected {len(selected)} titles")
    for i, t in enumerate(selected):
        print(f"   {i+1}. {t['title']} - ⭐ {t['rating']}")
    
    return selected

def curate_hidden_gems():
    """
    Hidden Gems: Quality content not in top trays
    - IMDB 7.0-8.5
    - Released in last 2 years
    - NOT in top 3 trays
    - Focus on regional content (40%)
    """
    print("\n" + "="*60)
    print("CURATING: HIDDEN GEMS")
    print("="*60)
    
    two_years_ago = (datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d')
    
    query = {
        'rating': {'$gte': 7.0, '$lte': 8.5},
        'release_date': {'$gte': two_years_ago}
    }
    
    titles = list(db.content.find(query).sort('rating', -1).limit(30))
    # Filter out used titles
    titles = [t for t in titles if t['id'] not in used_titles]
    
    # Custom mix for hidden gems (more regional)
    gems_mix = {
        'international': 0.30,
        'hindi': 0.30,
        'regional': 0.40,
        'anime': 0.00
    }
    
    selected = apply_content_mix(titles, 6, mix_override=gems_mix)
    
    for i, title in enumerate(selected):
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                'curation_flags.hidden_gems': True,
                'curation_flags.hidden_gems_rank': i + 1,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    mark_titles_used(selected)
    
    print(f"✅ Selected {len(selected)} titles")
    for i, t in enumerate(selected):
        print(f"   {i+1}. {t['title']} - {t.get('language', 'N/A')} - ⭐ {t['rating']}")
    
    return selected

def curate_platform_top_10(platform_name):
    """
    Platform Top 10: Weekly curated top content per platform
    - Based on IMDB + recency
    - Platform-specific content mix
    """
    print(f"\n{'='*60}")
    print(f"CURATING: {platform_name.upper()} TOP 10")
    print("="*60)
    
    # Platform-specific mixes
    platform_mixes = {
        'Netflix': {'international': 0.60, 'hindi': 0.30, 'regional': 0.10, 'anime': 0.00},
        'Prime Video': {'international': 0.30, 'hindi': 0.50, 'regional': 0.20, 'anime': 0.00},
        'Jiohotstar': {'international': 0.40, 'hindi': 0.40, 'regional': 0.20, 'anime': 0.00},
        'Sony LIV': {'international': 0.20, 'hindi': 0.50, 'regional': 0.30, 'anime': 0.00}
    }
    
    mix = platform_mixes.get(platform_name, CONTENT_MIX)
    
    query = {
        'platform': platform_name,
        'rating': {'$gte': 6.5}
    }
    
    titles = list(db.content.find(query).sort([('release_date', -1), ('rating', -1)]).limit(20))
    
    selected = apply_content_mix(titles, 10, mix_override=mix)
    
    flag_name = f'top_10_{platform_name.lower().replace(" ", "_")}'
    
    for i, title in enumerate(selected):
        db.content.update_one(
            {'id': title['id']},
            {'$set': {
                f'curation_flags.{flag_name}': True,
                f'curation_flags.{flag_name}_rank': i + 1,
                'curation_flags.updated_at': datetime.utcnow()
            }}
        )
    
    # Don't mark as globally used (can appear in platform-specific trays)
    
    print(f"✅ Selected {len(selected)} titles")
    for i, t in enumerate(selected):
        print(f"   {i+1}. {t['title']} - ⭐ {t['rating']}")
    
    return selected

def clear_all_curation_flags():
    """Clear existing curation flags before re-curating"""
    print("\n" + "="*60)
    print("CLEARING EXISTING CURATION FLAGS")
    print("="*60)
    
    db.content.update_many(
        {},
        {'$unset': {'curation_flags': ''}}
    )
    
    print("✅ All curation flags cleared")

def main():
    """Main curation process"""
    print("\n" + "="*60)
    print("COMPREHENSIVE TRAY CURATION")
    print("Starting at:", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("="*60)
    
    # Clear existing flags
    clear_all_curation_flags()
    
    # Reset used titles tracker
    global used_titles
    used_titles = set()
    
    # Curate all trays in priority order
    results = {}
    
    results['front_and_center'] = curate_front_and_center()
    results['buzzing_now'] = curate_buzzing_now()
    results['must_watch_today'] = curate_must_watch_today()
    results['new_and_noted'] = curate_new_and_noted()
    results['bro_recommends'] = curate_bro_recommends()
    results['hidden_gems'] = curate_hidden_gems()
    
    # Platform-specific top 10s
    platforms = ['Netflix', 'Prime Video', 'Jiohotstar', 'Sony LIV']
    for platform in platforms:
        results[f'{platform}_top_10'] = curate_platform_top_10(platform)
    
    # Final summary
    print("\n" + "="*60)
    print("CURATION COMPLETE")
    print("="*60)
    
    total_curated = sum(len(titles) for titles in results.values())
    unique_titles = len(used_titles)
    
    print(f"✅ Total curated slots: {total_curated}")
    print(f"✅ Unique titles used: {unique_titles}")
    print(f"✅ Trays curated: {len(results)}")
    
    # Check for duplicates (shouldn't happen)
    all_ids = []
    for tray_name, titles in results.items():
        if 'top_10' not in tray_name:  # Exclude platform trays from duplicate check
            all_ids.extend([t['id'] for t in titles])
    
    duplicates = len(all_ids) - len(set(all_ids))
    if duplicates > 0:
        print(f"⚠️  WARNING: {duplicates} duplicate titles found across main trays!")
    else:
        print(f"✅ No duplicates across main trays")
    
    print(f"\n📊 Database stats:")
    print(f"   Total content items: {db.content.count_documents({})}")
    print(f"   Items with curation flags: {db.content.count_documents({'curation_flags': {'$exists': True}})}")

if __name__ == '__main__':
    main()
