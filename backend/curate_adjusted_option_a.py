#!/usr/bin/env python3
"""
Adjusted Curation Script - Option A
Implements relaxed rules for small catalog (84 titles)
"""

import pymongo
from datetime import datetime, timedelta
import os

# MongoDB Setup
client = pymongo.MongoClient(os.environ.get('MONGO_URL'))
db = client["connector"]

# Track used titles
used_titles = set()

def mark_titles_used(titles):
    for t in titles:
        used_titles.add(t['id'])

def curate_front_and_center():
    """Front & Center: Top 5 of current month, 7.0+"""
    print("\n" + "="*80)
    print("CURATING: FRONT & CENTER")
    print("="*80)
    
    current_month = f"{datetime.now().year}-{datetime.now().month:02d}"
    
    query = {
        'release_date': {'$regex': f'^{current_month}'},
        'rating': {'$gte': 7.0},
        'content_type': {'$nin': ['sports_event', 'documentary']}
    }
    
    titles = list(db.content.find(query).sort('rating', -1).limit(5))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {'curation_flags.front_and_center': True, 'curation_flags.priority': idx}})
        print(f"   {idx}. {t['title']} | ⭐ {t['rating']} | {t['platform']}")
        mark_titles_used([t])
    
    return titles

def curate_buzzing_now():
    """Buzzing Now: Last 30 days, 6.5+ (relaxed from 7.0)"""
    print("\n" + "="*80)
    print("CURATING: BUZZING NOW (Last 30 days, 6.5+)")
    print("="*80)
    
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    query = {
        'release_date': {'$gte': thirty_days_ago},
        'rating': {'$gte': 6.5},
        'content_type': {'$nin': ['sports_event', 'documentary']},
        'id': {'$nin': list(used_titles)}
    }
    
    titles = list(db.content.find(query).sort([('release_date', -1), ('rating', -1)]).limit(6))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {'curation_flags.buzzing_now': True, 'curation_flags.buzzing_rank': idx}})
        print(f"   {idx}. {t['title']} | ⭐ {t['rating']} | {t['platform']} | {t['release_date']}")
        mark_titles_used([t])
    
    return titles

def curate_must_watch_today():
    """Must Watch Today: Top 5 of current year 2025"""
    print("\n" + "="*80)
    print("CURATING: MUST WATCH TODAY (Top 5 of 2025)")
    print("="*80)
    
    query = {
        'release_date': {'$regex': '^2025'},
        'rating': {'$gte': 6.5},
        'content_type': {'$nin': ['sports_event', 'documentary']},
        'id': {'$nin': list(used_titles)}
    }
    
    titles = list(db.content.find(query).sort('rating', -1).limit(5))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {'curation_flags.must_watch_today': True}})
        print(f"   {idx}. {t['title']} | ⭐ {t['rating']} | {t['platform']}")
        mark_titles_used([t])
    
    return titles

def curate_new_and_noted():
    """New & Noted: Latest releases, sorted by date"""
    print("\n" + "="*80)
    print("CURATING: NEW & NOTED (Latest releases)")
    print("="*80)
    
    query = {
        'content_type': {'$nin': ['sports_event', 'documentary']},
        'id': {'$nin': list(used_titles)}
    }
    
    titles = list(db.content.find(query).sort('release_date', -1).limit(8))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {'curation_flags.new_and_noted': True, 'curation_flags.new_and_noted_rank': idx}})
        print(f"   {idx}. {t['title']} | Released: {t['release_date']}")
        mark_titles_used([t])
    
    return titles

def curate_bro_recommends():
    """Bro Recommends: Top 6 of 2025, varied months"""
    print("\n" + "="*80)
    print("CURATING: BRO RECOMMENDS")
    print("="*80)
    
    query = {
        'release_date': {'$regex': '^2025'},
        'rating': {'$gte': 7.0},
        'content_type': {'$nin': ['sports_event', 'documentary']},
        'id': {'$nin': list(used_titles)}
    }
    
    titles = list(db.content.find(query).sort('rating', -1).limit(6))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {'curation_flags.bro_recommends': True}})
        print(f"   {idx}. {t['title']} | ⭐ {t['rating']}")
        mark_titles_used([t])
    
    return titles

def curate_hidden_gems():
    """Hidden Gems: High-rated titles not in other trays"""
    print("\n" + "="*80)
    print("CURATING: HIDDEN GEMS")
    print("="*80)
    
    query = {
        'rating': {'$gte': 7.5},
        'content_type': {'$nin': ['sports_event', 'documentary']},
        'id': {'$nin': list(used_titles)}
    }
    
    titles = list(db.content.find(query).sort('rating', -1).limit(8))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {'curation_flags.hidden_gems': True}})
        print(f"   {idx}. {t['title']} | ⭐ {t['rating']} | {t['release_date'][:4]}")
        mark_titles_used([t])
    
    return titles

def curate_platform_top(platform_name, limit=10):
    """Platform Top: Last 90 days, 6.0+"""
    print(f"\n--- {platform_name} TOP {limit} ---")
    
    ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    
    query = {
        'platform': platform_name,
        'release_date': {'$gte': ninety_days_ago},
        'rating': {'$gte': 6.0},
        'content_type': {'$nin': ['documentary']}  # Allow sports for platform-specific
    }
    
    titles = list(db.content.find(query).sort('rating', -1).limit(limit))
    
    print(f"✅ Selected {len(titles)} titles")
    for idx, t in enumerate(titles, 1):
        db.content.update_one({'id': t['id']}, {'$set': {f'curation_flags.{platform_name.lower()}_top': True}})
        if idx <= 3:
            print(f"   {idx}. {t['title']} | ⭐ {t['rating']}")
    
    return titles

def main():
    print("="*80)
    print("COMPREHENSIVE CURATION - OPTION A (ADJUSTED RULES)")
    print("="*80)
    
    # Clear all existing curation flags
    db.content.update_many({}, {'$unset': {'curation_flags': ''}})
    print("\n✅ Cleared all existing curation flags")
    
    # Run curation
    fc = curate_front_and_center()
    bn = curate_buzzing_now()
    mw = curate_must_watch_today()
    nn = curate_new_and_noted()
    br = curate_bro_recommends()
    hg = curate_hidden_gems()
    
    # Platform-specific
    print("\n" + "="*80)
    print("PLATFORM-SPECIFIC CURATION")
    print("="*80)
    curate_platform_top('Netflix', 10)
    curate_platform_top('Prime Video', 10)
    curate_platform_top('JioHotstar', 10)
    curate_platform_top('Apple TV', 10)
    curate_platform_top('SonyLIV', 10)
    
    # Summary
    print("\n" + "="*80)
    print("CURATION SUMMARY")
    print("="*80)
    print(f"Front & Center: {len(fc)} titles")
    print(f"Buzzing Now: {len(bn)} titles")
    print(f"Must Watch Today: {len(mw)} titles")
    print(f"New & Noted: {len(nn)} titles")
    print(f"Bro Recommends: {len(br)} titles")
    print(f"Hidden Gems: {len(hg)} titles")
    print(f"\n📊 Total titles with curation: {db.content.count_documents({'curation_flags': {'$exists': True}})}")
    print("="*80)

if __name__ == '__main__':
    main()
