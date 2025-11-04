# Phase 1-4 Implementation Plan - Sports & Metadata Integration
**Date:** November 3, 2024
**Status:** 🚧 IN PROGRESS

## 🎯 OBJECTIVE
Implement backend APIs for:
1. Enhanced TMDB metadata + streaming availability
2. Cricket data (CrickData.org)
3. Football data (API-FOOTBALL direct)
4. Multi-sport supplement (TheSportsDB)

**Frontend integration deferred to later phase**

---

## 🔑 API KEYS (Already Added to .env)

```
TMDB_API_KEY=0ec85c952e2d4ee771180e3068544ddf
API_FOOTBALL_KEY=65bcc6e238d71d0b67055b29089e244f
CRICKDATA_ORG_KEY=ottlinker
THESPORTSDB_KEY=123
```

**Base URLs:**
- TMDB: `https://api.themoviedb.org/3/`
- CrickData.org: `https://api.cricapi.com/v1/`
- API-FOOTBALL: `https://v3.football.api-sports.io/`
- TheSportsDB: `https://www.thesportsdb.com/api/v1/json/`

---

## 📋 PHASE 1: Enhanced TMDB Metadata (2 hours)

### What's Being Built:

**New/Enhanced Endpoints:**
- `GET /api/content/metadata/{content_id}` - Rich metadata for a specific item
- `GET /api/content/streaming/{content_id}` - Streaming availability in India
- Enhanced enrichment in existing `/api/content/seed` and `/api/content`

**New Data Fields Added:**
- `year` - Release year
- `runtime` - Duration in minutes
- `genres` - Array of genres
- `cast` - Top 5 cast members with roles
- `crew` - Director, writer info
- `imdb_rating` - IMDB rating (from TMDB vote_average)
- `vote_count` - Number of votes
- `overview` - Plot summary
- `trailer_url` - YouTube trailer link
- `poster_url` - High-res poster
- `backdrop_url` - Backdrop image
- `streaming_platforms` - Array of platforms (India)
  - `platform_name` (Netflix, Prime, Disney+, etc.)
  - `platform_logo_url`
  - `link` (deep link if available)

**Technical Implementation:**
- Enhance existing `enrich_content_item()` function in `server.py`
- Add TMDB watch providers API call
- Store all metadata in MongoDB content collection
- Cache responses to minimize API calls

---

## 📋 PHASE 2: Cricket Integration (2 hours)

### What's Being Built:

**New Backend Endpoints:**

1. `GET /api/cricket/current-matches`
   - Returns: Live/ongoing cricket matches
   - Response: Array of matches with live scores
   ```json
   {
     "status": "success",
     "data": [
       {
         "id": "match-id",
         "name": "India vs Australia, 2nd ODI",
         "matchType": "odi",
         "status": "India won by 5 wickets",
         "venue": "Wankhede Stadium, Mumbai",
         "date": "2024-11-03",
         "teams": ["India", "Australia"],
         "score": [
           {"r": 280, "w": 8, "o": 50, "inning": "Australia Inning 1"},
           {"r": 283, "w": 5, "o": 48.3, "inning": "India Inning 1"}
         ],
         "series_id": "series-guid"
       }
     ]
   }
   ```

2. `GET /api/cricket/series`
   - Returns: All cricket series (IPL, International, etc.)
   - Params: `offset` (pagination)
   ```json
   {
     "status": "success",
     "data": [
       {
         "id": "series-guid",
         "name": "Indian Premier League 2024",
         "startDate": "Mar 22",
         "endDate": "May 26",
         "odi": 0,
         "t20": 74,
         "test": 0,
         "matches": 74
       }
     ]
   }
   ```

3. `GET /api/cricket/series/{series_id}`
   - Returns: Detailed series info with all matches
   - Heavy response (use sparingly)

4. `GET /api/cricket/match/{match_id}`
   - Returns: Detailed match info with scores
   ```json
   {
     "status": "success",
     "data": {
       "id": "match-guid",
       "name": "MI vs CSK, Final",
       "matchType": "t20",
       "status": "MI won by 6 wickets",
       "venue": "Wankhede Stadium",
       "date": "2024-05-26",
       "dateTimeGMT": "2024-05-26T14:30:00",
       "teams": ["Mumbai Indians", "Chennai Super Kings"],
       "score": [...],
       "tossWinner": "Mumbai Indians",
       "tossChoice": "field",
       "matchWinner": "Mumbai Indians"
     }
   }
   ```

5. `GET /api/cricket/fixtures`
   - Returns: Upcoming cricket fixtures
   - Filtered from all matches (no toss winner yet)

**Technical Implementation:**
- Create new router/module: `/app/backend/routers/cricket.py`
- Use `httpx` for async API calls to CrickData.org
- Implement caching (Redis or in-memory) to avoid rate limits
- Error handling for API failures
- Add to FastAPI app in `server.py`

**CrickData.org API Integration:**
- Base URL: `https://api.cricapi.com/v1/`
- Auth: `?apikey={CRICKDATA_ORG_KEY}` query param
- Key endpoints used:
  - `/currentMatches` → current-matches
  - `/series` → series list
  - `/series_info?id={id}` → series details
  - `/match_info?id={id}` → match details
  - `/matches` → all matches (filter for fixtures)

---

## 📋 PHASE 3: Football Integration (1.5 hours)

### What's Being Built:

**New Backend Endpoints:**

1. `GET /api/football/fixtures`
   - Returns: Upcoming football matches
   - Params: `league` (optional), `date` (optional)
   ```json
   {
     "status": "success",
     "data": [
       {
         "fixture_id": 12345,
         "league": "Premier League",
         "home_team": "Manchester United",
         "away_team": "Liverpool",
         "date": "2024-11-05",
         "time": "17:30:00",
         "venue": "Old Trafford",
         "status": "Not Started"
       }
     ]
   }
   ```

2. `GET /api/football/live`
   - Returns: Live football matches with scores
   ```json
   {
     "status": "success",
     "data": [
       {
         "fixture_id": 12345,
         "league": "Premier League",
         "home_team": "Arsenal",
         "away_team": "Chelsea",
         "home_score": 2,
         "away_score": 1,
         "status": "2nd Half",
         "elapsed": 67
       }
     ]
   }
   ```

3. `GET /api/football/leagues`
   - Returns: Available football leagues
   ```json
   {
     "status": "success",
     "data": [
       {"id": 39, "name": "Premier League", "country": "England"},
       {"id": 140, "name": "La Liga", "country": "Spain"},
       {"id": 169, "name": "Indian Super League", "country": "India"}
     ]
   }
   ```

4. `GET /api/football/standings/{league_id}`
   - Returns: League standings/table
   ```json
   {
     "status": "success",
     "data": [
       {
         "rank": 1,
         "team": "Manchester City",
         "points": 28,
         "played": 10,
         "won": 9,
         "draw": 1,
         "lost": 0,
         "goals_for": 28,
         "goals_against": 8
       }
     ]
   }
   ```

**Technical Implementation:**
- Create new router: `/app/backend/routers/football.py`
- API-FOOTBALL direct integration (NOT via RapidAPI)
- Base URL: `https://v3.football.api-sports.io/`
- Auth: Header `x-apisports-key: {API_FOOTBALL_KEY}`
- Implement response caching (5-10 min for fixtures, 30s for live)
- Error handling for API limits

**Key API-FOOTBALL Endpoints Used:**
- `/fixtures?live=all` → live matches
- `/fixtures?date={YYYY-MM-DD}` → fixtures by date
- `/leagues` → available leagues
- `/standings?league={id}&season={year}` → standings

**Leagues to Focus On:**
- Premier League (id: 39)
- La Liga (id: 140)
- Champions League (id: 2)
- Indian Super League (id: 169)

---

## 📋 PHASE 4: Multi-Sport Supplement (1 hour)

### What's Being Built:

**New Backend Endpoints:**

1. `GET /api/sports/f1/calendar`
   - Returns: F1 race calendar for current season
   ```json
   {
     "status": "success",
     "data": [
       {
         "round": 1,
         "race_name": "Bahrain Grand Prix",
         "circuit": "Bahrain International Circuit",
         "date": "2024-03-02",
         "time": "15:00:00"
       }
     ]
   }
   ```

2. `GET /api/sports/tennis/tournaments`
   - Returns: Upcoming tennis tournaments
   ```json
   {
     "status": "success",
     "data": [
       {
         "tournament": "Australian Open",
         "location": "Melbourne, Australia",
         "start_date": "2024-01-14",
         "end_date": "2024-01-28",
         "surface": "Hard"
       }
     ]
   }
   ```

3. `GET /api/sports/schedule`
   - Returns: Multi-sport calendar (F1, Tennis, Hockey)
   ```json
   {
     "status": "success",
     "data": {
       "f1": [...],
       "tennis": [...],
       "hockey": [...]
     }
   }
   ```

**Technical Implementation:**
- Create router: `/app/backend/routers/sports.py`
- TheSportsDB integration (FREE tier, key: "123" or "3")
- Base URL: `https://www.thesportsdb.com/api/v1/json/{key}/`
- **IMPORTANT:** Use ONLY for non-critical data (calendars, schedules)
- Cache responses for 24 hours (static data)

**TheSportsDB Endpoints Used:**
- `/eventsseason.php?id={league_id}&s={season}` → season events
- `/eventsnextleague.php?id={league_id}` → upcoming events
- For F1: league_id = 4370
- For Tennis: Various tour IDs

**⚠️ Usage Note:**
- TheSportsDB is supplement ONLY
- DO NOT use for live scores or critical features
- Good for static calendars and informational data

---

## 🗄️ Database Changes

### MongoDB Collections:

**1. Content Collection (Enhanced):**
```javascript
{
  _id: "uuid",
  title: "Stranger Things",
  // ... existing fields ...
  
  // NEW FIELDS:
  year: 2016,
  runtime: 51,
  genres: ["Drama", "Fantasy", "Horror"],
  cast: [
    {name: "Millie Bobby Brown", character: "Eleven", profile_url: "..."},
    {name: "Finn Wolfhard", character: "Mike Wheeler", profile_url: "..."}
  ],
  crew: {
    director: "The Duffer Brothers",
    writer: "The Duffer Brothers"
  },
  imdb_rating: 8.7,
  vote_count: 1234567,
  overview: "When a young boy disappears...",
  trailer_url: "https://youtube.com/watch?v=...",
  poster_url: "https://image.tmdb.org/...",
  backdrop_url: "https://image.tmdb.org/...",
  streaming_platforms: [
    {
      platform_name: "Netflix",
      platform_logo: "...",
      link: "https://netflix.com/..."
    }
  ],
  last_enriched: "2024-11-03T..."
}
```

**2. Cricket Matches Collection (NEW):**
```javascript
{
  _id: "match-guid",
  name: "India vs Australia, 2nd ODI",
  matchType: "odi",
  status: "Live",
  venue: "Wankhede Stadium, Mumbai",
  date: "2024-11-03",
  dateTimeGMT: "2024-11-03T09:30:00",
  teams: ["India", "Australia"],
  score: [...],
  series_id: "series-guid",
  tossWinner: "India",
  tossChoice: "bat",
  matchWinner: null,
  last_updated: "2024-11-03T..."
}
```

**3. Football Fixtures Collection (NEW):**
```javascript
{
  _id: "fixture-12345",
  fixture_id: 12345,
  league: "Premier League",
  league_id: 39,
  home_team: "Arsenal",
  away_team: "Chelsea",
  date: "2024-11-05",
  time: "17:30:00",
  venue: "Emirates Stadium",
  status: "Not Started",
  home_score: null,
  away_score: null,
  last_updated: "2024-11-03T..."
}
```

---

## 🧪 Testing Instructions

### Phase 1 - TMDB Metadata:
```bash
# Test enhanced metadata
curl http://localhost:3000/api/content

# Should see new fields: year, runtime, genres, cast, streaming_platforms
```

### Phase 2 - Cricket:
```bash
# Current matches
curl http://localhost:3000/api/cricket/current-matches

# Series list
curl http://localhost:3000/api/cricket/series

# Match details
curl http://localhost:3000/api/cricket/match/{match-id}
```

### Phase 3 - Football:
```bash
# Live matches
curl http://localhost:3000/api/football/live

# Fixtures
curl http://localhost:3000/api/football/fixtures

# Standings
curl http://localhost:3000/api/football/standings/39
```

### Phase 4 - Multi-Sport:
```bash
# F1 calendar
curl http://localhost:3000/api/sports/f1/calendar

# Tennis tournaments
curl http://localhost:3000/api/sports/tennis/tournaments
```

---

## ⚠️ Known Limitations & Notes

1. **CrickData.org:** Free tier has rate limits (check daily limits)
2. **API-FOOTBALL:** Monthly request limits based on plan
3. **TheSportsDB:** Community data, may have delays (use ONLY for supplements)
4. **TMDB:** 40 requests/10 seconds rate limit

---

## 📝 Files Modified

**Backend:**
- `/app/backend/.env` - Added API keys ✅
- `/app/backend/server.py` - Enhanced TMDB enrichment
- `/app/backend/routers/cricket.py` - NEW
- `/app/backend/routers/football.py` - NEW
- `/app/backend/routers/sports.py` - NEW
- `/app/backend/requirements.txt` - Added httpx if needed

**Frontend:**
- No changes in Phase 1-4
- Frontend integration deferred to later

---

## 🚀 Next Steps (After Phases 1-4)

**Phase 5 (Later):**
- Create "Game On" page UI
- Add sports trays to landing page
- Implement fixtures calendar widget
- Add streaming badges to content cards

**Phase 6 (When Roanuz arrives):**
- Replace CrickData.org with Roanuz Cricket API
- Implement per-match live score purchasing logic
- Enhanced cricket features

---

## 📞 Support & Issues

If implementation hits any issues:
1. Check backend logs: `tail -n 100 /var/log/supervisor/backend.err.log`
2. Verify API keys are correct in `.env`
3. Check API rate limits (TMDB, CrickData, API-FOOTBALL)
4. Verify MongoDB is running: `sudo supervisorctl status`

---

**Implementation Status:** 🚧 IN PROGRESS
**Expected Completion:** 4-5 hours from start
**Started:** [Will be logged when work begins]
**Completed:** [Will be logged when work completes]
