from fastapi import FastAPI, APIRouter, HTTPException, Query
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
import httpx
import re

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
    rating: float  # Now will be IMDb rating from OMDb
    thumbnail: str  # Now will be TMDB poster path
    description: str
    release_date: str
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: str = ""
    likes: int = 0
    shares: int = 0
    # Enhanced metadata fields
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None
    imdb_rating: Optional[float] = None
    imdb_votes: Optional[str] = None
    poster_path: Optional[str] = None  # TMDB poster URL
    backdrop_path: Optional[str] = None  # TMDB backdrop URL
    year: Optional[int] = None
    normalized_title: Optional[str] = None  # For better search matching
    providers_in: List[str] = Field(default_factory=list)  # Available platforms in India
    watchmode_id: Optional[int] = None
    last_enriched: Optional[str] = None

class TitleLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title_id: str  # Content ID from our database
    country: str = "IN"
    provider: str
    web_url: Optional[str] = None
    scheme_url: Optional[str] = None
    app_search_url: Optional[str] = None
    platform_content_id: Optional[str] = None
    last_checked: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LinkResolverResponse(BaseModel):
    url: str
    scheme_url: Optional[str] = None
    fallback_search_url: str
    provider: str
    platform_content_id: Optional[str] = None

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

# Helper function to generate proper deep links
def generate_provider_links(provider: str, title: str, platform_content_id: Optional[str] = None) -> Dict[str, Optional[str]]:
    """
    Generate web URL, scheme URL, and search fallback for a provider
    """
    encoded_title = title.replace(" ", "+")
    
    links = {
        "web_url": None,
        "scheme_url": None,
        "app_search_url": None
    }
    
    if provider.lower() == "netflix":
        if platform_content_id:
            links["web_url"] = f"https://www.netflix.com/title/{platform_content_id}"
            links["scheme_url"] = f"nflx://www.netflix.com/title/{platform_content_id}"
        links["app_search_url"] = f"https://www.netflix.com/search?q={encoded_title}"
    
    elif provider.lower() == "prime video":
        if platform_content_id:
            links["web_url"] = f"https://www.primevideo.com/detail/{platform_content_id}"
            links["scheme_url"] = f"aiv://aiv/view?gti={platform_content_id}"
        links["app_search_url"] = f"https://www.primevideo.com/search?phrase={encoded_title}"
    
    elif provider.lower() == "jiohotstar":
        if platform_content_id:
            links["web_url"] = f"https://www.hotstar.com/in/{platform_content_id}"
            links["scheme_url"] = f"hotstar://content/{platform_content_id}"
        links["app_search_url"] = f"https://www.hotstar.com/in/search/{encoded_title}"
    
    elif provider.lower() == "sonyliv":
        if platform_content_id:
            links["web_url"] = f"https://www.sonyliv.com/shows/{platform_content_id}"
        links["app_search_url"] = "https://www.sonyliv.com/"
    
    elif provider.lower() == "apple tv":
        if platform_content_id:
            links["web_url"] = f"https://tv.apple.com/show/{platform_content_id}"
            links["scheme_url"] = f"com.apple.tv://tv.apple.com/show/{platform_content_id}"
        links["app_search_url"] = f"https://tv.apple.com/search?term={encoded_title}"
    
    elif provider.lower() in ["fancode", "mx player", "youtube"]:
        links["web_url"] = f"https://www.{provider.lower().replace(' ', '')}.com/"
        links["app_search_url"] = links["web_url"]
    
    return links

@api_router.get("/")
async def root():
    return {"message": "Welcome to The Connector API"}

@api_router.get("/resolve-link", response_model=LinkResolverResponse)
async def resolve_link(
    title_id: str = Query(..., description="Content ID"),
    provider: str = Query(..., description="Provider name"),
    country: str = Query("IN", description="Country code")
):
    """
    Resolve deep link for a title on a specific provider
    """
    # Get content from database
    content = await db.content.find_one({"id": title_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if we have a cached link
    cached_link = await db.title_links.find_one(
        {"title_id": title_id, "provider": provider.lower(), "country": country},
        {"_id": 0}
    )
    
    if cached_link:
        return LinkResolverResponse(
            url=cached_link.get("web_url") or cached_link.get("app_search_url", ""),
            scheme_url=cached_link.get("scheme_url"),
            fallback_search_url=cached_link.get("app_search_url", ""),
            provider=provider,
            platform_content_id=cached_link.get("platform_content_id")
        )
    
    # Generate links on the fly
    links = generate_provider_links(provider, content["title"], content.get("platform_content_id"))
    
    return LinkResolverResponse(
        url=links["web_url"] or links["app_search_url"],
        scheme_url=links["scheme_url"],
        fallback_search_url=links["app_search_url"],
        provider=provider,
        platform_content_id=content.get("platform_content_id")
    )

@api_router.post("/enrich-content")
async def enrich_content():
    """
    Enrich all existing content with proper deep links
    """
    all_content = await db.content.find({}, {"_id": 0}).to_list(1000)
    enriched_count = 0
    
    for content in all_content:
        provider = content.get("platform", "").lower()
        title = content.get("title", "")
        content_id = content.get("id")
        platform_content_id = content.get("platform_content_id")
        
        # Generate links
        links = generate_provider_links(provider, title, platform_content_id)
        
        # Store in title_links collection
        title_link = {
            "id": str(uuid.uuid4()),
            "title_id": content_id,
            "country": "IN",
            "provider": provider,
            "web_url": links["web_url"],
            "scheme_url": links["scheme_url"],
            "app_search_url": links["app_search_url"],
            "platform_content_id": platform_content_id,
            "last_checked": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert
        await db.title_links.update_one(
            {"title_id": content_id, "provider": provider, "country": "IN"},
            {"$set": title_link},
            upsert=True
        )
        enriched_count += 1
    
    return {"message": f"Enriched {enriched_count} content items with deep links"}

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
    """Seed comprehensive content for The Connector"""
    await db.content.delete_many({})
    
    # Comprehensive content with proper categories and search-friendly approach
    mock_content = [
        # BUZZING NOW Category
        {
            "id": str(uuid.uuid4()),
            "title": "Squid Game Season 2",
            "category": "buzzing",
            "platform": "Netflix",
            "platform_content_id": None,  # Will use search fallback
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "The deadly games return with new players and higher stakes.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Squid+Game+Season+2+trailer",
                "twitter": "https://twitter.com/search?q=%23SquidGame",
                "reddit": "https://www.reddit.com/r/squidgame"
            },
            "content_type": "series",
            "tagline": "Survival of the fittest",
            "likes": 4500,
            "shares": 1200
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mirzapur Season 3",
            "category": "buzzing",
            "platform": "Prime Video",
            "platform_content_id": None,
            "rating": 8.7,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "The battle for Mirzapur intensifies in this gripping finale.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Mirzapur+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23Mirzapur",
                "reddit": "https://www.reddit.com/r/mirzapur"
            },
            "content_type": "series",
            "tagline": "Power ki jung",
            "likes": 3800,
            "shares": 950
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Severance Season 2",
            "category": "buzzing",
            "platform": "Apple TV",
            "platform_content_id": None,
            "rating": 9.1,
            "thumbnail": "https://images.unsplash.com/photo-1542204165-19b4f98b48ed?w=400&h=600&fit=crop",
            "description": "The mind-bending thriller returns with more twists.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Severance+Season+2+trailer",
                "twitter": "https://twitter.com/search?q=%23Severance",
                "reddit": "https://www.reddit.com/r/SeveranceAppleTVPlus"
            },
            "content_type": "series",
            "tagline": "Mind = Blown",
            "likes": 3200,
            "shares": 850
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Scam 2003",
            "category": "buzzing",
            "platform": "SonyLIV",
            "platform_content_id": None,
            "rating": 9.0,
            "thumbnail": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
            "description": "The Telgi stamp paper scam that shook the nation.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Scam+2003+trailer",
                "twitter": "https://twitter.com/search?q=%23Scam2003",
                "reddit": "https://www.reddit.com/r/IndianWebSeries"
            },
            "content_type": "series",
            "tagline": "The stamp of deception",
            "likes": 2900,
            "shares": 780
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Family Man Season 3",
            "category": "buzzing",
            "platform": "Prime Video",
            "platform_content_id": None,
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "Srikant Tiwari is back for more action-packed missions.",
            "release_date": "2025-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=The+Family+Man+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23TheFamilyMan",
                "reddit": "https://www.reddit.com/r/TheFamilyMan"
            },
            "content_type": "series",
            "tagline": "Mission impossible",
            "likes": 3400,
            "shares": 920
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Asur Season 3",
            "category": "buzzing",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.6,
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "description": "The psychological thriller continues with new dark twists.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Asur+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23Asur",
                "reddit": "https://www.reddit.com/r/IndianWebSeries"
            },
            "content_type": "series",
            "tagline": "Evil never dies",
            "likes": 2700,
            "shares": 690
        },
        # HOT DROP ALERT Category
        {
            "id": str(uuid.uuid4()),
            "title": "Fighter",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.2,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "India's first aerial action film with Hrithik Roshan.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Fighter+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Fighter",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Sky is the limit",
            "likes": 3100,
            "shares": 840
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Maharaja",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "description": "A barber's search for his stolen dustbin leads to shocking revelations.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Maharaja+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Maharaja",
                "reddit": "https://www.reddit.com/r/kollywood"
            },
            "content_type": "movie",
            "tagline": "Revenge served cold",
            "likes": 2800,
            "shares": 750
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Animal",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 7.9,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "A son's dark journey to protect his father at any cost.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Animal+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Animal",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Unleash the beast",
            "likes": 4200,
            "shares": 1100
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dune Part 2",
            "category": "hot_drop",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
            "description": "Paul Atreides unites with the Fremen to seek revenge.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Dune+Part+2+trailer",
                "twitter": "https://twitter.com/search?q=%23DunePartTwo",
                "reddit": "https://www.reddit.com/r/dune"
            },
            "content_type": "movie",
            "tagline": "The prophecy is real",
            "likes": 3900,
            "shares": 980
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Salaar",
            "category": "hot_drop",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.3,
            "thumbnail": "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop",
            "description": "A violent saga of friendship, loyalty, and power.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Salaar+movie+trailer",
                "twitter": "https://twitter.com/search?q=%23Salaar",
                "reddit": "https://www.reddit.com/r/tollywood"
            },
            "content_type": "movie",
            "tagline": "Fire meets fury",
            "likes": 3600,
            "shares": 910
        },
        {
            "id": str(uuid.uuid4()),
            "title": "12th Fail",
            "category": "hot_drop",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 9.2,
            "thumbnail": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
            "description": "An inspiring story of perseverance and the UPSC dream.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=12th+Fail+trailer",
                "twitter": "https://twitter.com/search?q=%2312thFail",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "movie",
            "tagline": "Restart. Rebuild. Reclaim.",
            "likes": 4100,
            "shares": 1050
        },
        # DOCU SERIES Category
        {
            "id": str(uuid.uuid4()),
            "title": "Drive to Survive Season 6",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.7,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "Behind-the-scenes drama of Formula 1's 2024 season.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Drive+to+Survive+Season+6+trailer",
                "twitter": "https://twitter.com/search?q=%23DriveToSurvive",
                "reddit": "https://www.reddit.com/r/formula1"
            },
            "content_type": "documentary",
            "tagline": "Speed. Drama. Glory.",
            "likes": 3300,
            "shares": 870
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Indian Predator Season 3",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.1,
            "thumbnail": "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop",
            "description": "True crime stories that shocked India.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Indian+Predator+Season+3+trailer",
                "twitter": "https://twitter.com/search?q=%23IndianPredator",
                "reddit": "https://www.reddit.com/r/TrueCrime"
            },
            "content_type": "documentary",
            "tagline": "The darkest minds",
            "likes": 2600,
            "shares": 680
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Last Dance of Indian Cricket",
            "category": "docu_series",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=600&fit=crop",
            "description": "Legends' final moments in international cricket.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Indian+Cricket+Documentary",
                "twitter": "https://twitter.com/search?q=%23IndianCricket",
                "reddit": "https://www.reddit.com/r/Cricket"
            },
            "content_type": "documentary",
            "tagline": "End of an era",
            "likes": 3700,
            "shares": 940
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Planet Earth III",
            "category": "docu_series",
            "platform": "SonyLIV",
            "platform_content_id": None,
            "rating": 9.5,
            "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
            "description": "Breathtaking journey through Earth's most spectacular habitats.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Planet+Earth+III+trailer",
                "twitter": "https://twitter.com/search?q=%23PlanetEarth",
                "reddit": "https://www.reddit.com/r/Documentaries"
            },
            "content_type": "documentary",
            "tagline": "Nature's masterpiece",
            "likes": 2900,
            "shares": 760
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Beckham Beyond the Field",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.4,
            "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop",
            "description": "The untold story of David Beckham's life and career.",
            "release_date": "2024-12",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Beckham+Documentary+trailer",
                "twitter": "https://twitter.com/search?q=%23Beckham",
                "reddit": "https://www.reddit.com/r/soccer"
            },
            "content_type": "documentary",
            "tagline": "Icon. Legend. Human.",
            "likes": 3100,
            "shares": 820
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Our Universe",
            "category": "docu_series",
            "platform": "Netflix",
            "platform_content_id": None,
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
            "description": "An epic cosmic journey narrated by Morgan Freeman.",
            "release_date": "2025-01",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Our+Universe+Documentary+trailer",
                "twitter": "https://twitter.com/search?q=%23OurUniverse",
                "reddit": "https://www.reddit.com/r/space"
            },
            "content_type": "documentary",
            "tagline": "Infinite wonders",
            "likes": 2800,
            "shares": 730
        },
        # SPORTS Category
        {
            "id": str(uuid.uuid4()),
            "title": "IPL 2025 Live",
            "category": "sports",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 9.3,
            "thumbnail": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=600&fit=crop",
            "description": "The biggest cricket carnival is back with thrilling matches.",
            "release_date": "2025-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=IPL+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23IPL2025",
                "reddit": "https://www.reddit.com/r/Cricket"
            },
            "content_type": "sports_event",
            "tagline": "Cricket fever!",
            "likes": 5200,
            "shares": 1400
        },
        {
            "id": str(uuid.uuid4()),
            "title": "UEFA Champions League",
            "category": "sports",
            "platform": "SonyLIV",
            "platform_content_id": None,
            "rating": 9.4,
            "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop",
            "description": "Europe's elite clubs battle for football supremacy.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=UEFA+Champions+League+highlights",
                "twitter": "https://twitter.com/search?q=%23UCL",
                "reddit": "https://www.reddit.com/r/soccer"
            },
            "content_type": "sports_event",
            "tagline": "Glory awaits",
            "likes": 4800,
            "shares": 1300
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Pro Kabaddi League 2025",
            "category": "sports",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.9,
            "thumbnail": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=600&fit=crop",
            "description": "India's indigenous sport at its competitive best.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Pro+Kabaddi+League+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23PKL2025",
                "reddit": "https://www.reddit.com/r/Kabaddi"
            },
            "content_type": "sports_event",
            "tagline": "Raid the night",
            "likes": 3400,
            "shares": 890
        },
        {
            "id": str(uuid.uuid4()),
            "title": "NBA Finals 2025",
            "category": "sports",
            "platform": "Fancode",
            "platform_content_id": None,
            "rating": 9.2,
            "thumbnail": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=600&fit=crop",
            "description": "The ultimate basketball showdown for the championship.",
            "release_date": "2025-06",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=NBA+Finals+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23NBAFinals",
                "reddit": "https://www.reddit.com/r/nba"
            },
            "content_type": "sports_event",
            "tagline": "Hoop dreams",
            "likes": 3800,
            "shares": 970
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Formula 1 Season 2025",
            "category": "sports",
            "platform": "Fancode",
            "platform_content_id": None,
            "rating": 9.1,
            "thumbnail": "https://images.unsplash.com/photo-1532035708-99aac78b0ad1?w=400&h=600&fit=crop",
            "description": "The fastest motorsport returns with new regulations.",
            "release_date": "2025-03",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=Formula+1+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23F1",
                "reddit": "https://www.reddit.com/r/formula1"
            },
            "content_type": "sports_event",
            "tagline": "Speed unleashed",
            "likes": 4200,
            "shares": 1080
        },
        {
            "id": str(uuid.uuid4()),
            "title": "ISL 2025",
            "category": "sports",
            "platform": "JioHotstar",
            "platform_content_id": None,
            "rating": 8.6,
            "thumbnail": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=600&fit=crop",
            "description": "Indian Super League brings top football action.",
            "release_date": "2025-02",
            "social_links": {
                "youtube": "https://www.youtube.com/results?search_query=ISL+2025+highlights",
                "twitter": "https://twitter.com/search?q=%23ISL",
                "reddit": "https://www.reddit.com/r/IndianFootball"
            },
            "content_type": "sports_event",
            "tagline": "Indian football rising",
            "likes": 3100,
            "shares": 810
        }
    ]
    
    # Insert the comprehensive content
    await db.content.insert_many(mock_content)
    
    return {"message": "Content seeded successfully with 24 items across all categories"}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=message.session_id,
            system_message="""You are The Connector's AI guide."""
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