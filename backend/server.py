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
    rating: float
    thumbnail: str
    description: str
    release_date: str
    social_links: Dict[str, str] = Field(default_factory=dict)
    content_type: str
    tagline: str = ""
    likes: int = 0
    shares: int = 0

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
    """Seed content - keeping existing implementation"""
    await db.content.delete_many({})
    
    # Sample content for testing deep linking
    mock_content = [
        {
            "id": "208c17e4-5087-4f0a-9234-352fac787bbe",
            "title": "The Bads of Bollywood",
            "category": "buzzing",
            "platform": "Netflix",
            "platform_content_id": "81234567",
            "rating": 8.5,
            "thumbnail": "https://images.unsplash.com/photo-1489599735734-79b4169c2a78?w=400&h=600&fit=crop",
            "description": "A gripping drama series that explores the dark side of Bollywood.",
            "release_date": "2024-01-15",
            "social_links": {
                "youtube": "https://www.youtube.com/watch?v=example1",
                "twitter": "https://twitter.com/search?q=BadsBollywood",
                "reddit": "https://www.reddit.com/r/bollywood"
            },
            "content_type": "series",
            "tagline": "Behind the glitz lies the truth",
            "likes": 1250,
            "shares": 340
        },
        {
            "id": "bf0a6d14-6e46-491b-8b62-5683e728d26b",
            "title": "Severance",
            "category": "buzzing",
            "platform": "Apple TV",
            "platform_content_id": "1234567890",
            "rating": 9.2,
            "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
            "description": "A psychological thriller about work-life balance taken to extremes.",
            "release_date": "2024-02-01",
            "social_links": {
                "youtube": "https://www.youtube.com/watch?v=example2",
                "twitter": "https://twitter.com/search?q=Severance",
                "reddit": "https://www.reddit.com/r/SeveranceAppleTVPlus"
            },
            "content_type": "series",
            "tagline": "Work is life. Life is work.",
            "likes": 2100,
            "shares": 580
        },
        {
            "id": "c51d6ce2-fc47-412b-b0e5-d9d7962bc231",
            "title": "Scam 1992",
            "category": "hot_drop",
            "platform": "SonyLIV",
            "platform_content_id": "scam1992",
            "rating": 9.6,
            "thumbnail": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop",
            "description": "The story of Harshad Mehta and the biggest financial scam in India.",
            "release_date": "2024-01-20",
            "social_links": {
                "youtube": "https://www.youtube.com/watch?v=example3",
                "twitter": "https://twitter.com/search?q=Scam1992",
                "reddit": "https://www.reddit.com/r/IndianWebSeries"
            },
            "content_type": "series",
            "tagline": "Risk hai toh ishq hai",
            "likes": 3200,
            "shares": 890
        },
        {
            "id": "6cd2e1bd-5c15-4f05-8a8b-6443da9f56dc",
            "title": "The Boys",
            "category": "buzzing",
            "platform": "Prime Video",
            "platform_content_id": "theboys2024",
            "rating": 8.8,
            "thumbnail": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
            "description": "A dark take on superheroes and corporate corruption.",
            "release_date": "2024-03-01",
            "social_links": {
                "youtube": "https://www.youtube.com/watch?v=example4",
                "twitter": "https://twitter.com/search?q=TheBoys",
                "reddit": "https://www.reddit.com/r/TheBoys"
            },
            "content_type": "series",
            "tagline": "Heroes are not what they seem",
            "likes": 2800,
            "shares": 720
        },
        {
            "id": "c5be7e9e-6fbf-4ad7-a266-32ce541298c0",
            "title": "Arya 3",
            "category": "hot_drop",
            "platform": "JioHotstar",
            "platform_content_id": "arya3_2024",
            "rating": 8.1,
            "thumbnail": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
            "description": "The third installment of the popular action franchise.",
            "release_date": "2024-02-15",
            "social_links": {
                "youtube": "https://www.youtube.com/watch?v=example5",
                "twitter": "https://twitter.com/search?q=Arya3",
                "reddit": "https://www.reddit.com/r/tollywood"
            },
            "content_type": "movie",
            "tagline": "The legend continues",
            "likes": 1800,
            "shares": 450
        },
        {
            "id": "d7f8e9a0-1b2c-3d4e-5f6g-7h8i9j0k1l2m",
            "title": "Wednesday",
            "category": "series",
            "platform": "Netflix",
            "platform_content_id": "wednesday2024",
            "rating": 8.3,
            "thumbnail": "https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop",
            "description": "Wednesday Addams navigates her years as a student at Nevermore Academy.",
            "release_date": "2024-01-10",
            "social_links": {
                "youtube": "https://www.youtube.com/watch?v=example6",
                "twitter": "https://twitter.com/search?q=Wednesday",
                "reddit": "https://www.reddit.com/r/WednesdayTVShow"
            },
            "content_type": "series",
            "tagline": "Smart, sarcastic and a little dead inside",
            "likes": 2500,
            "shares": 650
        }
    ]
    
    # Insert the mock content
    await db.content.insert_many(mock_content)
    
    return {"message": "Content seeded successfully"}

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