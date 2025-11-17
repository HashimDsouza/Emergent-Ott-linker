# 🎯 CONNECTOR - CONTENT INGESTION STRATEGY

**Date:** November 13, 2025  
**Status:** Planning Phase  
**Decision:** Hybrid Approach (TMDB Automated + Manual Curation)

---

## ✅ Database Cleanup Complete (Nov 17, 2025)

**Status:** Completed  
**Method:** Option C - Aggressive Quality Validation  
**Result:** 176 validated entries (from 198 original)

### What Was Done:
- ✅ Deleted 22 low-quality/mock entries
- ✅ Auto-populated 92 missing release_date fields
- ✅ All entries now have IMDb or TMDB ID (100%)
- ✅ All entries have non-zero ratings (100%)
- ✅ All entries have poster URLs (100%)
- ✅ All entries have release dates (100%)

**Quality Standards Enforced:**
Going forward, ALL new entries MUST have:
- Valid IMDb ID OR TMDB ID
- Non-zero rating
- Valid poster URL
- Release date (YYYY-MM format)
- No future years beyond current year + 1

---

## CONTEXT: The Search & Catalogue Challenge

**Goal:** Daily updated, complete catalogue listing of key OTT platforms to enable:
- Accurate search
- Deep linking
- Personalized recommendations
- Complete content discovery

**Constraint:** Platform partnerships not viable until significant traction (100K+ users)

---

## STRATEGIC DECISION: THREE-PHASE APPROACH

### Phase 1: MVP Foundation (Months 1-6)
- **Primary:** TMDB API (free tier)
- **Secondary:** OMDb API (IMDb ratings)
- **Manual:** Curated Indian exclusives
- **Cost:** $0-50/month
- **Coverage:** 80-85%
- **Effort:** 3 hours/month manual work

### Phase 2: Optimization (Months 6-12)
- **Upgrade:** Add JustWatch API
- **Cost:** $500-800/month
- **Coverage:** 90-92%
- **Effort:** 2 hours/month manual work

### Phase 3: Scale (Year 2+)
- **Enterprise:** Direct APIs or partnerships
- **Cost:** $2000+/month
- **Coverage:** 95%+
- **Effort:** Fully automated

---

## WHY TMDB FOR PHASE 1

### What TMDB Provides:
- Largest community-driven entertainment database
- "Watch Providers" API for streaming availability
- Covers 100+ services including Indian platforms
- Rich metadata: posters, cast, crew, ratings, trailers
- Daily community updates (new releases within hours)
- Used by successful apps: Letterboxd, Trakt, etc.

### Coverage Reality (India):
- ✅ Netflix: ~95% coverage
- ✅ Prime Video: ~90% coverage
- ✅ Disney+: ~95% coverage
- ✅ Apple TV+: ~90% coverage
- ⚠️ JioHotstar: ~60-70% (Indian content gaps)
- ⚠️ SonyLIV: ~50-60% (regional content gaps)
- ⚠️ Zee5: ~40-50% (needs manual supplement)

### Cost Structure:
- **Free tier:** 50 requests/second (sufficient for MVP to 5-10K users)
- **Commercial:** $150-300/month when scaling
- **Update lag:** 24-48 hours (industry standard)

### Why Not Other Options:

**Web Scraping:**
- ❌ Legal risk (ToS violations)
- ❌ Fragile (breaks on site updates)
- ❌ Gets blocked (IP bans, CAPTCHAs)
- ❌ Not scalable
- **Verdict:** Too risky for startup

**Catalogue Dumps:**
- ❌ Usually illegal/pirated
- ❌ Outdated, no daily updates
- ❌ Unreliable
- **Verdict:** Avoid completely

**In-house Data Team:**
- ❌ Expensive ($5-10K/month)
- ❌ Slow to build
- ❌ Not scalable
- **Verdict:** Only for Series B+ companies

---

## THE HYBRID APPROACH: 80-85% AUTOMATED + 10-15% MANUAL

### Automated Pipeline (80-85%)

**Daily Sync Process (Runs 3 AM IST):**

```
1. DISCOVER NEW CONTENT (TMDB API)
   - Fetch movies released in last 7 days
   - Fetch TV shows with new episodes/seasons
   - Filter for India region
   - ~100-200 entries/day discovered

2. CHECK STREAMING AVAILABILITY
   - Use TMDB "Watch Providers" API
   - Filter for Indian platforms:
     • Netflix (ID: 8)
     • Prime Video (ID: 119)
     • Disney+ Hotstar (ID: 122)
     • Apple TV+ (ID: 350)
     • SonyLIV (ID: 237)
     • Zee5 (ID: 232)
   - ~40-60 titles available on tracked platforms

3. ENRICH METADATA
   - TMDB: poster, backdrop, cast, crew, description
   - OMDb: IMDb rating, votes
   - YouTube: trailer links
   - Full metadata package compiled

4. QUALITY CHECK
   - Validate: poster? rating? description?
   - Filter: relevant? (no adult, no duplicates)
   - Categorize: type, genre, new/catalog
   - ~30-40 quality titles/day retained

5. AUTO-INGEST
   - Check duplicates (TMDB ID + season)
   - Insert with proper schema
   - Update existing if metadata improved
   - Generate daily report

6. ALERT ON GAPS
   - Major release but no streaming info → alert
   - Indian original detected → flag for manual review
   - Daily summary email
```

**Expected Output:**
- 30-40 titles auto-ingested daily
- 900-1200 titles per month
- Covers: Hollywood, Netflix originals, major OTT releases
- Misses: Some JioHotstar/SonyLIV exclusives, regional films

---

### Manual Curation Pipeline (10-15%)

**Monthly Process (2-3 hours):**

1. **Review Flagged Items**
   - System flags 20-40 titles it can't auto-ingest
   - Indian originals, regional content
   - Review for relevance

2. **Add High-Priority Exclusives**
   - JioHotstar originals (Mirzapur, etc.)
   - Tamil/Telugu blockbusters not on TMDB yet
   - Reality shows (Bigg Boss, Indian Idol seasons)
   - Sports documentaries

3. **Use Standardized Template**
   - Fill Excel with 20-50 titles
   - Upload via admin panel
   - Preview → Approve → Ingest
   - 30 minutes process time

**Expected Output:**
- 30-50 titles manually added per month
- Fills the gaps in automated coverage
- Ensures high-priority Indian content included

---

## STANDARDIZED MANUAL INGESTION SYSTEM

### Problem Identified:
Nov25 ingestion (60 titles → 34 ingested) took multiple iterations due to:
- No standard input format
- Schema mismatches discovered late
- Manual script adjustments needed
- 3-4 back-and-forth rounds
- Time wasted: 2-3 hours

### Solution: Streamlined System

#### A. Standard Excel Template

**Required Columns:**
```
A. Title              | Example: "Indian Idol Season 17"
B. Platform           | Dropdown: Netflix, JioHotstar, Prime Video, Apple TV, SonyLIV, Zee5
C. Type               | Dropdown: Movie, Series
D. Release Date       | Format: DD-MMM-YY (e.g., "15-Jan-26") or leave blank
E. Season Number      | Only for series (e.g., 2, 17) or leave blank for movies
F. TMDB ID            | Optional - if known
G. Notes              | Optional - special handling needed
```

**Example Rows:**
```
Title                    | Platform    | Type   | Release Date | Season | TMDB ID | Notes
Indian Idol Season 17    | SonyLIV     | Series | 15-Jan-26   | 17     |         |
Mirzapur The Film        | Prime Video | Movie  | 20-Feb-26   |        |         | Big release
Bigg Boss Season 10      | JioHotstar  | Series | 01-Mar-26   | 10     |         |
```

**Why This Works:**
- Simple, anyone can fill
- Dropdowns prevent typos
- Standardized date format
- Optional fields for flexibility
- Clear examples provided

---

#### B. Admin Web Panel

**User Flow:**
```
1. Upload Excel → Drag & drop or file select
2. System Parses → Instant validation
3. Preview Results → See what will be created
4. Fix Issues → Clear error messages if any
5. Click "Ingest" → One button
6. Get Report → Success/failure summary
```

**Time: 2-5 minutes for 50-100 titles**

---

#### C. Improved Ingestion Script Features

**Smart Validation:**
- Auto-detect format issues before processing
- "Row 5: 'Plaform' should be 'Platform' (typo detected)"
- "Row 12: Can't find TMDB match for 'XYZ Show' - provide TMDB ID or skip"
- "Row 23: Date format invalid '15/1/26' - use DD-MMM-YY format"

**Fuzzy Title Matching:**
- "Indian Idol S17" → automatically finds "Indian Idol"
- Handles typos and variations
- Multiple match candidates shown for selection

**Smart Season Detection:**
- Recognizes: "S17", "Season 17", "17" all work
- Auto-parses from title if column blank

**Preview Mode:**
- Shows exactly what will be created
- Full metadata preview
- You approve before insertion

**Error Handling:**
- Clear, actionable error messages
- Row-by-row issue identification
- Suggestions for fixes

**Schema Guarantee:**
- Validates against DB schema BEFORE insertion
- Won't break existing data
- Rollback capability if batch fails

---

#### D. Workflow Comparison

**OLD PROCESS (Nov25 Experience):**
```
You: Here's 60 titles in Excel
Me: Let me build parser... issues found... back to you
You: Fixed some, here's v2
Me: Running... schema mismatch... fixing code...
You: Try this version
Me: Better, but 19 titles failed TMDB matching...
[3-4 iterations over 2-3 hours]
Result: 34 titles ingested
```

**NEW PROCESS:**
```
You: [Upload Excel]
System: Found 3 issues:
  • Row 5: Invalid platform "Hotstar" → use "JioHotstar"
  • Row 12: No TMDB match for "Random Show" → add TMDB ID
  • Row 23: Date format "15/1/26" → use "15-Jan-26"
You: [Fix 3 rows, re-upload]
System: ✅ 60 titles ready
  • 45 with full metadata
  • 15 with partial (will use fallbacks)
You: [Click "Ingest"]
System: ✅ Done! 58 added, 2 skipped (duplicates)
[Total: 5 minutes]
```

---

## COMPLETE SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│              CONTENT INGESTION SYSTEM                    │
└──────────────────────────────────────────────────────────┘

┌─────── AUTOMATED PIPELINE (80-85%) ──────────────────────┐
│                                                           │
│  TMDB API ──┐                                            │
│             ├─→ Daily Sync Script (3 AM) ─→ Database    │
│  OMDb API ──┘          ↓                                 │
│                   Slack/Email Alert                       │
│              (Daily summary to you)                       │
│                                                           │
│  Output: 30-40 titles/day = 900-1200/month              │
└───────────────────────────────────────────────────────────┘

┌─────── MANUAL PIPELINE (10-15%) ─────────────────────────┐
│                                                           │
│  You/Team → Excel Upload → Admin Panel ──┐              │
│                                           │               │
│              ┌────────────────────────────┘               │
│              ↓                                            │
│         Validation → Preview → Approve → Ingest → DB    │
│              ↓                                            │
│         Error Report                                      │
│    (Fix & re-upload if issues)                           │
│                                                           │
│  Output: 30-50 titles/month                              │
└───────────────────────────────────────────────────────────┘

┌─────── USER-CONTRIBUTED (5%) ────────────────────────────┐
│                                                           │
│  Users → "Suggest Content" → Approval Queue             │
│                                   ↓                       │
│                              You Review                   │
│                                   ↓                       │
│                          Approve → Database               │
│                                                           │
│  Output: 10-20 titles/month                              │
└───────────────────────────────────────────────────────────┘

TOTAL OUTPUT: 950-1270 new titles per month
```

---

## IMPLEMENTATION PLAN

### Immediate Next Steps:

**1. Standardized Excel Template**
   - Create downloadable template
   - Add instructions and examples
   - Test with sample data

**2. Ingestion Script v2.0**
   - Parse standard template
   - Robust validation
   - Preview mode
   - Better error messages
   - Schema compliance guarantee

**3. Admin Web Panel**
   - Simple drag-drop upload
   - Instant validation feedback
   - Preview before ingest
   - One-click ingestion
   - Success/error reporting

**Timeline:** 1-2 sessions to build and test

---

### Phase 2 (After Manual System Proven):

**4. Daily Automated Sync**
   - Cron job at 3 AM IST
   - TMDB → OMDb → Database
   - Email daily report
   - Flag items for manual review

**5. Monitoring Dashboard**
   - View auto-ingested content
   - Review flagged items
   - Monthly statistics
   - System health metrics

**Timeline:** 1-2 sessions to build and test

---

## COST & EFFORT BREAKDOWN

### Setup (One-Time):
- Admin panel: 4-6 hours dev
- Ingestion script v2.0: 6-8 hours dev
- Automated sync setup: 6-8 hours dev
- Testing & docs: 2-3 hours
- **Total:** 18-25 hours dev work

### Ongoing (Monthly):
**From You:**
- Review flagged items: 1 hour
- Manual curation: 2 hours
- System monitoring: 30 mins
- **Total:** 3-4 hours/month

**Automated:**
- Daily sync: Runs itself (0 hours)
- System maintenance: Minimal

### Costs:
**Immediate (Phase 1):**
- TMDB API: $0 (free tier)
- OMDb API: $0 (free tier)
- Server: Existing infrastructure
- **Total:** $0/month

**Phase 2 (Months 6-12):**
- JustWatch API: $500-800/month
- TMDB commercial: $150-300/month
- **Total:** $650-1100/month

**Phase 3 (Year 2+):**
- Enterprise data providers: $2000+/month
- Or platform partnerships: Variable

---

## SUCCESS METRICS

### Coverage Targets:
- **Month 1:** 70-80% (TMDB only)
- **Month 3:** 80-85% (TMDB + manual)
- **Month 6:** 85-90% (optimized pipeline)
- **Month 12:** 90-92% (with JustWatch)

### Quality Targets:
- 95%+ titles have posters
- 90%+ titles have ratings
- 85%+ titles have cast info
- 100% titles have descriptions

### Operational Targets:
- Manual ingestion: <30 mins per batch
- Automated sync: 99%+ uptime
- Data freshness: <48 hours lag
- Error rate: <5% of auto-ingested titles

---

## RISK MITIGATION

### Risk 1: TMDB Coverage Gaps
**Mitigation:** 
- Manual curation pipeline
- User-contributed content system
- Monitor gaps, adjust monthly

### Risk 2: API Rate Limits
**Mitigation:**
- Respect rate limits (50 req/sec)
- Implement retry logic
- Cache aggressively
- Upgrade to commercial if needed

### Risk 3: Data Quality Issues
**Mitigation:**
- Multi-source validation (TMDB + OMDb)
- Quality checks in pipeline
- Manual review of flagged items
- User feedback mechanism

### Risk 4: Platform Changes
**Mitigation:**
- Monitor TMDB provider IDs
- Alert on sudden coverage drops
- Flexible architecture to add new sources

---

## DECISION LOG

**Date:** November 13, 2025

**Decisions Made:**
1. ✅ Use TMDB as primary data source (Phase 1)
2. ✅ Hybrid approach: 80-85% automated + 10-15% manual
3. ✅ Build standardized manual ingestion system
4. ✅ Defer JustWatch to Phase 2 (month 6-12)
5. ✅ No web scraping (legal/technical risks)

**Rationale:**
- TMDB proven, cost-effective for MVP
- Manual curation fills critical gaps
- Standardized process prevents Nov25 pain points
- Scalable architecture for future growth

**Approval Status:** Pending confirmation on:
- [ ] Excel template format
- [ ] Admin panel approach
- [ ] Build automated sync now or later?
- [ ] Any additional fields needed?

---

## NEXT SESSION AGENDA

1. Confirm template format
2. Build ingestion script v2.0
3. Create admin panel
4. Test with sample data
5. Document user guide

---

**This document serves as the source of truth for content ingestion strategy and will be updated as we implement and learn.**
