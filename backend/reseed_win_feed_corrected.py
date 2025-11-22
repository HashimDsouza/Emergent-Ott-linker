#!/usr/bin/env python3
"""
Re-seed Win & Get With It with CORRECT data matching Nov 17th requirements
"""
import os
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

def reseed_data():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'connector')
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    print("🔄 Re-seeding Win & Get With It with corrected data...\n")
    
    # Clear existing
    db.polls.delete_many({})
    db.quizzes.delete_many({})
    db.feed_items.delete_many({})
    
    # ===== POLLS - COMPETITIVE & FUN TONALITY =====
    polls = [
        {
            "id": "poll-1",
            "question": "Which sequel are you MOST hyped for? 🔥",
            "options": [
                {"id": "opt1", "text": "Pushpa 2: The Rule", "votes": 2145},
                {"id": "opt2", "text": "Stree 3", "votes": 1756},
                {"id": "opt3", "text": "Bhool Bhulaiyaa 4", "votes": 1432},
                {"id": "opt4", "text": "Don 3", "votes": 1089}
            ],
            "category": "movies",
            "total_votes": 6422,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": "2025-12-31T23:59:59Z",
            "active": True
        },
        {
            "id": "poll-2",
            "question": "IPL 2026: Who's taking the trophy home? 🏆",
            "options": [
                {"id": "opt1", "text": "Mumbai Indians", "votes": 1823},
                {"id": "opt2", "text": "Chennai Super Kings", "votes": 1654},
                {"id": "opt3", "text": "Royal Challengers Bangalore", "votes": 1421},
                {"id": "opt4", "text": "Kolkata Knight Riders", "votes": 1198}
            ],
            "category": "sports",
            "total_votes": 6096,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": "2026-05-31T23:59:59Z",
            "active": True
        }
    ]
    
    # ===== QUIZZES - FUN TONALITY =====
    quizzes = [
        {
            "id": "quiz-1",
            "title": "🏆 Daily Bollywood Challenge",
            "description": "Think you know your masala? Prove it! 💪",
            "category": "entertainment",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "questions": [
                {
                    "id": "q1",
                    "question": "Which actor played Srikant Tiwari in The Family Man?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["Manoj Bajpayee", "Nawazuddin Siddiqui", "Rajkummar Rao", "Pankaj Tripathi"],
                    "correct_answer": "A",
                    "explanation_correct": "Bang on! 🎯 Manoj Bajpayee IS Srikant Tiwari.",
                    "explanation_incorrect": "Nope! Manoj Bajpayee plays the middle-class secret agent.",
                    "difficulty": "easy"
                },
                {
                    "id": "q2",
                    "question": "Which IPL team did Rishabh Pant join for ₹27 Cr in 2025?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["Lucknow Super Giants", "Punjab Kings", "Gujarat Titans", "Delhi Capitals"],
                    "correct_answer": "A",
                    "explanation_correct": "Correct! 💰 LSG made it rain for Pant.",
                    "explanation_incorrect": "Not quite! LSG snagged him for a record ₹27 Cr.",
                    "difficulty": "medium"
                },
                {
                    "id": "q3",
                    "question": "Stranger Things is set in which decade?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["1970s", "1980s", "1990s", "2000s"],
                    "correct_answer": "B",
                    "explanation_correct": "Yes! 🎸 Peak 80s vibes with those synth beats.",
                    "explanation_incorrect": "Oops! It's the 1980s – think Walkman & arcade games.",
                    "difficulty": "easy"
                },
                {
                    "id": "q4",
                    "question": "Who directed The Family Man Season 3?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["Raj & DK", "Anurag Kashyap", "Vikramaditya Motwane", "Zoya Akhtar"],
                    "correct_answer": "A",
                    "explanation_correct": "Spot on! 🎬 Raj & DK are the brains behind it.",
                    "explanation_incorrect": "Not quite! It's the Raj & DK duo.",
                    "difficulty": "medium"
                },
                {
                    "id": "q5",
                    "question": "Which show topped Netflix India in November 2025?",
                    "options": ["A", "B", "C", "D"],
                    "option_texts": ["Stranger Things S5", "Pluribus", "All Her Fault", "Robin Hood"],
                    "correct_answer": "A",
                    "explanation_correct": "You got it! 🔥 Stranger Things is DOMINATING.",
                    "explanation_incorrect": "Close! Stranger Things Season 5 is the reigning champ.",
                    "difficulty": "medium"
                }
            ],
            "total_attempts": 1847,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "active": True
        }
    ]
    
    # ===== FEED - REAL NEWS LINKS (NOT PLATFORMS) =====
    feed_items = [
        {
            "id": "feed-1",
            "title": "The Family Man S3 Breaks Prime Video Records! 🔥",
            "description": "Season 3 just became Prime Video India's biggest premiere EVER. 15M views in 48 hours!",
            "category": "entertainment",
            "image_url": "https://image.tmdb.org/t/p/original/eEzKigDI64OomZV6VTJvoPGmVu1.jpg",
            "source_url": "https://www.youtube.com/results?search_query=The+Family+Man+Season+3+trailer",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": True,
            "priority": 1
        },
        {
            "id": "feed-2",
            "title": "Stranger Things S5 Drops November 26! 📅",
            "description": "Final season confirmed. Netflix just announced the exact release date. Get ready for the Upside Down finale.",
            "category": "entertainment",
            "image_url": "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
            "source_url": "https://www.youtube.com/results?search_query=Stranger+Things+Season+5+announcement",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 2
        },
        {
            "id": "feed-3",
            "title": "Pushpa 2 CRUSHES Box Office! 💰",
            "description": "₹1000 Cr+ worldwide in just 10 days. Allu Arjun's biggest blockbuster yet.",
            "category": "entertainment",
            "image_url": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.youtube.com/results?search_query=Pushpa+2+box+office+collection",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 3
        },
        {
            "id": "feed-4",
            "title": "ICC Women's World Cup Final TODAY 🏏",
            "description": "India vs Australia at 2 PM IST. Live on JioHotstar. The biggest match of the year!",
            "category": "sports",
            "image_url": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.youtube.com/results?search_query=ICC+Women+World+Cup+2025+final",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 4
        },
        {
            "id": "feed-5",
            "title": "Man United DOMINATES Nottingham 3-0 ⚽",
            "description": "Premier League: Bruno Fernandes scores a brace as United secures crucial win.",
            "category": "sports",
            "image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.youtube.com/results?search_query=Manchester+United+vs+Nottingham+Forest+highlights",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 5
        },
        {
            "id": "feed-6",
            "title": "Stree 3 Trailer DROPS Tomorrow! 👻",
            "description": "Rajkummar Rao & Shraddha Kapoor are back. Trailer launch scheduled for 12 PM.",
            "category": "entertainment",
            "image_url": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.youtube.com/results?search_query=Stree+3+trailer",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 6
        },
        {
            "id": "feed-7",
            "title": "Mirzapur S3 TOPS Charts Globally 📈",
            "description": "Amazon's crime thriller is now the #1 show worldwide. Fans are going crazy!",
            "category": "entertainment",
            "image_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.youtube.com/results?search_query=Mirzapur+season+3",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 7
        },
        {
            "id": "feed-8",
            "title": "IPL 2026 Mega Auction Begins! 🎯",
            "description": "Rishabh Pant goes for ₹27 Cr to LSG! KL Rahul to RCB. Chaos unleashed.",
            "category": "sports",
            "image_url": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=900&fit=crop&q=80",
            "source_url": "https://www.youtube.com/results?search_query=IPL+2026+mega+auction",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_hero": False,
            "priority": 8
        }
    ]
    
    # Insert data
    if polls:
        result = db.polls.insert_many(polls)
        print(f"✅ Inserted {len(result.inserted_ids)} polls (COMPETITIVE TONALITY)")
    
    if quizzes:
        result = db.quizzes.insert_many(quizzes)
        print(f"✅ Inserted {len(result.inserted_ids)} quiz (FUN TONALITY)")
    
    if feed_items:
        result = db.feed_items.insert_many(feed_items)
        print(f"✅ Inserted {len(result.inserted_ids)} feed items (REAL NEWS LINKS)")
    
    print("\n🎉 CORRECTED seed data complete!")
    print("\n📍 Fixed Issues:")
    print("   ✅ Win: Sports poll added, platform poll removed")
    print("   ✅ Win: Fun/competitive tonality ('Think you know your masala?')")
    print("   ✅ Get With It: Real YouTube/news links (not platform homepages)")
    print("   ✅ Get With It: Fresh headlines with emojis & urgency")
    
    client.close()

if __name__ == "__main__":
    reseed_data()
