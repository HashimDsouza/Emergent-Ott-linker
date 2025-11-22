import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

async def seed_polls():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client.viewflow
    
    # Clear existing polls
    await db.polls.delete_many({})
    
    polls = [
        {
            "id": "poll-2025-favorites",
            "question": "Your favorite title in 2025 so far?",
            "description": None,
            "options": [
                {"id": "opt1", "text": "Mobland", "votes": 0},
                {"id": "opt2", "text": "The B****Ds of Bollywood", "votes": 0},
                {"id": "opt3", "text": "Patal Lok 2", "votes": 0},
                {"id": "opt4", "text": "Superboys Of Malegaon", "votes": 0},
                {"id": "opt5", "text": "Adolescence", "votes": 0},
                {"id": "opt6", "text": "Severance S2", "votes": 0},
                {"id": "opt7", "text": "Other", "votes": 0}
            ],
            "category": "favorites",
            "active": True,
            "total_votes": 0,
            "ends_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "poll-weekend-plans",
            "question": "What's your weekend binge plan? 🍿",
            "description": None,
            "options": [
                {"id": "opt1", "text": "One epic movie marathon", "votes": 523},
                {"id": "opt2", "text": "Catch up on a series", "votes": 789},
                {"id": "opt3", "text": "Live sports only", "votes": 341},
                {"id": "opt4", "text": "Mix of everything", "votes": 612}
            ],
            "category": "viewing",
            "active": True,
            "total_votes": 2265,
            "ends_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "poll-genre-mood",
            "question": "Current mood genre? 🎭",
            "description": None,
            "options": [
                {"id": "opt1", "text": "Action & Thrillers", "votes": 1245},
                {"id": "opt2", "text": "Rom-com vibes", "votes": 892},
                {"id": "opt3", "text": "Horror scares", "votes": 567},
                {"id": "opt4", "text": "Documentary deep-dive", "votes": 423}
            ],
            "category": "mood",
            "active": True,
            "total_votes": 3127,
            "ends_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result = await db.polls.insert_many(polls)
    print(f"✅ Seeded {len(result.inserted_ids)} polls")
    
    # Verify
    count = await db.polls.count_documents({})
    print(f"Total polls in DB: {count}")
    
    # Print first poll
    first = await db.polls.find_one({"id": "poll-2025-favorites"}, {"_id": 0})
    print(f"\nFirst poll: {first['question']}")
    print(f"Options: {[opt['text'] for opt in first['options']]}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_polls())
