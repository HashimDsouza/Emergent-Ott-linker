#!/usr/bin/env python3
"""
Ingest cleaned Google Sheet data with proper metadata handling
"""

from pymongo import MongoClient
import os
from datetime import datetime
import requests
import json

# TMDB Genre ID to Name Mapping
TMDB_GENRE_MAP = {
    12: "Adventure", 14: "Fantasy", 16: "Animation",
    18: "Drama", 27: "Horror", 28: "Action",
    35: "Comedy", 36: "History", 37: "Western",
    53: "Thriller", 80: "Crime", 99: "Documentary",
    878: "Science Fiction", 9648: "Mystery",
    10402: "Music", 10749: "Romance", 10751: "Family",
    10752: "War", 10759: "Action & Adventure",
    10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap",
    10767: "Talk", 10768: "War & Politics"
}

# Cleaned data from Google Sheet (84 titles)
CLEANED_DATA = [
    {"title": "Stranger Things", "display": "Stranger Things – Season 5", "platform": "Netflix", "content_type": "series", "season": "", "year": 2016, "rating": 8.593, "imdb_rating": "", "category": "entertainment", "language": "", "episodes": "", "genres": "Drama, Sci-Fi & Fantasy, Mystery", "release_date": "2025-11-26", "is_new_season": "", "freshness_batch": "", "tmdb_id": 66732, "imdb_id": "", "poster_url": "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg", "id": "tmdb_tv_66732"},
    {"title": "The Family Man Season 3", "display": "", "platform": "Prime Video", "content_type": "series", "season": "", "year": 2025, "rating": 8.7, "imdb_rating": 8.7, "category": "buzzing", "language": "Hindi", "episodes": 1, "genres": "Drama, Action & Adventure", "release_date": "2025-11-21", "is_new_season": "", "freshness_batch": "", "tmdb_id": 93352, "imdb_id": "tt9544034", "poster_url": "https://image.tmdb.org/t/p/w500/tE1NUJqw9gV6AVjQ1GTK78LbWJ9.jpg", "id": "7f7c9685-f898-4706-8391-5dc7d8c4c680"},
    {"title": "Jurassic World Rebirth", "display": "", "platform": "JioHotstar", "content_type": "movie", "season": "", "year": 2025, "rating": 5.9, "imdb_rating": 5.9, "category": "entertainment", "language": "English", "episodes": "", "genres": "0878, 12, 28", "release_date": "2025-11-14", "is_new_season": "✗", "freshness_batch": "Nov25", "tmdb_id": 1234821, "imdb_id": "tt31036941", "poster_url": "https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg", "id": "2dfb0ad1-b720-48cf-8e09-43d7bfb8ac09"},
    {"title": "Freakier Friday", "display": "", "platform": "JioHotstar", "content_type": "movie", "season": "", "year": 2025, "rating": 6.5, "imdb_rating": 6.5, "category": "entertainment", "language": "English", "episodes": "", "genres": "35, 14, 10751", "release_date": "2025-11-12", "is_new_season": "✗", "freshness_batch": "Nov25", "tmdb_id": 1125257, "imdb_id": "tt31956415", "poster_url": "https://image.tmdb.org/t/p/w500/9wV65OmsjLAqBfDnYTkMPutXH8j.jpg", "id": "b7d62eae-4c12-460a-a281-b6589cf45c5a"},
    {"title": "Baramulla", "display": "", "platform": "Netflix", "content_type": "movie", "season": "", "year": 2025, "rating": 7.0, "imdb_rating": "", "category": "entertainment", "language": "Hindi", "episodes": "", "genres": "27", "release_date": "2025-11-07", "is_new_season": "✗", "freshness_batch": "Nov25", "tmdb_id": 1561969, "imdb_id": "tt29247040", "poster_url": "https://image.tmdb.org/t/p/w500/xm5ER19nTk7iuWFaiNRUYe3Zlz.jpg", "id": "b92308bf-10be-4f69-a9e8-438f3cdf6c1e"},
    {"title": "Chiranjeeva", "display": "", "platform": "Aha", "content_type": "movie", "season": "", "year": 2025, "rating": 0, "imdb_rating": "", "category": "entertainment", "language": "English", "episodes": "", "genres": "", "release_date": "2025-11-07", "is_new_season": "✗", "freshness_batch": "Nov25", "tmdb_id": 1576463, "imdb_id": "tt38589147", "poster_url": "https://image.tmdb.org/t/p/w500/xVjBadMUMB2iHiUVtaUxZHGkFHY.jpg", "id": "98dbd812-8128-48f3-bdb6-da9df3f18af9"},
    {"title": "Pluribus", "display": "", "platform": "Netflix", "content_type": "series", "season": "", "year": 2025, "rating": 8.6, "imdb_rating": "", "category": "entertainment", "language": "", "episodes": "", "genres": "Drama, Sci-Fi & Fantasy", "release_date": "2025-11-06", "is_new_season": "", "freshness_batch": "", "tmdb_id": 225171, "imdb_id": "", "poster_url": "https://image.tmdb.org/t/p/w500/nrM2xFUfKJJEmZzd5d7kohT2G0C.jpg", "id": "tmdb_tv_225171"},
    {"title": "All Her Fault", "display": "", "platform": "JioHotstar", "content_type": "series", "season": "", "year": 2025, "rating": 8.353, "imdb_rating": "", "category": "hero", "language": "English", "episodes": "", "genres": "18, 9648, 80", "release_date": "2025-11-06", "is_new_season": "✗", "freshness_batch": "Nov25", "tmdb_id": 246386, "imdb_id": "tt31314751", "poster_url": "https://image.tmdb.org/t/p/w500/o8vZKZlc8H4OcgpbJuqP0iK4B2.jpg", "id": "51f1bd3a-371a-4ed8-a58e-6980fb304001"},
]

# Add remaining 76 titles... (truncated for brevity, will load from actual sheet)

def convert_genres(genres_str):
    """Convert genre IDs to human-readable names"""
    if not genres_str or genres_str == "":
        return []
    
    # Split by comma
    parts = [g.strip() for g in str(genres_str).split(',')]
    result = []
    
    for part in parts:
        # Check if it's a number (genre ID)
        if part.isdigit():
            genre_id = int(part)
            genre_name = TMDB_GENRE_MAP.get(genre_id, part)
            result.append(genre_name)
        else:
            # Already a name
            result.append(part)
    
    return result

def get_unsplash_sports_image(sport_name):
    """Get high-quality sports image from Unsplash"""
    # Map sport to search query
    sport_queries = {
        "Pro Kabaddi": "kabaddi india sport",
        "ISL": "indian super league football",
        "UEFA Champions League": "champions league football",
        "Formula 1": "formula 1 racing"
    }
    
    query = sport_queries.get(sport_name, sport_name.lower())
    
    # Unsplash API (using public access)
    url = f"https://source.unsplash.com/featured/800x600/?{query.replace(' ', ',')}"
    
    return url

def ingest_title(data_dict):
    """Ingest a single title with proper metadata handling"""
    
    # Convert genres
    genres = convert_genres(data_dict['genres'])
    
    # Handle display name
    display_name = data_dict['display'] if data_dict['display'] else data_dict['title']
    
    # Handle season-specific metadata if is_new_season is marked
    is_new_season = data_dict.get('is_new_season') == '✔'
    
    # Handle poster for sports without TMDB
    poster_url = data_dict['poster_url']
    if not poster_url and data_dict['content_type'] == 'sports_event':
        poster_url = get_unsplash_sports_image(data_dict['title'])
    
    # Build document
    doc = {
        'id': data_dict['id'],
        'title': display_name,  # Use display name if available
        'original_title': data_dict['title'],  # Keep original for reference
        'platform': data_dict['platform'],
        'content_type': data_dict['content_type'],
        'rating': float(data_dict['rating']) if data_dict['rating'] else 0.0,
        'imdb_rating': float(data_dict['imdb_rating']) if data_dict['imdb_rating'] else 0.0,
        'release_date': data_dict['release_date'],
        'genres': genres,
        'poster_url': poster_url,
        'backdrop_path': poster_url,  # Use poster as backdrop for now
        'category': data_dict.get('category', 'entertainment'),
        'language': data_dict.get('language', 'English'),
        'is_new_season': is_new_season,
        'season': data_dict.get('season', ''),
        'episodes': data_dict.get('episodes', ''),
        'tmdb_id': data_dict.get('tmdb_id', ''),
        'imdb_id': data_dict.get('imdb_id', ''),
        'year': data_dict.get('year', ''),
        'freshness_batch': data_dict.get('freshness_batch', 'Nov25'),
        'ingestion_date': datetime.now().isoformat()
    }
    
    return doc

def main():
    client = MongoClient(os.environ.get('MONGO_URL'))
    db = client['connector']
    
    print("="*80)
    print("INGESTING CLEANED 84 TITLES")
    print("="*80)
    
    # Note: In actual implementation, load all 84 from Google Sheet API
    # For now, using sample data
    
    print("\n⚠️  This is a sample ingestion script.")
    print("Will create full version to load all 84 titles from Google Sheet.")
    
    # Test with sample data
    for idx, title_data in enumerate(CLEANED_DATA, 1):
        doc = ingest_title(title_data)
        db.content.insert_one(doc)
        print(f"{idx}. ✅ Ingested: {doc['title']} | Platform: {doc['platform']} | Genres: {doc['genres']}")
    
    print(f"\n✅ Ingested {len(CLEANED_DATA)} titles successfully!")

if __name__ == '__main__':
    main()
