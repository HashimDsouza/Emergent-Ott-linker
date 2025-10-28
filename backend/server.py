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

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    platform: str
    platform_content_id: Optional[str] = None
    rating: float
    thumbnail: str
    description: str
    release_date: str
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: str = ""
    likes: int = 0
    shares: int = 0

class ContentCreate(BaseModel):
    title: str
    category: str
    platform: str
    platform_content_id: Optional[str] = None
    rating: float
    thumbnail: str
    description: str
    release_date: str
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: str = ""

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    points: int = 0
    level: int = 1
    badges: List[str] = Field(default_factory=list)
    avatar: str = "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
    liked_content: List[str] = Field(default_factory=list)
    favorite_genres: List[str] = Field(default_factory=list)
    favorite_platforms: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    username: str
    email: str

class UserUpdate(BaseModel):
    favorite_genres: Optional[List[str]] = None
    favorite_platforms: Optional[List[str]] = None
    avatar: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))

class ChatResponse(BaseModel):
    response: str
    session_id: str

class CommunityMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    avatar: str
    message: str
    content_id: Optional[str] = None
    likes: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CommunityMessageCreate(BaseModel):
    user_id: str
    message: str
    content_id: Optional[str] = None

class LikeAction(BaseModel):
    user_id: str
    content_id: str

class ShareAction(BaseModel):
    user_id: str
    content_id: str
    platform: str

async def award_points(user_id: str, points: int, badge: Optional[str] = None):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    
    new_points = user["points"] + points
    new_level = (new_points // 100) + 1
    
    update_data = {"points": new_points, "level": new_level}
    
    if badge and badge not in user.get("badges", []):
        update_data["badges"] = user.get("badges", []) + [badge]
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})

@api_router.get("/")
async def root():
    return {"message": "Welcome to The Connector API"}

@api_router.get("/content", response_model=List[Content])
async def get_all_content():
    content_list = await db.content.find({}, {"_id": 0}).to_list(1000)
    return content_list

@api_router.get("/content/{category}", response_model=List[Content])
async def get_content_by_category(category: str):
    content_list = await db.content.find({"category": category}, {"_id": 0}).to_list(100)
    return content_list

@api_router.post("/content", response_model=Content)
async def create_content(input: ContentCreate):
    content_obj = Content(**input.model_dump(), likes=0, shares=0)
    doc = content_obj.model_dump()
    await db.content.insert_one(doc)
    return content_obj

@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    existing = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing:
        return User(**existing)
    
    user_obj = User(**input.model_dump())
    doc = user_obj.model_dump()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update: UserUpdate):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return User(**updated_user)

@api_router.get("/leaderboard", response_model=List[User])
async def get_leaderboard(limit: int = 10):
    users = await db.users.find({}, {"_id": 0}).sort("points", -1).limit(limit).to_list(limit)
    return [User(**u) for u in users]

@api_router.post("/content/like")
async def like_content(action: LikeAction):
    content = await db.content.find_one({"id": action.content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if action.content_id in user.get("liked_content", []):
        return {"message": "Already liked", "points_earned": 0}
    
    await db.content.update_one({"id": action.content_id}, {"$inc": {"likes": 1}})
    await db.users.update_one({"id": action.user_id}, {"$push": {"liked_content": action.content_id}})
    await award_points(action.user_id, 5)
    
    updated_user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if len(updated_user.get("liked_content", [])) >= 10:
        await award_points(action.user_id, 0, "Content Lover")
    
    return {"message": "Content liked", "points_earned": 5}

@api_router.post("/content/share")
async def share_content(action: ShareAction):
    content = await db.content.find_one({"id": action.content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.content.update_one({"id": action.content_id}, {"$inc": {"shares": 1}})
    await award_points(action.user_id, 10, "Social Butterfly" if user["points"] + 10 >= 100 else None)
    
    return {"message": "Content shared", "points_earned": 10}

@api_router.post("/community/messages", response_model=CommunityMessage)
async def post_message(input: CommunityMessageCreate):
    user = await db.users.find_one({"id": input.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    message_obj = CommunityMessage(
        user_id=input.user_id,
        username=user["username"],
        avatar=user["avatar"],
        message=input.message,
        content_id=input.content_id
    )
    
    doc = message_obj.model_dump()
    await db.community_messages.insert_one(doc)
    await award_points(input.user_id, 15)
    
    return message_obj

@api_router.get("/community/messages", response_model=List[CommunityMessage])
async def get_messages(content_id: Optional[str] = None, limit: int = 50):
    query = {"content_id": content_id} if content_id else {"content_id": None}
    messages = await db.community_messages.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [CommunityMessage(**m) for m in reversed(messages)]

@api_router.post("/content/seed")
async def seed_content():
    await db.content.delete_many({})
    
    mock_content = [
        # Buzzing Now
        {"id": str(uuid.uuid4()), "title": "The Bads of Bollywood", "category": "buzzing", "platform": "Netflix", "platform_content_id": None, "rating": 4.5, "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop", "description": "Drama and glamour behind Bollywood's biggest stars.", "release_date": "2025-01", "social_links": {"youtube": "https://www.youtube.com/results?search_query=The+Bads+of+Bollywood+trailer", "twitter": "https://twitter.com/search?q=%23BadsBollywood", "reddit": "https://www.reddit.com/search/?q=Bads+Bollywood"}, "content_type": "series", "tagline": "Behind the curtain", "likes": 1234, "shares": 567},
        {"id": str(uuid.uuid4()), "title": "UEFA Champions League", "category": "buzzing", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.9, "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop", "description": "The biggest club football competition is here!", "release_date": "2025-03", "social_links": {"youtube": "https://www.youtube.com/results?search_query=UEFA+Champions+League+highlights", "twitter": "https://twitter.com/search?q=%23UCL", "reddit": "https://www.reddit.com/r/soccer"}, "content_type": "sports_event", "tagline": "Football fever", "likes": 3456, "shares": 1234},
        {"id": str(uuid.uuid4()), "title": "Severance Season 2", "category": "buzzing", "platform": "Apple TV", "platform_content_id": None, "rating": 4.8, "thumbnail": "https://images.unsplash.com/photo-1542204165-19b4f98b48ed?w=400&h=600&fit=crop", "description": "The mind-bending thriller returns with more twists.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Severance+Season+2+trailer", "twitter": "https://twitter.com/search?q=%23Severance", "reddit": "https://www.reddit.com/r/SeveranceAppleTVPlus"}, "content_type": "series", "tagline": "Mind = Blown", "likes": 2345, "shares": 987},
        {"id": str(uuid.uuid4()), "title": "The Hunt", "category": "buzzing", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop", "description": "A gripping chase across continents.", "release_date": "2025-01", "social_links": {"youtube": "https://www.youtube.com/results?search_query=The+Hunt+series+trailer", "twitter": "https://twitter.com/search?q=%23TheHunt", "reddit": "https://www.reddit.com/search/?q=The+Hunt+series"}, "content_type": "series", "tagline": "Run or be caught", "likes": 1567, "shares": 678},
        {"id": str(uuid.uuid4()), "title": "Drive To Survive", "category": "buzzing", "platform": "Netflix", "platform_content_id": None, "rating": 4.7, "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop", "description": "F1 drama like you've never seen before.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Drive+To+Survive+F1+trailer", "twitter": "https://twitter.com/search?q=%23DriveToSurvive", "reddit": "https://www.reddit.com/r/formula1"}, "content_type": "documentary", "tagline": "Speed thrills", "likes": 2890, "shares": 1123},
        {"id": str(uuid.uuid4()), "title": "Citadel", "category": "buzzing", "platform": "Prime Video", "platform_content_id": None, "rating": 4.4, "thumbnail": "https://images.unsplash.com/photo-1574267432644-f71eea4b7b25?w=400&h=600&fit=crop", "description": "Spy action at its finest.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Citadel+series+trailer", "twitter": "https://twitter.com/search?q=%23Citadel", "reddit": "https://www.reddit.com/r/CitadelPrime"}, "content_type": "series", "tagline": "Trust no one", "likes": 1890, "shares": 834},
        
        # Hot Drop Alert
        {"id": str(uuid.uuid4()), "title": "Pushpa 2: The Rule", "category": "hot_drop", "platform": "Netflix", "platform_content_id": None, "rating": 4.8, "thumbnail": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop", "description": "Pushpa is back and the stakes are higher than ever.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Pushpa+2+The+Rule+trailer", "twitter": "https://twitter.com/search?q=%23Pushpa2", "reddit": "https://www.reddit.com/search/?q=Pushpa+2"}, "content_type": "movie", "tagline": "The wildfire returns", "likes": 2345, "shares": 987},
        {"id": str(uuid.uuid4()), "title": "Maharaja", "category": "hot_drop", "platform": "Netflix", "platform_content_id": None, "rating": 4.7, "thumbnail": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop", "description": "A barber's quest for justice in this gripping thriller.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Maharaja+movie+trailer", "twitter": "https://twitter.com/search?q=%23Maharaja", "reddit": "https://www.reddit.com/search/?q=Maharaja+movie"}, "content_type": "movie", "tagline": "Revenge served cold", "likes": 1567, "shares": 734},
        {"id": str(uuid.uuid4()), "title": "Fabulous Lives of Bollywood Wives", "category": "hot_drop", "platform": "Netflix", "platform_content_id": None, "rating": 3.8, "thumbnail": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop", "description": "More drama, more luxury, more Bollywood.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Fabulous+Lives+Bollywood+Wives+trailer", "twitter": "https://twitter.com/search?q=%23FabulousLives", "reddit": "https://www.reddit.com/search/?q=Bollywood+Wives"}, "content_type": "reality_show", "tagline": "Living the dream", "likes": 445, "shares": 178},
        {"id": str(uuid.uuid4()), "title": "Citadel: Honey Bunny", "category": "hot_drop", "platform": "Prime Video", "platform_content_id": None, "rating": 4.5, "thumbnail": "https://images.unsplash.com/photo-1574267432644-f71eea4b7b25?w=400&h=600&fit=crop", "description": "The Indian chapter of the Citadel universe.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Citadel+Honey+Bunny+trailer", "twitter": "https://twitter.com/search?q=%23CitadelHoneyBunny", "reddit": "https://www.reddit.com/r/CitadelPrime"}, "content_type": "series", "tagline": "Spy games just got desi", "likes": 987, "shares": 456},
        {"id": str(uuid.uuid4()), "title": "Bad Boy Billionaires", "category": "hot_drop", "platform": "Netflix", "platform_content_id": None, "rating": 4.3, "thumbnail": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=600&fit=crop", "description": "India's most infamous business tycoons exposed.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Bad+Boy+Billionaires+trailer", "twitter": "https://twitter.com/search?q=%23BadBoyBillionaires", "reddit": "https://www.reddit.com/search/?q=Bad+Boy+Billionaires"}, "content_type": "documentary", "tagline": "Power corrupts", "likes": 1234, "shares": 567},
        {"id": str(uuid.uuid4()), "title": "Turning Point Cold War", "category": "hot_drop", "platform": "Netflix", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=600&fit=crop", "description": "The untold story of the Cold War.", "release_date": "2025-02", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Turning+Point+Cold+War+trailer", "twitter": "https://twitter.com/search?q=%23TurningPoint", "reddit": "https://www.reddit.com/search/?q=Turning+Point+Cold+War"}, "content_type": "documentary", "tagline": "History revealed", "likes": 890, "shares": 345},
        
        # Movies
        {"id": str(uuid.uuid4()), "title": "Jawan", "category": "movies", "platform": "Netflix", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop", "description": "A vigilante on a mission to expose corruption.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Jawan+movie+trailer", "twitter": "https://twitter.com/search?q=%23Jawan", "reddit": "https://www.reddit.com/search/?q=Jawan+movie"}, "content_type": "movie", "tagline": "SRK is back!", "likes": 1890, "shares": 890},
        {"id": str(uuid.uuid4()), "title": "12th Fail", "category": "movies", "platform": "JioHotstar", "platform_content_id": None, "rating": 4.9, "thumbnail": "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=400&h=600&fit=crop", "description": "The inspiring journey of an IPS officer.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=12th+Fail+movie+trailer", "twitter": "https://twitter.com/search?q=%2312thFail", "reddit": "https://www.reddit.com/search/?q=12th+Fail"}, "content_type": "movie", "tagline": "Never give up", "likes": 3456, "shares": 1567},
        {"id": str(uuid.uuid4()), "title": "Animal", "category": "movies", "platform": "Netflix", "platform_content_id": None, "rating": 4.1, "thumbnail": "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&h=600&fit=crop", "description": "A man's violent quest for revenge.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Animal+movie+trailer", "twitter": "https://twitter.com/search?q=%23AnimalMovie", "reddit": "https://www.reddit.com/search/?q=Animal+movie"}, "content_type": "movie", "tagline": "Unleash the beast", "likes": 2234, "shares": 987},
        {"id": str(uuid.uuid4()), "title": "Kantara", "category": "movies", "platform": "Prime Video", "platform_content_id": None, "rating": 4.8, "thumbnail": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=600&fit=crop", "description": "A mystical tale rooted in coastal Karnataka's culture.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Kantara+movie+trailer", "twitter": "https://twitter.com/search?q=%23Kantara", "reddit": "https://www.reddit.com/search/?q=Kantara+movie"}, "content_type": "movie", "tagline": "Divine folklore", "likes": 1678, "shares": 678},
        {"id": str(uuid.uuid4()), "title": "Dunki", "category": "movies", "platform": "Netflix", "platform_content_id": None, "rating": 4.3, "thumbnail": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop", "description": "A heartwarming story about illegal immigration.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Dunki+movie+trailer", "twitter": "https://twitter.com/search?q=%23Dunki", "reddit": "https://www.reddit.com/search/?q=Dunki+movie"}, "content_type": "movie", "tagline": "Journey of dreams", "likes": 987, "shares": 445},
        {"id": str(uuid.uuid4()), "title": "Rocky Aur Rani", "category": "movies", "platform": "Prime Video", "platform_content_id": None, "rating": 4.0, "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=600&fit=crop", "description": "A modern take on old-school romance.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Rocky+Aur+Rani+trailer", "twitter": "https://twitter.com/search?q=%23RockyAurRani", "reddit": "https://www.reddit.com/search/?q=Rocky+Aur+Rani"}, "content_type": "movie", "tagline": "Love knows no bounds", "likes": 765, "shares": 234},
        
        # Series
        {"id": str(uuid.uuid4()), "title": "Mirzapur S3", "category": "series", "platform": "Prime Video", "platform_content_id": None, "rating": 4.7, "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop", "description": "The battle for Mirzapur intensifies.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Mirzapur+S3+trailer", "twitter": "https://twitter.com/search?q=%23Mirzapur", "reddit": "https://www.reddit.com/r/Mirzapur"}, "content_type": "series", "tagline": "Power. Blood. Revenge.", "likes": 2890, "shares": 1234},
        {"id": str(uuid.uuid4()), "title": "Scam 2003", "category": "series", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1561489396-888724a1543d?w=400&h=600&fit=crop", "description": "The Telgi scam that shook India.", "release_date": "2023", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Scam+2003+trailer", "twitter": "https://twitter.com/search?q=%23Scam2003", "reddit": "https://www.reddit.com/search/?q=Scam+2003"}, "content_type": "series", "tagline": "Money makes monsters", "likes": 1567, "shares": 678},
        {"id": str(uuid.uuid4()), "title": "The Night Manager", "category": "series", "platform": "JioHotstar", "platform_content_id": None, "rating": 4.5, "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop", "description": "An ex-soldier infiltrates an arms dealer's inner circle.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=The+Night+Manager+series+trailer", "twitter": "https://twitter.com/search?q=%23TheNightManager", "reddit": "https://www.reddit.com/search/?q=Night+Manager+series"}, "content_type": "series", "tagline": "Trust no one", "likes": 1234, "shares": 567},
        {"id": str(uuid.uuid4()), "title": "Rocket Boys S2", "category": "series", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.8, "thumbnail": "https://images.unsplash.com/photo-1446776858070-4cd79d3c4769?w=400&h=600&fit=crop", "description": "India's space program takes flight.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Rocket+Boys+S2+trailer", "twitter": "https://twitter.com/search?q=%23RocketBoys", "reddit": "https://www.reddit.com/search/?q=Rocket+Boys"}, "content_type": "series", "tagline": "Dream. Build. Launch.", "likes": 987, "shares": 456},
        {"id": str(uuid.uuid4()), "title": "Delhi Crime S3", "category": "series", "platform": "Netflix", "platform_content_id": None, "rating": 4.9, "thumbnail": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=600&fit=crop", "description": "New crimes. Same gritty investigation.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Delhi+Crime+S3+trailer", "twitter": "https://twitter.com/search?q=%23DelhiCrime", "reddit": "https://www.reddit.com/search/?q=Delhi+Crime"}, "content_type": "series", "tagline": "Justice never sleeps", "likes": 2345, "shares": 890},
        {"id": str(uuid.uuid4()), "title": "Made in Heaven S3", "category": "series", "platform": "Prime Video", "platform_content_id": None, "rating": 4.4, "thumbnail": "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop", "description": "More weddings, more drama, more secrets.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Made+in+Heaven+S3+trailer", "twitter": "https://twitter.com/search?q=%23MadeInHeaven", "reddit": "https://www.reddit.com/search/?q=Made+in+Heaven"}, "content_type": "series", "tagline": "Perfect weddings, imperfect lives", "likes": 1456, "shares": 678},
        
        # Sports
        {"id": str(uuid.uuid4()), "title": "ICC World Cup Final", "category": "sports", "platform": "JioHotstar", "platform_content_id": None, "rating": 4.9, "thumbnail": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&h=600&fit=crop", "description": "The ultimate cricket showdown.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=ICC+World+Cup+Final+highlights", "twitter": "https://twitter.com/search?q=%23CWC", "reddit": "https://www.reddit.com/r/Cricket"}, "content_type": "sports_event", "tagline": "Glory awaits", "likes": 4567, "shares": 2345},
        {"id": str(uuid.uuid4()), "title": "ISL Finals 2025", "category": "sports", "platform": "JioHotstar", "platform_content_id": None, "rating": 3.8, "thumbnail": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=600&fit=crop", "description": "Indian football's biggest night.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=ISL+Finals+highlights", "twitter": "https://twitter.com/search?q=%23ISL", "reddit": "https://www.reddit.com/r/IndianFootball"}, "content_type": "sports_event", "tagline": "Kickin' it!", "likes": 890, "shares": 234},
        {"id": str(uuid.uuid4()), "title": "UFC Fight Night Mumbai", "category": "sports", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.5, "thumbnail": "https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=400&h=600&fit=crop", "description": "UFC comes to India for the first time!", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=UFC+Fight+Night+Mumbai", "twitter": "https://twitter.com/search?q=%23UFCMumbai", "reddit": "https://www.reddit.com/r/MMA"}, "content_type": "sports_event", "tagline": "Octagon madness", "likes": 1567, "shares": 678},
        {"id": str(uuid.uuid4()), "title": "LaLiga", "category": "sports", "platform": "Fancode", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&h=600&fit=crop", "description": "Spanish football's top division with world-class action.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=LaLiga+highlights", "twitter": "https://twitter.com/search?q=%23LaLiga", "reddit": "https://www.reddit.com/r/LaLiga"}, "content_type": "sports_event", "tagline": "El Clasico awaits", "likes": 1234, "shares": 456},
        {"id": str(uuid.uuid4()), "title": "Formula 1", "category": "sports", "platform": "Fancode", "platform_content_id": None, "rating": 4.8, "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop", "description": "The pinnacle of motorsport racing.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Formula+1+highlights", "twitter": "https://twitter.com/search?q=%23F1", "reddit": "https://www.reddit.com/r/formula1"}, "content_type": "sports_event", "tagline": "Speed thrills!", "likes": 2890, "shares": 1234},
        {"id": str(uuid.uuid4()), "title": "Chess Olympiad Highlights", "category": "sports", "platform": "YouTube", "platform_content_id": None, "rating": 4.3, "thumbnail": "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400&h=600&fit=crop", "description": "India's chess prodigies dominate the world stage.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Chess+Olympiad+India", "twitter": "https://twitter.com/search?q=%23ChessOlympiad", "reddit": "https://www.reddit.com/r/chess"}, "content_type": "sports_event", "tagline": "Checkmate nation", "likes": 678, "shares": 234},
        
        # Docu Series
        {"id": str(uuid.uuid4()), "title": "Turning Point Cold War", "category": "docu_series", "platform": "Netflix", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=600&fit=crop", "description": "The untold story of the Cold War and how it shaped our world.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Turning+Point+Cold+War+trailer", "twitter": "https://twitter.com/search?q=%23TurningPoint", "reddit": "https://www.reddit.com/search/?q=Turning+Point+Cold+War"}, "content_type": "documentary", "tagline": "History revealed", "likes": 1234, "shares": 567},
        {"id": str(uuid.uuid4()), "title": "London Bombing", "category": "docu_series", "platform": "Netflix", "platform_content_id": None, "rating": 4.5, "thumbnail": "https://images.unsplash.com/photo-1495580621852-5de0cc907d2f?w=400&h=600&fit=crop", "description": "The investigation into the 2005 London terror attacks.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=London+Bombing+documentary", "twitter": "https://twitter.com/search?q=%23LondonBombing", "reddit": "https://www.reddit.com/search/?q=London+Bombing"}, "content_type": "documentary", "tagline": "Never forget", "likes": 890, "shares": 345},
        {"id": str(uuid.uuid4()), "title": "Ted Bundy", "category": "docu_series", "platform": "Prime Video", "platform_content_id": None, "rating": 4.7, "thumbnail": "https://images.unsplash.com/photo-1515325915697-3bffeee25c1e?w=400&h=600&fit=crop", "description": "Inside the mind of America's most notorious serial killer.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Ted+Bundy+documentary", "twitter": "https://twitter.com/search?q=%23TedBundy", "reddit": "https://www.reddit.com/search/?q=Ted+Bundy"}, "content_type": "documentary", "tagline": "Evil unmasked", "likes": 1567, "shares": 678},
        {"id": str(uuid.uuid4()), "title": "Girls State", "category": "docu_series", "platform": "Apple TV", "platform_content_id": None, "rating": 4.8, "thumbnail": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=600&fit=crop", "description": "Young women navigate politics, power and democracy.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Girls+State+documentary", "twitter": "https://twitter.com/search?q=%23GirlsState", "reddit": "https://www.reddit.com/search/?q=Girls+State"}, "content_type": "documentary", "tagline": "Future leaders", "likes": 987, "shares": 456},
        {"id": str(uuid.uuid4()), "title": "Bad Boy Billionaires", "category": "docu_series", "platform": "Netflix", "platform_content_id": None, "rating": 4.4, "thumbnail": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=600&fit=crop", "description": "India's most infamous business tycoons exposed.", "release_date": "2020", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Bad+Boy+Billionaires+trailer", "twitter": "https://twitter.com/search?q=%23BadBoyBillionaires", "reddit": "https://www.reddit.com/search/?q=Bad+Boy+Billionaires"}, "content_type": "documentary", "tagline": "Power corrupts", "likes": 2345, "shares": 987},
        {"id": str(uuid.uuid4()), "title": "Tiger Kingdom", "category": "docu_series", "platform": "Prime Video", "platform_content_id": None, "rating": 4.6, "thumbnail": "https://images.unsplash.com/photo-1590481206993-b934c4e32eb6?w=400&h=600&fit=crop", "description": "India's wild tigers in their natural habitat.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Tiger+Kingdom+documentary", "twitter": "https://twitter.com/search?q=%23TigerKingdom", "reddit": "https://www.reddit.com/search/?q=Tiger+documentary"}, "content_type": "documentary", "tagline": "Roar of the wild", "likes": 1234, "shares": 567},
        
        # Reality
        {"id": str(uuid.uuid4()), "title": "Bigg Boss S19", "category": "reality", "platform": "JioHotstar", "platform_content_id": None, "rating": 3.9, "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop", "description": "India's most controversial reality show returns.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Bigg+Boss+S19", "twitter": "https://twitter.com/search?q=%23BiggBoss19", "reddit": "https://www.reddit.com/search/?q=Bigg+Boss"}, "content_type": "reality_show", "tagline": "Drama unleashed", "likes": 1567, "shares": 678},
        {"id": str(uuid.uuid4()), "title": "Kaun Banega Crorepati S17", "category": "reality", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.5, "thumbnail": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=600&fit=crop", "description": "Amitabh Bachchan returns with India's favorite quiz show.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=KBC+S17", "twitter": "https://twitter.com/search?q=%23KBC", "reddit": "https://www.reddit.com/search/?q=KBC"}, "content_type": "reality_show", "tagline": "Knowledge is power", "likes": 2890, "shares": 1234},
        {"id": str(uuid.uuid4()), "title": "Khatron Ke Khiladi", "category": "reality", "platform": "JioHotstar", "platform_content_id": None, "rating": 4.0, "thumbnail": "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=400&h=600&fit=crop", "description": "Celebrities face their worst fears.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Khatron+Ke+Khiladi", "twitter": "https://twitter.com/search?q=%23KhatronKeKhiladi", "reddit": "https://www.reddit.com/search/?q=Khatron+Ke+Khiladi"}, "content_type": "reality_show", "tagline": "Fear is just the beginning", "likes": 1234, "shares": 456},
        {"id": str(uuid.uuid4()), "title": "Keeping Up With The Kardashians", "category": "reality", "platform": "JioHotstar", "platform_content_id": None, "rating": 3.8, "thumbnail": "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=400&h=600&fit=crop", "description": "The Kardashian family drama continues.", "release_date": "2024", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Keeping+Up+Kardashians", "twitter": "https://twitter.com/search?q=%23KUWTK", "reddit": "https://www.reddit.com/r/KUWTK"}, "content_type": "reality_show", "tagline": "Fame and fortune", "likes": 987, "shares": 345},
        {"id": str(uuid.uuid4()), "title": "Indian Idol 15", "category": "reality", "platform": "SonyLIV", "platform_content_id": None, "rating": 4.1, "thumbnail": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop", "description": "Singing sensations compete for stardom.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Indian+Idol+15", "twitter": "https://twitter.com/search?q=%23IndianIdol", "reddit": "https://www.reddit.com/search/?q=Indian+Idol"}, "content_type": "reality_show", "tagline": "Voice of the nation", "likes": 1890, "shares": 789},
        {"id": str(uuid.uuid4()), "title": "Splitsvilla X5", "category": "reality", "platform": "JioHotstar", "platform_content_id": None, "rating": 3.3, "thumbnail": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=600&fit=crop", "description": "Love, betrayal, and villa drama.", "release_date": "2025", "social_links": {"youtube": "https://www.youtube.com/results?search_query=Splitsvilla+X5", "twitter": "https://twitter.com/search?q=%23Splitsvilla", "reddit": "https://www.reddit.com/search/?q=Splitsvilla"}, "content_type": "reality_show", "tagline": "Find love or go home", "likes": 445, "shares": 178}
    ]
    
    await db.content.insert_many(mock_content)
    return {"message": f"Seeded {len(mock_content)} content items"}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    try:
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

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()