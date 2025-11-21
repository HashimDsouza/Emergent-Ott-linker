#!/usr/bin/env python3
"""
Fix existing 95 titles + Ingest missing Nov1525 titles
Ensures ALL metadata including exact release dates
"""

import os
import sys
import requests
import pymongo
from datetime import datetime
import time
import openpyxl

# TMDB API Setup
TMDB_API_KEY = '0ec85c952e2d4ee771180e3068544ddf'
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["connector"]

# Platform mapping
PLATFORM_MAP = {
    'Netflix': 'Netflix',
    'Prime Video': 'Prime Video',
    'JioHotstar': 'Jiohotstar',
    'Apple TV': 'Apple TV+',
    'SonyLIV': 'Sony LIV',
    'Zee5': 'Zee5',
    'Aha': 'Aha',
    'Fancode': 'Fancode'
}

def get_tmdb_data(tmdb_id, content_type='movie'):
    """Fetch complete data from TMDB with exact release date"""
    try:
        if content_type in ['series', 'tv']:
            url = f"{TMDB_BASE_URL}/tv/{tmdb_id}"
        else:
            url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
        
        params = {
            'api_key': TMDB_API_KEY,
            'append_to_response': 'external_ids'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract exact release date
        if content_type in ['series', 'tv']:
            release_date = data.get('first_air_date', '')
        else:
            release_date = data.get('release_date', '')
        
        # Get poster
        poster_path = data.get('poster_path', '')
        poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else ''
        
        # Get rating
        rating = data.get('vote_average', 0)
        
        # Get genres
        genres = ', '.join([str(g['id']) for g in data.get('genres', [])])
        
        # Get IMDb ID
        external_ids = data.get('external_ids', {})
        imdb_id = external_ids.get('imdb_id', '') if external_ids else ''
        
        return {
            'release_date': release_date,
            'poster_url': poster_url,
            'rating': rating,
            'genres': genres,
            'imdb_id': imdb_id,
            'overview': data.get('overview', '')
        }
        
    except Exception as e:
        print(f"    ⚠️  TMDB Error: {e}")
        return None

def fix_existing_titles():
    """Fix all existing 95 titles - add exact release dates"""
    print("\n" + "="*60)
    print("PHASE 1: FIXING EXISTING 95 TITLES")
    print("="*60)
    
    titles = list(db.content.find({}))
    fixed_count = 0
    failed_count = 0
    
    for title in titles:
        title_name = title.get('title', 'Unknown')
        tmdb_id = title.get('tmdb_id')
        content_type = title.get('content_type', 'movie')
        
        if not tmdb_id:
            print(f"⏭️  SKIP: {title_name} (no TMDB ID)")
            continue
        
        print(f"\n🔧 FIXING: {title_name}")
        
        tmdb_data = get_tmdb_data(tmdb_id, content_type)
        
        if tmdb_data and tmdb_data['release_date']:
            update_fields = {
                'release_date': tmdb_data['release_date'],
                'year': tmdb_data['release_date'][:4] if len(tmdb_data['release_date']) >= 4 else title.get('year', '')
            }
            
            # Update other missing fields
            if not title.get('genres') and tmdb_data['genres']:
                update_fields['genres'] = tmdb_data['genres']
            
            if not title.get('imdb_id') and tmdb_data['imdb_id']:
                update_fields['imdb_id'] = tmdb_data['imdb_id']
            
            if not title.get('descriptor') and tmdb_data['overview']:
                update_fields['descriptor'] = tmdb_data['overview']
            
            # Update in DB
            db.content.update_one(
                {'id': title['id']},
                {'$set': update_fields}
            )
            
            print(f"  ✅ Release Date: {tmdb_data['release_date']}")
            fixed_count += 1
        else:
            print(f"  ❌ Could not fetch release date")
            failed_count += 1
        
        time.sleep(0.3)  # Rate limiting
    
    print(f"\n✅ Fixed: {fixed_count}")
    print(f"❌ Failed: {failed_count}")

def load_excel_data():
    """Load data from Excel file"""
    print("\n" + "="*60)
    print("LOADING EXCEL DATA")
    print("="*60)
    
    wb = openpyxl.load_workbook('/app/backend/nov1525.xlsx')
    ws = wb.active
    
    headers = []
    data = []
    
    for row_idx, row in enumerate(ws.iter_rows(values_only=True)):
        if row_idx == 0:
            headers = [str(cell).strip() if cell else '' for cell in row]
            continue
        
        if not row[0]:  # Skip empty rows
            continue
        
        row_data = {}
        for idx, value in enumerate(row):
            if idx < len(headers):
                row_data[headers[idx]] = value
        
        data.append(row_data)
    
    print(f"✅ Loaded {len(data)} titles from Excel")
    return data

def ingest_missing_titles(excel_data):
    """Ingest titles that are not yet in database"""
    print("\n" + "="*60)
    print("PHASE 2: INGESTING MISSING TITLES")
    print("="*60)
    
    existing_ids = set([t['id'] for t in db.content.find({}, {'id': 1})])
    
    new_titles = [t for t in excel_data if t.get('id') not in existing_ids]
    
    print(f"📊 New titles to ingest: {len(new_titles)}")
    
    success_count = 0
    error_count = 0
    
    for title_data in new_titles:
        title = title_data.get('title', '')
        item_id = title_data.get('id', '')
        
        if not title or not item_id:
            continue
        
        print(f"\n📥 INGESTING: {title}")
        
        # Build content document
        content = {
            'id': item_id,
            'title': title,
            'display': title_data.get('display', ''),
            'platform': PLATFORM_MAP.get(title_data.get('platform', ''), title_data.get('platform', 'Unknown')),
            'content_type': title_data.get('content_type', 'movie'),
            'category': title_data.get('category', 'entertainment'),
            'language': title_data.get('language', ''),
            'season': title_data.get('season', ''),
            'year': str(title_data.get('year', '')) if title_data.get('year') else '',
            'rating': float(title_data.get('rating', 0)) if title_data.get('rating') else 0,
            'imdb_rating': float(title_data.get('imdb_rating', 0)) if title_data.get('imdb_rating') else 0,
            'episodes': int(title_data.get('episodes', 0)) if title_data.get('episodes') else 0,
            'genres': title_data.get('genres', ''),
            'release_date': title_data.get('release_date', ''),
            'is_new_season': title_data.get('is_new_season') == '✔',
            'freshness_batch': title_data.get('freshness_batch', 'Nov25'),
            'tmdb_id': str(title_data.get('tmdb_id', '')) if title_data.get('tmdb_id') else '',
            'imdb_id': title_data.get('imdb_id', ''),
            'poster_url': title_data.get('poster_url', ''),
            'created_at': datetime.utcnow()
        }
        
        # Fetch from TMDB if available
        tmdb_id = content.get('tmdb_id')
        if tmdb_id:
            print(f"  🔍 Fetching TMDB: {tmdb_id}")
            tmdb_data = get_tmdb_data(tmdb_id, content['content_type'])
            
            if tmdb_data:
                if tmdb_data['release_date']:
                    content['release_date'] = tmdb_data['release_date']
                    content['year'] = tmdb_data['release_date'][:4] if len(tmdb_data['release_date']) >= 4 else content['year']
                    print(f"  ✅ Release: {tmdb_data['release_date']}")
                
                if not content['poster_url']:
                    content['poster_url'] = tmdb_data['poster_url']
                
                if not content['rating']:
                    content['rating'] = tmdb_data['rating']
                
                if not content['genres']:
                    content['genres'] = tmdb_data['genres']
                
                if not content['imdb_id']:
                    content['imdb_id'] = tmdb_data['imdb_id']
                
                if not content.get('descriptor'):
                    content['descriptor'] = tmdb_data['overview']
                
                time.sleep(0.3)
        
        # Flag missing critical data
        missing = []
        if not content.get('poster_url'):
            missing.append('poster')
        if not content.get('release_date'):
            missing.append('release_date')
        if not content.get('rating') or content['rating'] == 0:
            missing.append('rating')
        
        if missing:
            print(f"  ⚠️  MISSING: {', '.join(missing)}")
        
        # Insert
        try:
            db.content.insert_one(content)
            print(f"  ✅ INSERTED")
            success_count += 1
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            error_count += 1
    
    print(f"\n✅ Ingested: {success_count}")
    print(f"❌ Errors: {error_count}")

def main():
    """Main process"""
    print("\n" + "="*60)
    print("NOV1525 COMPLETE FIX & INGESTION")
    print("="*60)
    
    # Phase 1: Fix existing titles
    fix_existing_titles()
    
    # Phase 2: Load Excel and ingest missing titles
    excel_data = load_excel_data()
    ingest_missing_titles(excel_data)
    
    # Final report
    print("\n" + "="*60)
    print("FINAL REPORT")
    print("="*60)
    
    total = db.content.count_documents({})
    missing_dates = db.content.count_documents({'$or': [{'release_date': ''}, {'release_date': {'$exists': False}}]})
    missing_ratings = db.content.count_documents({'$or': [{'rating': 0}, {'rating': {'$exists': False}}]})
    missing_posters = db.content.count_documents({'$or': [{'poster_url': ''}, {'poster_url': {'$exists': False}}]})
    
    print(f"📊 Total Titles: {total}")
    print(f"\n⚠️  MISSING METADATA:")
    print(f"   Release Dates: {missing_dates}")
    print(f"   Ratings: {missing_ratings}")
    print(f"   Posters: {missing_posters}")
    
    if missing_dates == 0 and missing_ratings == 0 and missing_posters == 0:
        print(f"\n🎉 ALL METADATA COMPLETE!")
    else:
        print(f"\n⚠️  Some metadata still missing - will need manual review")

if __name__ == '__main__':
    main()
