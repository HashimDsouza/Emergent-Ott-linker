#!/usr/bin/env python3
"""
Backend API Testing for OTT Linker Content Enrichment
Tests the content enrichment functionality focusing on metadata accuracy
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://ottlinker.preview.emergentagent.com"

class ContentEnrichmentTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details
        }
        self.test_results.append(result)
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   {details}")
    
    async def test_enrich_all_content(self) -> bool:
        """Test 1: Trigger content enrichment"""
        try:
            async with self.session.post(f"{self.base_url}/api/enrich-all-content") as response:
                if response.status == 200:
                    data = await response.json()
                    enriched_count = data.get("enriched", 0)
                    total_count = data.get("total", 0)
                    
                    if enriched_count > 0:
                        self.log_test("Enrich All Content", "PASS", 
                                    f"Enriched {enriched_count}/{total_count} items")
                        return True
                    else:
                        self.log_test("Enrich All Content", "FAIL", 
                                    f"No items enriched (0/{total_count})")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Enrich All Content", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Enrich All Content", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_debug_sample(self) -> Dict:
        """Test 2: Verify sample enriched content"""
        try:
            async with self.session.get(f"{self.base_url}/api/debug/sample") as response:
                if response.status == 200:
                    data = await response.json()
                    samples = data.get("samples", [])
                    enriched_count = data.get("enriched_count", 0)
                    
                    if enriched_count > 0:
                        # Check metadata fields for first sample
                        sample = samples[0] if samples else {}
                        required_fields = ["imdb_rating", "poster_url", "tmdb_id"]
                        missing_fields = [field for field in required_fields 
                                        if not sample.get(field)]
                        
                        if not missing_fields:
                            self.log_test("Debug Sample Metadata", "PASS", 
                                        f"All required fields present in {enriched_count} samples")
                        else:
                            self.log_test("Debug Sample Metadata", "WARN", 
                                        f"Missing fields: {missing_fields}")
                        
                        return data
                    else:
                        self.log_test("Debug Sample Metadata", "FAIL", 
                                    "No enriched samples found")
                        return {}
                else:
                    error_text = await response.text()
                    self.log_test("Debug Sample Metadata", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return {}
        except Exception as e:
            self.log_test("Debug Sample Metadata", "FAIL", f"Exception: {str(e)}")
            return {}
    
    async def test_content_category(self, category: str) -> List[Dict]:
        """Test content by category (buzzing, hot_drop)"""
        try:
            async with self.session.get(f"{self.base_url}/api/content?category={category}") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    if content_list:
                        # Check for specific titles and their metadata
                        titles_found = [item.get("title") for item in content_list]
                        
                        self.log_test(f"Content Category - {category}", "PASS", 
                                    f"Found {len(content_list)} items: {', '.join(titles_found[:3])}...")
                        
                        return content_list
                    else:
                        self.log_test(f"Content Category - {category}", "FAIL", 
                                    "No content found")
                        return []
                else:
                    error_text = await response.text()
                    self.log_test(f"Content Category - {category}", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return []
        except Exception as e:
            self.log_test(f"Content Category - {category}", "FAIL", f"Exception: {str(e)}")
            return []
    
    async def test_specific_title_metadata(self, title: str, expected_data: Dict) -> bool:
        """Test specific title for correct metadata"""
        try:
            async with self.session.get(f"{self.base_url}/api/debug/item?title={title}") as response:
                if response.status == 200:
                    data = await response.json()
                    item = data.get("item", {})
                    
                    issues = []
                    
                    # CRITICAL: Check TMDB ID for Fighter movie
                    tmdb_id = item.get("tmdb_id")
                    expected_tmdb_id = expected_data.get("expected_tmdb_id")
                    if expected_tmdb_id and tmdb_id != expected_tmdb_id:
                        issues.append(f"CRITICAL: TMDB ID {tmdb_id} vs expected {expected_tmdb_id}")
                    
                    # Check IMDb rating
                    imdb_rating = item.get("imdb_rating")
                    expected_rating = expected_data.get("expected_imdb_rating")
                    if expected_rating and imdb_rating:
                        if abs(float(imdb_rating) - expected_rating) > 0.5:
                            issues.append(f"IMDb rating {imdb_rating} vs expected ~{expected_rating}")
                    elif expected_rating and not imdb_rating:
                        issues.append("Missing IMDb rating")
                    
                    # Check poster URL (should be TMDB, not unsplash)
                    poster_url = item.get("poster_url", "")
                    if "unsplash" in poster_url.lower():
                        issues.append("Using placeholder image instead of TMDB poster")
                    elif not poster_url.startswith("https://image.tmdb.org"):
                        issues.append("Poster not from TMDB")
                    
                    # Check year
                    year = item.get("year")
                    expected_year = expected_data.get("expected_year")
                    if expected_year and year != expected_year:
                        issues.append(f"Year {year} vs expected {expected_year}")
                    
                    # Check language
                    language = item.get("language")
                    expected_language = expected_data.get("expected_language")
                    if expected_language and language != expected_language:
                        issues.append(f"Language '{language}' vs expected '{expected_language}'")
                    
                    # Check description for Fighter (should mention aerial action or Hrithik Roshan)
                    if title == "Fighter":
                        description = item.get("description", "").lower()
                        if "aerial" not in description and "hrithik" not in description and "roshan" not in description:
                            issues.append("Description doesn't mention aerial action or Hrithik Roshan")
                    
                    if not issues:
                        self.log_test(f"Title Metadata - {title}", "PASS", 
                                    f"All metadata correct (TMDB ID: {tmdb_id})")
                        return True
                    else:
                        self.log_test(f"Title Metadata - {title}", "FAIL", 
                                    f"Issues: {'; '.join(issues)}")
                        return False
                        
                elif response.status == 404:
                    self.log_test(f"Title Metadata - {title}", "FAIL", 
                                f"Title not found in database")
                    return False
                else:
                    error_text = await response.text()
                    self.log_test(f"Title Metadata - {title}", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test(f"Title Metadata - {title}", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def verify_tray_content_accuracy(self, content_list: List[Dict], category: str) -> bool:
        """Verify accuracy of content in specific trays"""
        issues = []
        
        for item in content_list:
            title = item.get("title", "")
            
            # Check for specific problematic titles
            if "12th Fail" in title:
                imdb_rating = item.get("imdb_rating")
                if imdb_rating and float(imdb_rating) < 8.5:
                    issues.append(f"12th Fail has low IMDb rating: {imdb_rating} (expected ~8.7)")
            
            elif "Fighter" in title:
                # CRITICAL TEST: Check TMDB ID for Fighter
                tmdb_id = item.get("tmdb_id")
                if tmdb_id == 125702:
                    issues.append(f"CRITICAL: Fighter has wrong TMDB ID {tmdb_id} (2000 English film) - should be 784651 (2024 Hindi)")
                elif tmdb_id != 784651:
                    issues.append(f"Fighter has unexpected TMDB ID {tmdb_id} (expected 784651 for 2024 Hindi film)")
                
                language = item.get("language")
                year = item.get("year")
                if language != "Hindi":
                    issues.append(f"Fighter shows wrong language: {language} (expected Hindi)")
                if year and year != 2024:
                    issues.append(f"Fighter shows wrong year: {year} (expected 2024)")
            
            elif "Asur" in title:
                year = item.get("year")
                if year and year != 2020:
                    issues.append(f"Asur shows wrong year: {year} (expected 2020 for Indian series)")
            
            elif "Maharaja" in title:
                year = item.get("year")
                if year and year != 2024:
                    issues.append(f"Maharaja shows wrong year: {year} (expected 2024 Tamil film)")
            
            # Check poster URLs
            poster_url = item.get("poster_url") or ""
            thumbnail = item.get("thumbnail") or ""
            if "unsplash" in poster_url.lower() or "unsplash" in thumbnail.lower():
                issues.append(f"{title} using placeholder image instead of TMDB")
        
        if not issues:
            self.log_test(f"Tray Content Accuracy - {category}", "PASS", 
                        f"All {len(content_list)} items have correct metadata")
            return True
        else:
            self.log_test(f"Tray Content Accuracy - {category}", "FAIL", 
                        f"Issues found: {'; '.join(issues[:3])}...")
            return False
    
    async def test_asur_season_3_specifically(self) -> bool:
        """CRITICAL TEST: Verify Asur Season 3 has correct Indian series metadata (not Chinese film)"""
        try:
            # Get buzzing content to find Asur Season 3
            async with self.session.get(f"{self.base_url}/api/content?category=buzzing") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    asur_item = None
                    for item in content_list:
                        if "Asur Season 3" in item.get("title", ""):
                            asur_item = item
                            break
                    
                    if not asur_item:
                        self.log_test("Asur Season 3 Critical Test", "FAIL", 
                                    "Asur Season 3 not found in buzzing category")
                        return False
                    
                    # Check critical fields
                    tmdb_id = asur_item.get("tmdb_id")
                    year = asur_item.get("year")
                    language = asur_item.get("language")
                    imdb_rating = asur_item.get("imdb_rating")
                    description = asur_item.get("description", "").lower()
                    
                    issues = []
                    
                    # MOST CRITICAL: Check if it's the wrong Chinese film
                    if tmdb_id == 256744:
                        issues.append("CRITICAL FAILURE: Using Chinese film 'Dying to Survive' (TMDB ID: 256744)")
                    
                    # Check year - should be around 2020-2023 for Indian series, NOT 2025
                    if year and year == 2025:
                        issues.append(f"Wrong year: {year} (Chinese film year, expected 2020-2023 for Indian series)")
                    elif year and (year < 2020 or year > 2023):
                        issues.append(f"Unexpected year: {year} (expected 2020-2023 for Indian series)")
                    
                    # Check language - should be Hindi, NOT Japanese/Chinese
                    if language and language.lower() in ["japanese", "chinese", "mandarin"]:
                        issues.append(f"Wrong language: {language} (Chinese film language, expected Hindi)")
                    elif language and language != "Hindi":
                        issues.append(f"Unexpected language: {language} (expected Hindi for Indian series)")
                    
                    # Check IMDb rating - should be around 8.5-8.6 for Indian series
                    if imdb_rating:
                        rating_val = float(imdb_rating)
                        if rating_val < 8.0 or rating_val > 9.0:
                            issues.append(f"Unexpected IMDb rating: {imdb_rating} (expected ~8.5-8.6 for Indian series)")
                    
                    # Check description for psychological thriller keywords
                    if description and "psychological" not in description and "thriller" not in description:
                        issues.append("Description doesn't mention psychological thriller (expected for Indian Asur series)")
                    
                    if not issues:
                        self.log_test("Asur Season 3 Critical Test", "PASS", 
                                    f"✅ Correct Indian series (TMDB: {tmdb_id}, Year: {year}, Lang: {language}, IMDb: {imdb_rating})")
                        return True
                    else:
                        self.log_test("Asur Season 3 Critical Test", "FAIL", 
                                    f"❌ {'; '.join(issues)}")
                        return False
                        
                else:
                    error_text = await response.text()
                    self.log_test("Asur Season 3 Critical Test", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Asur Season 3 Critical Test", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_fighter_movie_specifically(self) -> bool:
        """CRITICAL TEST: Verify Fighter movie has correct TMDB ID (784651 not 125702)"""
        try:
            # Get hot_drop content to find Fighter
            async with self.session.get(f"{self.base_url}/api/content?category=hot_drop") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    fighter_item = None
                    for item in content_list:
                        if "Fighter" in item.get("title", ""):
                            fighter_item = item
                            break
                    
                    if not fighter_item:
                        self.log_test("Fighter Movie Critical Test", "FAIL", 
                                    "Fighter movie not found in hot_drop category")
                        return False
                    
                    # Check critical fields
                    tmdb_id = fighter_item.get("tmdb_id")
                    year = fighter_item.get("year")
                    language = fighter_item.get("language")
                    imdb_rating = fighter_item.get("imdb_rating")
                    description = fighter_item.get("description", "").lower()
                    
                    issues = []
                    
                    # MOST CRITICAL: TMDB ID check
                    if tmdb_id == 125702:
                        issues.append("CRITICAL FAILURE: Using 2000 English Fighter film (TMDB ID: 125702)")
                    elif tmdb_id != 784651:
                        issues.append(f"Wrong TMDB ID: {tmdb_id} (expected 784651 for 2024 Hindi film)")
                    
                    if year != 2024:
                        issues.append(f"Wrong year: {year} (expected 2024)")
                    
                    if language != "Hindi":
                        issues.append(f"Wrong language: {language} (expected Hindi)")
                    
                    if imdb_rating and float(imdb_rating) < 6.0:
                        issues.append(f"Suspiciously low IMDb rating: {imdb_rating} (expected ~7.4)")
                    
                    if "aerial" not in description and "hrithik" not in description:
                        issues.append("Description doesn't mention aerial action or Hrithik Roshan")
                    
                    if not issues:
                        self.log_test("Fighter Movie Critical Test", "PASS", 
                                    f"✅ Correct 2024 Hindi film (TMDB: {tmdb_id}, Year: {year}, Lang: {language})")
                        return True
                    else:
                        self.log_test("Fighter Movie Critical Test", "FAIL", 
                                    f"❌ {'; '.join(issues)}")
                        return False
                        
                else:
                    error_text = await response.text()
                    self.log_test("Fighter Movie Critical Test", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Fighter Movie Critical Test", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run comprehensive content enrichment tests"""
        print(f"🚀 Starting Content Enrichment Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Trigger enrichment
        print("\n📋 Step 1: Triggering Content Enrichment")
        enrichment_success = await self.test_enrich_all_content()
        
        # Test 2: Verify sample content
        print("\n📋 Step 2: Verifying Sample Enriched Content")
        sample_data = await self.test_debug_sample()
        
        # Test 3: Test first 2 trays
        print("\n📋 Step 3: Testing First 2 Trays")
        buzzing_content = await self.test_content_category("buzzing")
        hot_drop_content = await self.test_content_category("hot_drop")
        
        # Test 4: Verify tray content accuracy
        if buzzing_content:
            print("\n📋 Step 4a: Verifying Buzzing Now Tray Accuracy")
            await self.verify_tray_content_accuracy(buzzing_content, "buzzing")
        
        if hot_drop_content:
            print("\n📋 Step 4b: Verifying Hot Drop Alert Tray Accuracy")
            await self.verify_tray_content_accuracy(hot_drop_content, "hot_drop")
        
        # Test 5: CRITICAL Fighter Movie Test
        print("\n📋 Step 5: CRITICAL Fighter Movie Duplicate Title Test")
        await self.test_fighter_movie_specifically()
        
        # Test 6: Check specific titles
        print("\n📋 Step 6: Testing Specific Title Metadata")
        
        specific_titles = [
            {
                "title": "Fighter",
                "expected_tmdb_id": 784651,  # CRITICAL: 2024 Hindi film, NOT 125702 (2000 English)
                "expected_imdb_rating": 7.4,  # Around 7.4 for correct movie
                "expected_year": 2024,
                "expected_language": "Hindi"
            },
            {
                "title": "12th Fail",
                "expected_imdb_rating": 8.7,
                "expected_year": 2023,
                "expected_language": "Hindi"
            },
            {
                "title": "Asur",
                "expected_year": 2020,  # Indian series
                "expected_language": "Hindi"
            },
            {
                "title": "Maharaja",
                "expected_year": 2024,  # Tamil film
                "expected_language": "Tamil"
            }
        ]
        
        for title_data in specific_titles:
            await self.test_specific_title_metadata(title_data["title"], title_data)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] == "FAIL"])
        warnings = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"📊 Total: {len(self.test_results)}")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   • {result['test']}: {result['details']}")
        
        return failed == 0

async def main():
    """Main test runner"""
    async with ContentEnrichmentTester() as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n🎉 All tests passed! Content enrichment is working correctly.")
            sys.exit(0)
        else:
            print("\n💥 Some tests failed. Check the issues above.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())