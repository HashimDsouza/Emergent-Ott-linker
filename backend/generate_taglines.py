#!/usr/bin/env python3
"""
Generate brand-aligned taglines for all content using LLM
"""
import asyncio
import os
import sys
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

# Brand voice guidelines
BRAND_VOICE = """
You are a creative copywriter for Connector, a Gen-Z entertainment discovery app.

BRAND VOICE:
- Youthful, conversational, authentic
- FOMO-driven (creates urgency and buzz)
- Insider vibe (makes users feel in-the-know)
- Gen-Z energy (current, relevant, no old-school phrases)
- Short, punchy, memorable (max 8 words)

TONE EXAMPLES:
✅ GOOD: "Fire will reign", "Old spies never die", "The chase that defined a generation"
✅ GOOD: "Your next obsession drops here", "Everyone's losing it over this"
✅ GOOD: "Back and better than ever", "The internet can't stop talking"
❌ BAD: "Check out this amazing show", "A must-watch series", "Don't miss this"

GUIDELINES:
- Be specific and evocative, not generic
- Create intrigue and emotion
- Match the content's genre and vibe
- Avoid clichés and marketing speak
- Use present tense, active voice
- Make it feel personal and insider-y
"""

async def generate_tagline(chat, title, genre, description, rating, category):
    """Generate a single tagline using LLM"""
    
    genre_text = ", ".join(genre[:3]) if genre else "Entertainment"
    rating_text = f"{rating}/10" if rating else "N/A"
    
    prompt = f"""Generate ONE short, punchy tagline (max 8 words) for this content:

Title: {title}
Genre: {genre_text}
Category: {category}
Rating: {rating_text}
Description: {description[:200] if description else 'N/A'}

The tagline should:
1. Match the genre vibe (thriller = suspenseful, comedy = witty, drama = emotional)
2. Create FOMO and intrigue
3. Be authentic and conversational
4. Avoid generic phrases

Return ONLY the tagline, nothing else."""

    try:
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        tagline = response.strip().strip('"').strip("'")
        return tagline
    except Exception as e:
        print(f"Error generating tagline for {title}: {e}")
        return None

async def main():
    print("🎬 Connector Tagline Generator")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.connector
    
    # Initialize LLM Chat
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY not found in environment")
        sys.exit(1)
    
    chat = LlmChat(
        api_key=api_key,
        session_id="tagline-generation",
        system_message=BRAND_VOICE
    ).with_model("openai", "gpt-4o-mini")
    
    print(f"✅ Connected to MongoDB")
    print(f"✅ LLM initialized (gpt-4o-mini)")
    print()
    
    # Fetch all content
    content_list = await db.content.find({}).to_list(length=None)
    print(f"📊 Found {len(content_list)} total items")
    
    # Filter items that need taglines (including None/null)
    items_needing_taglines = [
        item for item in content_list 
        if item.get("tagline") is None or item.get("tagline") in ["", "N/A", "None"]
    ]
    
    print(f"🎯 {len(items_needing_taglines)} items need taglines")
    print()
    
    if len(items_needing_taglines) == 0:
        print("✅ All items already have taglines!")
        return
    
    # Ask for confirmation
    print("PREVIEW MODE: Generating sample taglines for first 5 items...")
    print()
    
    preview_items = items_needing_taglines[:5]
    preview_results = []
    
    for idx, item in enumerate(preview_items, 1):
        title = item.get("title", "Unknown")
        print(f"[{idx}/5] Generating tagline for: {title[:40]}...")
        
        tagline = await generate_tagline(
            chat,
            title,
            item.get("genres", []),
            item.get("description", ""),
            item.get("vote_average") or item.get("rating"),
            item.get("category", "entertainment")
        )
        
        if tagline:
            preview_results.append({
                "title": title,
                "old": item.get("tagline") or "None",
                "new": tagline
            })
            print(f"   ✨ '{tagline}'")
        else:
            print(f"   ❌ Failed to generate")
        print()
    
    # Show preview
    print("\n" + "=" * 60)
    print("PREVIEW RESULTS:")
    print("=" * 60)
    for result in preview_results:
        print(f"\n📺 {result['title']}")
        print(f"   OLD: {result['old']}")
        print(f"   NEW: {result['new']}")
    
    print("\n" + "=" * 60)
    print(f"\nReady to generate taglines for all {len(items_needing_taglines)} items.")
    
    # Check for auto-proceed flag
    auto_proceed = "--yes" in sys.argv or "-y" in sys.argv
    
    if auto_proceed:
        print("✅ Auto-proceeding (--yes flag detected)")
        confirm = "yes"
    else:
        confirm = input("Proceed with full generation? (yes/no): ").strip().lower()
    
    if confirm != "yes":
        print("❌ Cancelled. No changes made.")
        return
    
    print("\n🚀 Generating taglines for all items...")
    print("=" * 60)
    
    updated_count = 0
    failed_count = 0
    
    for idx, item in enumerate(items_needing_taglines, 1):
        title = item.get("title", "Unknown")
        print(f"[{idx}/{len(items_needing_taglines)}] {title[:40]}...", end=" ")
        
        tagline = await generate_tagline(
            chat,
            title,
            item.get("genres", []),
            item.get("description", ""),
            item.get("vote_average") or item.get("rating"),
            item.get("category", "entertainment")
        )
        
        if tagline:
            # Update in database
            await db.content.update_one(
                {"id": item["id"]},
                {"$set": {"tagline": tagline}}
            )
            print(f"✅ '{tagline}'")
            updated_count += 1
        else:
            print("❌ Failed")
            failed_count += 1
        
        # Small delay to avoid rate limits
        await asyncio.sleep(0.5)
    
    print("\n" + "=" * 60)
    print("✅ GENERATION COMPLETE!")
    print("=" * 60)
    print(f"✨ Updated: {updated_count} items")
    print(f"❌ Failed: {failed_count} items")
    print(f"🎉 Success rate: {(updated_count / len(items_needing_taglines) * 100):.1f}%")

if __name__ == "__main__":
    asyncio.run(main())
