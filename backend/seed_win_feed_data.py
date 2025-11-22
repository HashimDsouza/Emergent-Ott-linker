#!/usr/bin/env python3
"""
Seed data for Win (Polls & Quizzes) and Get With It (Feed) pages
"""
import os
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

def seed_data():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'connector')
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Seeding Win & Get With It data...\n")
    
    # Clear existing data
    db.polls.delete_many({})
    db.quizzes.delete_many({})
    db.feed_items.delete_many({})
    
    # ===== POLLS DATA =====
    polls = [
        {
            "id": "poll-1",
            "question": "Which OTT show are you most hyped for this month?",
            "options": [
                {"id": "opt1", "text": "The Family Man Season 3", "votes": 245},
                {"id": "opt2", "text": "Stranger Things Season 5", "votes": 189},
                {"id": "opt3", "text": "Pluribus", "votes": 156},
                {"id": "opt4", "text": "All Her Fault", "votes": 134}
            ],
            "category": "entertainment",
            "total_votes": 724,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": "2025-12-31T23:59:59Z",
            "active": True
        },
        {
            "id": "poll-2",
            "question": "Best streaming platform for Indian content?",
            "options": [
                {"id": "opt1", "text": "Prime Video", "votes": 312},
                {"id": "opt2", "text": "Netflix", "votes": 289},
                {"id": "opt3", "text": "JioHotstar", "votes": 267},
                {"id": "opt4", "text": "Sony LIV", "votes": 145}
            ],
            "category": "ott",
            "total_votes": 1013,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": "2025-12-31T23:59:59Z",
            "active": True
        }
    ]
    
    # ===== QUIZZES DATA =====
    quizzes = [
        {
            "id": "quiz-1",
            "title": "OTT Trivia Challenge",
            "description": "Test your knowledge of the latest shows and movies!",
            "category": "entertainment",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "questions": [
                {
                    "id": "q1",
                    "question": "Which show features Manoj Bajpayee as a secret agent?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["The Family Man", "Sacred Games", "Paatal Lok", "Special Ops"],
                    "correct_answer": "A",
                    "explanation_correct": "Correct! The Family Man stars Manoj Bajpayee as Srikant Tiwari, a middle-class man secretly working for TASC.",
                    "explanation_incorrect": "Not quite! The correct answer is The Family Man, where Manoj Bajpayee plays Srikant Tiwari.",
                    "difficulty": "medium"
                },
                {
                    "id": "q2",
                    "question": "Stranger Things is set in which decade?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["1970s", "1980s", "1990s", "2000s"],
                    "correct_answer": "B",
                    "explanation_correct": "Correct! Stranger Things is set in the 1980s, featuring classic 80s music, fashion, and culture.",
                    "explanation_incorrect": "Oops! Stranger Things is actually set in the 1980s with its iconic 80s vibe.",
                    "difficulty": "medium"
                },
                {
                    "id": "q3",
                    "question": "What is the main setting of Panchayat?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["Mumbai", "Delhi", "Rural UP Village", "Bangalore"],
                    "correct_answer": "C",
                    "explanation_correct": "Perfect! Panchayat is set in a rural village in Uttar Pradesh, following an engineering graduate who becomes a Panchayat secretary.",
                    "explanation_incorrect": "Try again! Panchayat is set in a rural UP village, not a big city.",
                    "difficulty": "easy"
                }
            ],
            "total_attempts": 1234,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "active": True
        }
    ]
    
    # ===== FEED DATA (Get With It) =====
    feed_items = [
        {
            "id": "feed-1",
            "title": "The Family Man Season 3 Breaks Records",
            "description": "The highly anticipated third season of The Family Man has shattered viewership records, becoming Prime Video's biggest Indian series premiere ever.",
            "category": "entertainment",
            "image_url": "https://image.tmdb.org/t/p/original/eEzKigDI64OomZV6VTJvoPGmVu1.jpg",
            "source_url": "https://www.primevideo.com/detail/The-Family-Man/0LNF2JG4BSPPWJ9SUZ2Y8C",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": True,
            "priority": 1
        },
        {
            "id": "feed-2",
            "title": "Stranger Things Season 5 Release Date Confirmed",
            "description": "Netflix has officially confirmed November 26, 2025 as the release date for Stranger Things' fifth and final season.",
            "category": "entertainment",
            "image_url": "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
            "source_url": "https://www.netflix.com/title/80057281",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 2
        },
        {
            "id": "feed-3",
            "title": "ICC Women's World Cup Final Today",
            "description": "The Women's Cricket World Cup final is set for today at 2 PM IST. India takes on Australia in what promises to be an epic showdown.",
            "category": "sports",
            "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.hotstar.com/in/sports",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 3
        },
        {
            "id": "feed-4",
            "title": "Pluribus Gets Critical Acclaim",
            "description": "Netflix's new series Pluribus is receiving rave reviews from critics and audiences alike, with an impressive 8.6 rating on IMDb.",
            "category": "entertainment",
            "image_url": "https://image.tmdb.org/t/p/original/8Y6A0bjCi1ZVAYQzf0LlEmckv5O.jpg",
            "source_url": "https://www.netflix.com/title/225171",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 4
        },
        {
            "id": "feed-5",
            "title": "Premier League Weekend Highlights",
            "description": "Manchester United secured a convincing 3-0 victory over Nottingham Forest in today's Premier League clash.",
            "category": "sports",
            "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.hotstar.com/in/sports/football",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 5
        }
    ]
    
    # Insert data
    if polls:
        result = db.polls.insert_many(polls)
        print(f"✅ Inserted {len(result.inserted_ids)} polls")
    
    if quizzes:
        result = db.quizzes.insert_many(quizzes)
        print(f"✅ Inserted {len(result.inserted_ids)} quizzes")
    
    if feed_items:
        result = db.feed_items.insert_many(feed_items)
        print(f"✅ Inserted {len(result.inserted_ids)} feed items")
    
    # Set hero item (first feed item marked as featured)
    print(f"\n🎯 Hero item set to: {feed_items[0]['title']}")
    
    print("\n🎉 Seed data complete!")
    print("\n📍 Pages now available:")
    print("   - /win (2 polls + 1 quiz)")
    print("   - /get-with-it (5 feed items)")
    
    client.close()

if __name__ == "__main__":
    seed_data()
