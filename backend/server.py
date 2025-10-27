from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ===== MODELS =====
class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str  # buzzing, hot_drop, movies, series, sports, documentaries, reality
    platform: str  # netflix, jiohotstar, prime, apple_tv, sonyliv, mx_player, etc.
    rating: float
    thumbnail: str
    description: str
    release_date: str
    social_links: Dict[str, str] = Field(default_factory=dict)  # {youtube, twitter, reddit}
    content_type: str  # movie, series, sports_event, documentary, reality_show
    tagline: str = ""

class ContentCreate(BaseModel):
    title: str
    category: str
    platform: str
    rating: float
    thumbnail: str
    description: str
    release_date: str
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: str = ""

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ===== ROUTES =====

@api_router.get("/")
async def root():
    return {"message": "Welcome to The Connector API"}

# Content Routes
@api_router.get("/content", response_model=List[Content])
async def get_all_content():
    """Get all content"""
    content_list = await db.content.find({}, {"_id": 0}).to_list(1000)
    return content_list

@api_router.get("/content/{category}", response_model=List[Content])
async def get_content_by_category(category: str):
    """Get content by category"""
    content_list = await db.content.find({"category": category}, {"_id": 0}).to_list(100)
    return content_list

@api_router.post("/content", response_model=Content)
async def create_content(input: ContentCreate):
    """Create new content"""
    content_obj = Content(**input.model_dump())
    doc = content_obj.model_dump()
    await db.content.insert_one(doc)
    return content_obj

@api_router.post("/content/seed")
async def seed_content():
    """Seed mock content data"""
    # Clear existing content
    await db.content.delete_many({})
    
    mock_content = [
        # Buzzing Now
        {
            "id": str(uuid.uuid4()),
            "title": "Shark Tank India S4",
            "category": "buzzing",
            "platform": "SonyLIV",
            "rating": 7.3,
            "thumbnail": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop",
            "description": "Aspiring entrepreneurs pitch business ideas to get investment from sharks.",
            "release_date": "2025-01",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Pitches are 🔥 this season"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Viral Podcast Moment",
            "category": "buzzing",
            "platform": "Spotify",
            "rating": 4.9,
            "thumbnail": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=600&fit=crop",
            "description": "The conversation everyone's talking about right now.",
            "release_date": "2025-01",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "podcast",
            "tagline": "Breaking the internet"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "India vs Pakistan T20",
            "category": "buzzing",
            "platform": "JioHotstar",
            "rating": 4.6,
            "thumbnail": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=600&fit=crop",
            "description": "The rivalry continues in this high-stakes T20 match.",
            "release_date": "2025-01",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Match of the decade"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Squid Game S2",
            "category": "buzzing",
            "platform": "Netflix",
            "rating": 4.2,
            "thumbnail": "https://images.unsplash.com/photo-1542204165-19b4f98b48ed?w=400&h=600&fit=crop",
            "description": "The deadly games are back with new twists and turns.",
            "release_date": "2024-12",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Survival just got harder"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Weeknd Tour Documentary",
            "category": "buzzing",
            "platform": "Prime Video",
            "rating": 4.7,
            "thumbnail": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop",
            "description": "Behind the scenes of the most epic tour of 2024.",
            "release_date": "2025-01",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "Music history in the making"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Bigg Boss 18 Finale",
            "category": "buzzing",
            "platform": "JioHotstar",
            "rating": 3.8,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "The drama reaches its peak as finalists battle it out.",
            "release_date": "2025-01",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Who takes the trophy?"
        },
        
        # Hot Drop Alert
        {
            "id": str(uuid.uuid4()),
            "title": "Pushpa 2: The Rule",
            "category": "hot_drop",
            "platform": "Netflix",
            "rating": 4.8,
            "thumbnail": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
            "description": "Pushpa is back and the stakes are higher than ever.",
            "release_date": "2025-02",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "The wildfire returns"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Maharaja",
            "category": "hot_drop",
            "platform": "Prime Video",
            "rating": 4.7,
            "thumbnail": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
            "description": "A barber's quest for justice in this gripping thriller.",
            "release_date": "2025-02",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "Revenge served cold"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "IPL 2025 Opening",
            "category": "hot_drop",
            "platform": "JioHotstar",
            "rating": 4.9,
            "thumbnail": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=600&fit=crop",
            "description": "The biggest cricket carnival is back!",
            "release_date": "2025-03",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Boundaries and sixes incoming"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Citadel: Honey Bunny",
            "category": "hot_drop",
            "platform": "Prime Video",
            "rating": 4.5,
            "thumbnail": "https://images.unsplash.com/photo-1574267432644-f71eea4b7b25?w=400&h=600&fit=crop",
            "description": "The Indian chapter of the Citadel universe.",
            "release_date": "2025-02",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Spy games just got desi"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Fabulous Lives S3",
            "category": "hot_drop",
            "platform": "Netflix",
            "rating": 3.6,
            "thumbnail": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop",
            "description": "More drama, more luxury, more Bollywood.",
            "release_date": "2025-02",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Living the dream"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "India: The Modi Question",
            "category": "hot_drop",
            "platform": "Apple TV",
            "rating": 4.1,
            "thumbnail": "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=400&h=600&fit=crop",
            "description": "A deep dive into modern Indian politics.",
            "release_date": "2025-02",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "The untold story"
        },
        
        # Movies
        {
            "id": str(uuid.uuid4()),
            "title": "Jawan",
            "category": "movies",
            "platform": "Netflix",
            "rating": 4.6,
            "thumbnail": "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
            "description": "A vigilante on a mission to expose corruption.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "SRK is back!"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "12th Fail",
            "category": "movies",
            "platform": "JioHotstar",
            "rating": 4.9,
            "thumbnail": "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=400&h=600&fit=crop",
            "description": "The inspiring journey of an IPS officer.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "Never give up"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Animal",
            "category": "movies",
            "platform": "Netflix",
            "rating": 4.1,
            "thumbnail": "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&h=600&fit=crop",
            "description": "A man's violent quest for revenge.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "Unleash the beast"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Kantara",
            "category": "movies",
            "platform": "Prime Video",
            "rating": 4.8,
            "thumbnail": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=600&fit=crop",
            "description": "A mystical tale rooted in coastal Karnataka's culture.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "Divine folklore"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dunki",
            "category": "movies",
            "platform": "Netflix",
            "rating": 4.3,
            "thumbnail": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",
            "description": "A heartwarming story about illegal immigration.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "Journey of dreams"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Rocky Aur Rani",
            "category": "movies",
            "platform": "Prime Video",
            "rating": 4.0,
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=600&fit=crop",
            "description": "A modern take on old-school romance.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "movie",
            "tagline": "Love knows no bounds"
        },
        
        # Series
        {
            "id": str(uuid.uuid4()),
            "title": "Mirzapur S3",
            "category": "series",
            "platform": "Prime Video",
            "rating": 4.7,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "The battle for Mirzapur intensifies.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Power. Blood. Revenge."
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Scam 2025",
            "category": "series",
            "platform": "SonyLIV",
            "rating": 4.6,
            "thumbnail": "https://images.unsplash.com/photo-1561489396-888724a1543d?w=400&h=600&fit=crop",
            "description": "The latest financial fraud that shook India.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Money makes monsters"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Night Manager",
            "category": "series",
            "platform": "JioHotstar",
            "rating": 4.5,
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "description": "An ex-soldier infiltrates an arms dealer's inner circle.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Trust no one"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Rocket Boys S2",
            "category": "series",
            "platform": "SonyLIV",
            "rating": 4.8,
            "thumbnail": "https://images.unsplash.com/photo-1446776858070-4cd79d3c4769?w=400&h=600&fit=crop",
            "description": "India's space program takes flight.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Dream. Build. Launch."
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Delhi Crime S3",
            "category": "series",
            "platform": "Netflix",
            "rating": 4.9,
            "thumbnail": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=600&fit=crop",
            "description": "New crimes. Same gritty investigation.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Justice never sleeps"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Made in Heaven S3",
            "category": "series",
            "platform": "Prime Video",
            "rating": 4.4,
            "thumbnail": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop",
            "description": "More weddings, more drama, more secrets.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "series",
            "tagline": "Perfect weddings, imperfect lives"
        },
        
        # Sports
        {
            "id": str(uuid.uuid4()),
            "title": "ICC World Cup Final",
            "category": "sports",
            "platform": "JioHotstar",
            "rating": 4.9,
            "thumbnail": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&h=600&fit=crop",
            "description": "The ultimate cricket showdown.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Glory awaits"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "ISL Finals 2025",
            "category": "sports",
            "platform": "JioHotstar",
            "rating": 3.8,
            "thumbnail": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=600&fit=crop",
            "description": "Indian football's biggest night.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Kickin' it!"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "UFC Fight Night Mumbai",
            "category": "sports",
            "platform": "SonyLIV",
            "rating": 4.5,
            "thumbnail": "https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=400&h=600&fit=crop",
            "description": "UFC comes to India for the first time!",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Octagon madness"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Kabaddi League Finals",
            "category": "sports",
            "platform": "JioHotstar",
            "rating": 4.2,
            "thumbnail": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=600&fit=crop",
            "description": "India's favorite indigenous sport in action.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Raid! Raid! Raid!"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "F1 Indian GP",
            "category": "sports",
            "platform": "JioHotstar",
            "rating": 4.7,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "Formula 1 returns to India after a decade.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Speed thrills!"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Chess Olympiad Highlights",
            "category": "sports",
            "platform": "FIDE",
            "rating": 4.3,
            "thumbnail": "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400&h=600&fit=crop",
            "description": "India's chess prodigies dominate the world stage.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "sports_event",
            "tagline": "Checkmate nation"
        },
        
        # Documentaries
        {
            "id": str(uuid.uuid4()),
            "title": "The Indus Saga",
            "category": "documentaries",
            "platform": "Netflix",
            "rating": 4.5,
            "thumbnail": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=600&fit=crop",
            "description": "Exploring ancient Indian civilization.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "History reimagined"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Tiger Kingdom",
            "category": "documentaries",
            "platform": "Prime Video",
            "rating": 4.8,
            "thumbnail": "https://images.unsplash.com/photo-1590481206993-b934c4e32eb6?w=400&h=600&fit=crop",
            "description": "India's wild tigers in their natural habitat.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "Roar of the wild"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Bollywood Behind Bars",
            "category": "documentaries",
            "platform": "Netflix",
            "rating": 4.2,
            "thumbnail": "https://images.unsplash.com/photo-1515325915697-3bffeee25c1e?w=400&h=600&fit=crop",
            "description": "Scandals that shocked the film industry.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "Lights, camera, crime"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Start-Up Nation",
            "category": "documentaries",
            "platform": "Apple TV",
            "rating": 4.4,
            "thumbnail": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=600&fit=crop",
            "description": "How India became a tech powerhouse.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "Innovation unleashed"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mumbai Monsoon",
            "category": "documentaries",
            "platform": "Netflix",
            "rating": 4.6,
            "thumbnail": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=400&h=600&fit=crop",
            "description": "Life during Mumbai's heaviest rainfall season.",
            "release_date": "2024",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "Rain and resilience"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Sacred Games",
            "category": "documentaries",
            "platform": "Prime Video",
            "rating": 4.3,
            "thumbnail": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&h=600&fit=crop",
            "description": "Religion, politics, and power in modern India.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "documentary",
            "tagline": "Faith meets fact"
        },
        
        # Reality
        {
            "id": str(uuid.uuid4()),
            "title": "Roadies X",
            "category": "reality",
            "platform": "JioHotstar",
            "rating": 3.9,
            "thumbnail": "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400&h=600&fit=crop",
            "description": "India's toughest reality show is back.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Adventure redefined"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "MasterChef India S8",
            "category": "reality",
            "platform": "SonyLIV",
            "rating": 4.2,
            "thumbnail": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=600&fit=crop",
            "description": "Amateur chefs compete for the ultimate title.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Cook like a pro"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Khatron Ke Khiladi",
            "category": "reality",
            "platform": "JioHotstar",
            "rating": 4.0,
            "thumbnail": "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=400&h=600&fit=crop",
            "description": "Celebrities face their worst fears.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Fear is just the beginning"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Lock Upp S2",
            "category": "reality",
            "platform": "MX Player",
            "rating": 3.5,
            "thumbnail": "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=400&h=600&fit=crop",
            "description": "Controversial celebs locked up for the ultimate test.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Drama behind bars"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Indian Idol 15",
            "category": "reality",
            "platform": "SonyLIV",
            "rating": 4.1,
            "thumbnail": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop",
            "description": "Singing sensations compete for stardom.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Voice of the nation"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Splitsvilla X5",
            "category": "reality",
            "platform": "JioHotstar",
            "rating": 3.3,
            "thumbnail": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=600&fit=crop",
            "description": "Love, betrayal, and villa drama.",
            "release_date": "2025",
            "social_links": {"youtube": "#", "twitter": "#", "reddit": "#"},
            "content_type": "reality_show",
            "tagline": "Find love or go home"
        }
    ]
    
    await db.content.insert_many(mock_content)
    return {"message": f"Seeded {len(mock_content)} content items"}

# Chat Routes
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    """Chat with AI recommendation agent"""
    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=message.session_id,
            system_message="""You are The Connector's AI guide - a fun, expert OTT content recommender with a tongue-in-cheek personality.
            
Your role:
- Recommend content from Indian OTT platforms (Netflix, JioHotstar, Prime Video, SonyLIV, Apple TV, MX Player, etc.)
- Speak in a friendly, conversational, pop-culture-savvy tone
- Be authoritative yet approachable - like a cool friend who knows everything about streaming
- Use phrases like "Here's what's buzzing", "You can't miss this", "Trust me on this one"
- Keep responses concise (2-3 sentences max) unless asked for details
- Always mention WHERE to watch and WHY (ratings, buzz factor)
- Be enthusiastic about trending content but honest about quality

Your expertise covers:
- Movies, Series, Sports, Documentaries, Reality Shows
- Latest releases and trending content
- Platform-specific recommendations
- IMDB ratings and social media buzz

Personality: Expert + Fun + Direct + Pop-culture aware"""
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=message.message)
        response = await chat.send_message(user_message)
        
        # Store chat in database
        chat_doc = {
            "session_id": message.session_id,
            "user_message": message.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.chats.insert_one(chat_doc)
        
        return ChatResponse(response=response, session_id=message.session_id)
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()