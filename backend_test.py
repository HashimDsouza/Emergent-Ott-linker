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
                language = item.get("language")
                year = item.get("year")
                if language != "Hindi":
                    issues.append(f"Fighter shows wrong language: {language} (expected Hindi)")
                if year and year != 2024:
                    issues.append(f"Fighter shows wrong year: {year} (expected 2024)")
            
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
        
        # Test 5: Check specific titles
        print("\n📋 Step 5: Testing Specific Title Metadata")
        
        specific_titles = [
            {
                "title": "Fighter",
                "expected_imdb_rating": 6.5,  # Approximate expected rating
                "expected_year": 2024,
                "expected_language": "Hindi"
            },
            {
                "title": "12th Fail",
                "expected_imdb_rating": 8.7,
                "expected_year": 2023,
                "expected_language": "Hindi"
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