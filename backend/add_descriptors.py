import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Fun, smart, conversational descriptors with wit - Connector brand voice
descriptors = {
    # Sports
    "UEFA Champions League": "Where legends are made and your sleep schedule dies",
    "Pro Kabaddi League 2025": "India's most intense contact sport. No, not family dinners",
    "ISL 2025": "Indian football's finest. Goals, drama, and questionable referee calls",
    
    # Indian Content
    "Kurukshetra": "Epic battles, family drama. Basically your WhatsApp group",
    "The Family Man Season 3": "Saving the nation between PTA meetings since 2019",
    "12th Fail": "The comeback story that'll make you believe in second chances",
    "Asur Season 2": "Mythology meets murder. Your therapist will hear about this",
    "Panchayat Season 3": "Small village, big dreams, maximum relatability",
    "Mirzapur Season 3": "Where 'family business' has a whole different meaning",
    "Patal Lok 2": "Dark, gritty, and criminally binge-worthy",
    "Sacred Games": "Mumbai's underbelly served with existential dread",
    "Delhi Crime": "Based on true events that'll keep you up at night",
    "Made in Heaven": "Big fat Indian weddings with bigger scandals",
    "Scam 1992": "The mother of all scams. Harshad Mehta's wild ride",
    
    # International Series
    "Succession": "Rich people fighting. Like reality TV but with HBO budget",
    "Severance Season 2": "Work-life balance taken to a dystopian extreme",
    "The Mandalorian": "Space Western with a cute green baby. Need we say more?",
    "Stranger Things – Season 5": "80s nostalgia meets interdimensional terror",
    "The Witcher – Season 4": "Monster hunter, destiny, and extremely confusing timelines",
    "House of the Dragon": "Dragons, thrones, and questionable family dynamics",
    "The Last of Us": "Zombie apocalypse that'll wreck you emotionally",
    "Wednesday": "Addams Family's goth queen solves murders at boarding school",
    "The Crown": "Royal family drama. Better than your group chat",
    "Breaking Bad": "High school chemistry gone spectacularly wrong",
    "Game of Thrones": "Winter came. So did the memes",
    "Squid Game": "Childhood games with adult consequences",
    "Money Heist": "The most elaborate bank job in TV history",
    "Peaky Blinders": "British gangsters with impeccable style",
    "The Boys": "What if superheroes were actually terrible people?",
    "Westworld": "Cowboys, robots, and existential crises",
    
    # Movies
    "The Dark Knight": "Heath Ledger's Joker. That's the tweet",
    "Dune Part 2": "Desert planet politics meets giant sandworms",
    "Inception": "Dreams within dreams. Good luck explaining this to parents",
    "The Shawshank Redemption": "Hope, friendship, and the world's longest escape plan",
    "Interstellar": "Love transcends dimensions. Also, science",
    "Parasite": "Class warfare disguised as a thriller masterpiece",
    "Avengers Endgame": "Marvel's grand finale. Bring tissues",
    "Joker": "Origin story that's disturbingly relatable",
    "The Batman": "Emo Bruce Wayne solves riddles in the rain",
    "Everything Everywhere All at Once": "Multiverse madness that won all the Oscars",
    "Top Gun Maverick": "Tom Cruise still got it. That's the movie",
    "Oppenheimer": "How to build a bomb and existential dread in 3 hours",
    "Barbie": "Existential crisis in plastic perfection",
    "Jawan": "SRK double role. Action. Patriotism. Chef's kiss",
    "Pathaan": "SRK kicks butt across continents",
    "Dunki": "Immigration drama that'll hit you in the feels",
    "Animal": "Toxic masculinity: The Movie (but make it a blockbuster)",
    "Pushpa 2 - The Rule": "Allu Arjun's swag returns. Theaters will explode",
    "Kantara": "Folklore meets action in Karnataka's forests",
    "RRR": "Bromance + action + impossible physics = Oscar glory",
    "KGF Chapter 2": "Yash goes full beast mode",
    "Baahubali": "Why did Kattappa kill Baahubali? Still legendary",
    
    # New 2025 Titles
    "Pluribus": "Future looks wild. This show proves it",
    "Madharaasi": "Tamil thriller that'll keep you guessing",
    "Superboys Of Malegaon": "Making movies with zero budget, infinite heart",
    "The B****Ds of Bollywood": "Behind the scenes chaos you didn't see coming",
    "Mobland": "Underworld politics meets corporate drama",
    "Adolescence": "Growing up is messy. This captures it perfectly",
    
    # Sports Events
    "IPL 2025": "Cricket's biggest party returns. RCB fans still hoping",
    "T20 World Cup 2025": "Nations collide. Emotions run high. Memes guaranteed",
    "FIFA World Cup": "The beautiful game at its most intense",
    "Wimbledon": "Tennis with strawberries and Royal Box drama",
    "Formula 1": "Fast cars, faster drama, slowest pit stops",
    "NBA Finals": "Basketball's ultimate showdown",
    "Premier League": "Where dreams and relegation fears collide",
}

async def add_descriptors():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client.connector
    
    # Get all content
    content = await db.content.find({}, {"_id": 0, "id": 1, "title": 1, "descriptor": 1}).to_list(None)
    print(f"Total content items: {len(content)}")
    
    updated = 0
    for item in content:
        title = item['title']
        
        # Find matching descriptor
        descriptor = None
        for key, value in descriptors.items():
            if key.lower() in title.lower() or title.lower() in key.lower():
                descriptor = value
                break
        
        # If no match, create a generic witty one based on category
        if not descriptor:
            descriptor = "Trust us, this one's worth your time"
        
        # Update in database
        result = await db.content.update_one(
            {"id": item['id']},
            {"$set": {"descriptor": descriptor}}
        )
        
        if result.modified_count > 0:
            updated += 1
            print(f"✓ {title}: {descriptor}")
    
    print(f"\n✅ Updated {updated} content items with descriptors")
    
    # Show sample
    sample = await db.content.find_one({"title": {"$regex": "Family Man", "$options": "i"}}, {"_id": 0, "title": 1, "descriptor": 1})
    if sample:
        print(f"\nSample: {sample['title']}")
        print(f"Descriptor: {sample['descriptor']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_descriptors())
