# Data Quality Audit & Cleanup Report
## Connector Application Database

**Date:** November 17, 2025  
**Total Entries:** 198

---

## 📊 Key Findings

### 1. Empty Release Dates (105 entries / 53%)
**Root Cause:** The original catalog (164 entries) was imported WITHOUT the `release_date` field. They only have a `year` field.

- **Original Catalog (164 entries):** No `freshness_batch` field, imported before Nov25
- **Nov25 Batch (34 entries):** Has `freshness_batch = "nov25"`, most have release_date
- **Result:** 105 entries lack `release_date` because it wasn't part of the original schema

### 2. Mock/Test Entries Identified (3 CONFIRMED)

#### ❌ CONFIRMED MOCKS TO DELETE:

1. **"Wednesday" (2019)** - Netflix
   - ID: `3f17128d-7e68-4a1c-a84e-9e1e8691c571`
   - Issues: Zero rating, No IMDb ID, No poster URL
   - Category: buzzing

2. **"Agent 5: A Night in the Last Life of" (2008)** - Netflix
   - ID: `97f97106-9e81-49fc-8e78-0ac8b2e53c46`
   - Issues: Zero rating, No IMDb ID, No poster URL
   - Category: buzzing

3. **"Mirzapur: The Film" (2026)** - Netflix
   - ID: `d45ae8af-bae4-45f0-9f58-370cffefdba2`
   - Issues: Future year, Zero rating, No IMDb ID, No poster URL
   - Category: buzzing

### 3. Suspicious "Buzzing" Category Entries (10 entries)

These entries are missing IMDb IDs and `release_date` fields. They appear to be manually added:

- Squid Game: Making Season 2
- Money Heist: The Phenomenon
- El Camino: A Breaking Bad Movie
- Peaky Blinders: The True Story
- The Cobra Kai Movie
- Pushpa 2 - The Rule
- Asura
- *(includes the 3 confirmed mocks above)*

**Pattern:** All are Netflix/Prime Video "buzzing" category entries with TMDB IDs but missing IMDb IDs and proper metadata.

### 4. Other Data Quality Issues

- **Missing Poster URLs:** 16 entries (mostly sports events and documentaries)
- **Missing Both IDs:** 5 entries (sports events without TMDB/IMDb data)
- **Zero Ratings:** 9 entries (overlap with mock entries)

---

## 🎯 Recommended Actions

### Option A: Conservative Cleanup (RECOMMENDED)
1. ✅ **Delete 3 confirmed mock entries**
2. ✅ **Keep the remaining 195 entries as-is**
3. ✅ **Auto-populate missing `release_date` from `year` field** (e.g., `2023` → `2023-01`)
4. ✅ **Mark suspicious buzzing entries for future validation**

### Option B: Aggressive Cleanup
1. ✅ **Delete 3 confirmed mock entries**
2. ✅ **Delete all 10 buzzing entries without release_date** (reduces to 188 total)
3. ✅ **Auto-populate missing `release_date` for remaining entries**

### Option C: Fresh Start (MOST ACCURATE)
1. ✅ **Keep ONLY entries with:**
   - Valid IMDb ID OR TMDB ID
   - Non-zero ratings
   - Poster URL
   - Proper metadata
2. ❌ **Remove all entries without proper external validation**
3. ✅ **Result: ~180-185 high-quality entries**

---

## 💡 Why This Happened

### Original Catalog Import
The initial 164 titles were likely imported from a spreadsheet or manual entry that:
- Had only basic fields: `title`, `year`, `platform`, `category`, `genres`
- Did NOT include `release_date` field
- Had mixed data quality (some with IMDb/TMDB, some without)

### Nov25 Ingestion
The new ingestion script (`ingest_excel_catalog.py`) was built with:
- Proper enrichment from TMDB/OMDb APIs
- `release_date` field generation
- Better validation
- Result: 34/60 titles ingested with complete metadata

### Manual Additions
Some "buzzing" category entries appear to be manually added test data without proper validation.

---

## 🔄 Next Steps

Once you choose your cleanup approach, I can:
1. Execute the deletion of mock entries
2. Auto-populate missing release dates
3. Generate a clean, validated catalog
4. Export the final dataset for your review
5. Set up validation rules to prevent future low-quality entries

**Your decision:** Which cleanup option do you prefer (A, B, or C)?
