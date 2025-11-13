# ✅ Ingestion Script Schema Fix Complete

## Summary
Successfully updated `ingest_excel_catalog.py` to match the canonical JSON schema exactly.

## Key Changes Made

### 1. Platform Field
- **Before:** `platforms`: array (e.g., `["netflix"]`)
- **After:** `platform`: string (e.g., `"Netflix"`)

### 2. Cast Structure
- **Before:** `cast`: array of strings (e.g., `["Jennifer Aniston", "Reese Witherspoon"]`)
- **After:** `cast`: array of objects with full structure:
```json
[
  {
    "name": "Jennifer Aniston",
    "character": "Alex Levy",
    "profile_url": "https://image.tmdb.org/t/p/w185/..."
  }
]
```

### 3. Crew Structure
- **Added:** `crew`: object with directors and writers
```json
{
  "directors": ["Director Name"],
  "writers": ["Writer Name"]
}
```

### 4. New Required Fields Added
- `id`: UUID generated for each document
- `category`: Set to "hero"
- `content_type`: "series" or "movie" (renamed from `type`)
- `normalized_title`: Canonical title
- `thumbnail`: Poster URL
- `tagline`: "Season N" for new seasons
- `social_links`: {youtube, twitter, reddit}
- `likes`: 0
- `shares`: 0
- `streaming_platforms`: Array of platform objects
- `providers_in`: Array of platform names
- `rating_source`: "imdb" or "tmdb"
- `imdb_votes`: Vote count from OMDb
- `vote_average`: TMDB rating
- `vote_count`: TMDB vote count
- `language`: Primary language from OMDb
- `runtime`: Runtime in minutes
- `last_enriched`: ISO timestamp
- `poster_path`, `backdrop_path`: TMDB image URLs
- `platform_content_id`, `watchmode_id`, `trailer_url`: null placeholders

### 5. Season-Aware Fields (Preserved)
- `series_title`: Mirrors title for series
- `display_title`: "Series Name – Season N" for S2+
- `is_new_season`: true for S2+
- `season_year`: Year of season release
- `season_release_date`: ISO date
- `freshness_batch`: "nov25"

## Validation Results

### Dry-Run Summary:
- **Total titles processed:** 61
- **TMDB matches found:** 42 (69%)
- **IMDb ratings found:** 22
- **High confidence matches:** 15

### Sample Generated Document (The Morning Show S4):
```json
{
  "id": "253c3f2d-57b9-44e5-acc4-bc943b836d2f",
  "title": "The Morning Show",
  "series_title": "The Morning Show",
  "display_title": "The Morning Show – Season 4",
  "category": "hero",
  "platform": "Apple TV+",
  "content_type": "series",
  "rating": 8.1,
  "rating_source": "imdb",
  "cast": [
    {
      "name": "Jennifer Aniston",
      "character": "Alex Levy",
      "profile_url": "https://image.tmdb.org/t/p/w185/..."
    }
  ],
  "crew": {
    "directors": [],
    "writers": []
  },
  "is_new_season": true,
  "season_year": 2025,
  "social_links": {...},
  "streaming_platforms": [...]
}
```

### Schema Compliance Check: ✅
- ✓ `platform` is string (not array)
- ✓ `cast` is array of objects with name/character/profile_url
- ✓ `crew` has directors and writers
- ✓ All required fields present
- ✓ Proper data types
- ✓ Season-aware logic working

## Next Steps

**Ready for Production Run:**
```bash
cd /app/backend && python ingest_excel_catalog.py \
  --file /app/Nov25_Releases_AK.xlsx \
  --batch-name nov25 \
  --default-year 2025
```

This will:
1. Process all 61 titles
2. Insert ~42 titles with TMDB matches
3. Skip duplicates based on tmdb_id + season
4. Generate QA report at `/app/qa_report_nov25.csv`

**Awaiting your approval to proceed.**
