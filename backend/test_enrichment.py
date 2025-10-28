"""
Test script to verify enrichment persistence without requiring API keys
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_enrichment_persistence():
    """Test that updates to content actually persist in MongoDB"""
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Get one content item
    content = await db.content.find_one({}, {"_id": 0})
    if not content:
        print("❌ No content found. Run /api/content/seed first")
        return
    
    print(f"📝 Testing with: {content['title']}")
    print(f"   Current TMDB ID: {content.get('tmdb_id', 'None')}")
    
    # Simulate enrichment by adding mock TMDB data
    mock_enriched_data = {
        "tmdb_id": 12345,
        "imdb_id": "tt1234567",
        "vote_average": 8.5,
        "imdb_rating": 8.7,
        "rating_source": "imdb",
        "poster_url": "https://image.tmdb.org/t/p/w500/mock_poster.jpg",
        "poster_path": "https://image.tmdb.org/t/p/w500/mock_poster.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/mock_backdrop.jpg",
        "year": 2024,
        "normalized_title": content['title'],
        "providers_in": ["Netflix", "Prime Video"],
        "platform_content_id": "12345678",
        "last_enriched": "2025-10-28T15:30:00Z"
    }
    
    # Build update dict exactly like the real enrichment function
    update_fields = {
        "thumbnail": mock_enriched_data.get("poster_url", content["thumbnail"]),
        "rating": mock_enriched_data.get("imdb_rating", content["rating"]),
        "description": content.get("description"),  # Keep existing
        "tmdb_id": mock_enriched_data.get("tmdb_id"),
        "imdb_id": mock_enriched_data.get("imdb_id"),
        "imdb_rating": mock_enriched_data.get("imdb_rating"),
        "imdb_votes": mock_enriched_data.get("imdb_votes"),
        "vote_average": mock_enriched_data.get("vote_average"),
        "rating_source": mock_enriched_data.get("rating_source", "tmdb"),
        "poster_path": mock_enriched_data.get("poster_path"),
        "poster_url": mock_enriched_data.get("poster_url"),
        "backdrop_path": mock_enriched_data.get("backdrop_path"),
        "year": mock_enriched_data.get("year"),
        "normalized_title": mock_enriched_data.get("normalized_title"),
        "providers_in": mock_enriched_data.get("providers_in", []),
        "watchmode_id": mock_enriched_data.get("watchmode_id"),
        "platform_content_id": mock_enriched_data.get("platform_content_id", content.get("platform_content_id")),
        "last_enriched": mock_enriched_data.get("last_enriched")
    }
    
    print(f"\n🔄 Attempting update with fields: {list(update_fields.keys())}")
    
    # Perform the update
    result = await db.content.update_one(
        {"id": content["id"]},
        {"$set": update_fields}
    )
    
    print(f"   Matched: {result.matched_count}")
    print(f"   Modified: {result.modified_count}")
    
    # Verify the update by reading back
    updated_content = await db.content.find_one({"id": content["id"]}, {"_id": 0})
    
    print(f"\n✅ Verification:")
    print(f"   TMDB ID: {updated_content.get('tmdb_id')} (expected: 12345)")
    print(f"   IMDb ID: {updated_content.get('imdb_id')} (expected: tt1234567)")
    print(f"   IMDb Rating: {updated_content.get('imdb_rating')} (expected: 8.7)")
    print(f"   Poster URL: {updated_content.get('poster_url')[:50] if updated_content.get('poster_url') else 'None'}...")
    print(f"   Providers IN: {updated_content.get('providers_in')}")
    print(f"   Last Enriched: {updated_content.get('last_enriched')}")
    
    if updated_content.get('tmdb_id') == 12345:
        print("\n✅ SUCCESS: Data persisted correctly!")
    else:
        print("\n❌ FAILURE: Data did not persist!")
        print(f"Full updated document: {updated_content}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_enrichment_persistence())
