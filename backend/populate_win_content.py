#!/usr/bin/env python3
"""
Populate Win Feature - Polls & Quizzes
November 2025 Content with Fun, Conversational Copy
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import uuid

load_dotenv('.env')

# Polls Data
POLLS = [
    {
        "id": str(uuid.uuid4()),
        "question": "Which has been the best show of 2025 so far?",
        "description": "We know it's early, but someone's gotta be winning. Who you got?",
        "options": [
            {"id": "opt_1", "text": "Severance S2", "votes": 0},
            {"id": "opt_2", "text": "The B****Ds of Bollywood", "votes": 0},
            {"id": "opt_3", "text": "The Hunt: Rajiv Gandhi Assassination", "votes": 0},
            {"id": "opt_4", "text": "Superboys Of Malegaon", "votes": 0},
            {"id": "opt_5", "text": "Mobland", "votes": 0},
        ],
        "category": "ott",
        "active": True,
        "total_votes": 0,
        "ends_at": (datetime.now(timezone.utc) + timedelta(days=4)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "question": "Real talk: Who's ACTUALLY winning IPL 2026?",
        "description": "LSG just dropped ₹27 Cr on Pant. But money doesn't buy trophies... or does it?",
        "options": [
            {"id": "opt_1", "text": "LSG (Pant's new kingdom 👑)", "votes": 0},
            {"id": "opt_2", "text": "CSK (Never count out Dhoni)", "votes": 0},
            {"id": "opt_3", "text": "MI (5 trophies aren't enough?)", "votes": 0},
            {"id": "opt_4", "text": "RCB (This is THE year... right?)", "votes": 0},
            {"id": "opt_5", "text": "KKR (Dark horse energy)", "votes": 0},
            {"id": "opt_6", "text": "Others (Chaos is a ladder)", "votes": 0},
        ],
        "category": "sports",
        "active": True,
        "total_votes": 0,
        "ends_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

# Quiz Data with Fun, Conversational Copy
QUIZZES = [
    {
        "id": str(uuid.uuid4()),
        "title": "🔥 Are You Getting With It?",
        "description": "5 questions. 2 minutes. Let's see if you've been paying attention.",
        "questions": [
            {
                "id": "q1",
                "question": "Who's the genius duo behind The Family Man Season 3 dropping Nov 21?",
                "options": ["A", "B", "C", "D"],
                "option_texts": [
                    "Raj & DK (Spy thriller specialists)",
                    "Russo Brothers (Marvel's finest)",
                    "Zoya Akhtar (Bollywood royalty)",
                    "Farah Khan (Main Hoon Na vibes)"
                ],
                "correct_answer": "A",
                "explanation_correct": "Yes! Raj & DK are back! The dynamic duo continues Srikant's spy saga. Binge-watching starts now.",
                "explanation_incorrect": "Oops! It's Raj & DK! They're the masterminds behind this addictive spy drama.",
                "difficulty": "easy"
            },
            {
                "id": "q2",
                "question": "Farhan Akhtar is going full Jawan mode in 120 Bahadur (Nov 21). What's the vibe?",
                "options": ["A", "B", "C", "D"],
                "option_texts": [
                    "Rom-com (Sir, this is not Rock On)",
                    "War drama (Battle of Rezang La, baby!)",
                    "Biopic (Close, but no cigar)",
                    "Horror (The only horror is missing this film)"
                ],
                "correct_answer": "B",
                "explanation_correct": "Hell yeah! It's a war drama! Farhan's paying tribute to the heroes of Rezang La. Tissues recommended.",
                "explanation_incorrect": "Not quite! It's an intense war drama based on the Battle of Rezang La. Goosebumps guaranteed.",
                "difficulty": "easy"
            },
            {
                "id": "q3",
                "question": "Rishabh Pant just broke the bank at ₹27 CRORE. Which team went all in?",
                "options": ["A", "B", "C", "D"],
                "option_texts": [
                    "CSK (Dhoni's wallet said no)",
                    "MI (They've got enough stars)",
                    "LSG (Lucknow said 'shut up and take our money')",
                    "RCB (Still waiting for that first trophy)"
                ],
                "correct_answer": "C",
                "explanation_correct": "You're in the top tier! LSG it is! Most expensive player EVER. Pant is now captain too. No pressure! 😅",
                "explanation_incorrect": "So close! Lucknow Super Giants went BIG. ₹27 Cr and the captain's armband. LSG isn't playing around.",
                "difficulty": "medium"
            },
            {
                "id": "q4",
                "question": "The Kapoors invited Netflix over for dinner. What's the show called?",
                "options": ["A", "B", "C", "D"],
                "option_texts": [
                    "Keeping Up with the Kapoors (Not that kind of show)",
                    "Dining with the Kapoors (Literally on the tin)",
                    "Kapoor & Sons: The Real Story (That's a different movie)",
                    "The Kapoor Chronicles (Sounds epic, but nope)"
                ],
                "correct_answer": "B",
                "explanation_correct": "Nailed it! Pass the biryani! Ranbir, Kareena, Karisma spilling the chai. Nov 21 on Netflix.",
                "explanation_incorrect": "Close! It's Dining with the Kapoors. Because nothing says Bollywood royalty like food and family drama.",
                "difficulty": "medium"
            },
            {
                "id": "q5",
                "question": "India just had a rough day at Eden Gardens vs South Africa. How badly did we lose the Test?",
                "options": ["A", "B", "C", "D"],
                "option_texts": [
                    "By 15 runs (If only...)",
                    "By 20 runs (Closer, but still hurts)",
                    "By 30 runs (Yeah, it stung)",
                    "By 45 runs (Let's not make it worse)"
                ],
                "correct_answer": "C",
                "explanation_correct": "You're a cricket nerd! Respect! 🙌 SA's first Test win in India in 15 years. Eden Gardens witnessed history (painful history).",
                "explanation_incorrect": "It was 30 runs. Still processing the trauma. South Africa's first Test win in India since 2010. We'll bounce back... right?",
                "difficulty": "hard"
            }
        ],
        "category": "entertainment",
        "active": True,
        "total_attempts": 0,
        "date": "2025-11-18",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def populate_win():
    """Populate Win feature with polls and quizzes"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Clear existing data
    await db.polls.delete_many({})
    await db.quizzes.delete_many({})
    print("✅ Cleared existing polls and quizzes")
    
    print("\n" + "=" * 80)
    print("POPULATING WIN FEATURE - POLLS & QUIZZES")
    print("Fun, conversational, tongue-in-cheek content")
    print("=" * 80 + "\n")
    
    # Insert polls
    print("📊 POLLS:")
    for poll in POLLS:
        await db.polls.insert_one(poll)
        print(f"   ✓ {poll['question']}")
        print(f"     Category: {poll['category']} | Options: {len(poll['options'])}")
    
    print(f"\n✅ Inserted {len(POLLS)} polls")
    
    # Insert quizzes
    print("\n🏆 QUIZZES:")
    for quiz in QUIZZES:
        await db.quizzes.insert_one(quiz)
        print(f"   ✓ {quiz['title']}")
        print(f"     Questions: {len(quiz['questions'])} | Category: {quiz['category']}")
        
        # Show difficulty breakdown
        easy = sum(1 for q in quiz['questions'] if q['difficulty'] == 'easy')
        medium = sum(1 for q in quiz['questions'] if q['difficulty'] == 'medium')
        hard = sum(1 for q in quiz['questions'] if q['difficulty'] == 'hard')
        print(f"     Difficulty: {easy} Easy | {medium} Medium | {hard} Hard")
    
    print(f"\n✅ Inserted {len(QUIZZES)} quiz")
    
    client.close()
    
    print("\n" + "=" * 80)
    print("✅ WIN FEATURE CONTENT DEPLOYED")
    print("=" * 80)
    print("\n📋 Summary:")
    print(f"   • {len(POLLS)} Active Polls")
    print(f"   • {len(QUIZZES)} Active Quiz")
    print(f"   • Total Quiz Questions: {sum(len(q['questions']) for q in QUIZZES)}")
    print("\n🎯 Features:")
    print("   ✓ Immediate vote results")
    print("   ✓ Fun, conversational copy")
    print("   ✓ Percentile scoring (top X%)")
    print("   ✓ Instant feedback per question")
    print("   ✓ Tongue-in-cheek humor throughout")
    print("\n🚀 Ready for focus group!")

if __name__ == "__main__":
    asyncio.run(populate_win())
