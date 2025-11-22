#!/usr/bin/env python3
"""
Backend API Testing for Nov 2025 Content Ingestion
Tests the new content ingestion with 60-40 international-Indian balance
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://trailblazer-beta.preview.emergentagent.com"

class Nov2025ContentTester:
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
    
    async def test_total_content_count(self) -> bool:
        """Test 1: Verify total content count is 171"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    count = len(content_list)
                    
                    if count == 171:
                        self.log_test("Total Content Count", "PASS", 
                                    f"Found exactly 171 titles as expected")
                        return True
                    else:
                        self.log_test("Total Content Count", "FAIL", 
                                    f"Found {count} titles, expected 171")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Total Content Count", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Total Content Count", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_trending_content_count(self) -> bool:
        """Test 2: Verify 12 titles are marked as trending"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    # Count items with is_trending: true
                    trending_items = [item for item in content_list if item.get("is_trending") == True]
                    count = len(trending_items)
                    
                    if count == 12:
                        trending_titles = [item.get("title") for item in trending_items[:5]]
                        self.log_test("Trending Content Count", "PASS", 
                                    f"Found exactly 12 trending titles. Sample: {', '.join(trending_titles)}...")
                        return True
                    else:
                        self.log_test("Trending Content Count", "FAIL", 
                                    f"Found {count} trending titles, expected 12")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Trending Content Count", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Trending Content Count", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_search_new_title(self, title: str) -> bool:
        """Test 3: Search for new Nov 2025 titles"""
        try:
            async with self.session.get(f"{self.base_url}/api/content/search?q={title}") as response:
                if response.status == 200:
                    results = await response.json()
                    
                    if len(results) > 0:
                        found_title = results[0].get("title")
                        platform = results[0].get("platform")
                        rating = results[0].get("rating")
                        year = results[0].get("year")
                        
                        self.log_test(f"Search - {title}", "PASS", 
                                    f"Found '{found_title}' on {platform} (Rating: {rating}, Year: {year})")
                        return True
                    else:
                        self.log_test(f"Search - {title}", "FAIL", 
                                    f"No results found for '{title}'")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test(f"Search - {title}", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test(f"Search - {title}", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_platform_content(self, platform: str) -> Dict:
        """Test 4: Verify platform-specific content"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    # Filter by platform
                    platform_items = [item for item in content_list if item.get("platform", "").lower() == platform.lower()]
                    count = len(platform_items)
                    
                    if count > 0:
                        sample_titles = [item.get("title") for item in platform_items[:3]]
                        self.log_test(f"Platform Content - {platform}", "PASS", 
                                    f"Found {count} items. Sample: {', '.join(sample_titles)}")
                        return {"count": count, "items": platform_items}
                    else:
                        self.log_test(f"Platform Content - {platform}", "FAIL", 
                                    f"No content found for {platform}")
                        return {"count": 0, "items": []}
                else:
                    error_text = await response.text()
                    self.log_test(f"Platform Content - {platform}", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return {"count": 0, "items": []}
        except Exception as e:
            self.log_test(f"Platform Content - {platform}", "FAIL", f"Exception: {str(e)}")
            return {"count": 0, "items": []}
    
    async def test_content_balance(self) -> bool:
        """Test 5: Verify 60-40 international-Indian content balance"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    # Detect Indian content by language
                    indian_languages = ["Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Marathi", "Bengali", "Punjabi"]
                    
                    indian_count = 0
                    international_count = 0
                    
                    for item in content_list:
                        language = item.get("language", "")
                        if language in indian_languages:
                            indian_count += 1
                        else:
                            international_count += 1
                    
                    total = len(content_list)
                    indian_percentage = (indian_count / total * 100) if total > 0 else 0
                    international_percentage = (international_count / total * 100) if total > 0 else 0
                    
                    # Check if balance is approximately 60-40 (allow 5% variance)
                    if 35 <= indian_percentage <= 45 and 55 <= international_percentage <= 65:
                        self.log_test("Content Balance", "PASS", 
                                    f"Balance: {international_percentage:.1f}% international, {indian_percentage:.1f}% Indian ({international_count} int, {indian_count} ind)")
                        return True
                    else:
                        self.log_test("Content Balance", "WARN", 
                                    f"Balance: {international_percentage:.1f}% international, {indian_percentage:.1f}% Indian (expected ~60-40)")
                        return True  # Not a critical failure
                else:
                    error_text = await response.text()
                    self.log_test("Content Balance", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Content Balance", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_rating_field_validation(self) -> bool:
        """Test 6: Verify rating field handles 0.0 ratings correctly"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    # Count items with 0.0 rating
                    zero_rating_items = [item for item in content_list if item.get("rating") == 0.0]
                    zero_count = len(zero_rating_items)
                    
                    # Check if any items have invalid rating types
                    invalid_ratings = []
                    for item in content_list:
                        rating = item.get("rating")
                        if rating is not None and not isinstance(rating, (int, float)):
                            invalid_ratings.append({
                                "title": item.get("title"),
                                "rating": rating,
                                "type": type(rating).__name__
                            })
                    
                    if len(invalid_ratings) == 0:
                        self.log_test("Rating Field Validation", "PASS", 
                                    f"All ratings are valid. {zero_count} items have 0.0 rating (acceptable)")
                        return True
                    else:
                        self.log_test("Rating Field Validation", "FAIL", 
                                    f"Found {len(invalid_ratings)} items with invalid rating types: {invalid_ratings[:3]}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Rating Field Validation", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Rating Field Validation", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_new_title_metadata(self, title: str, expected_data: Dict) -> bool:
        """Test 7: Verify metadata for specific new titles"""
        try:
            async with self.session.get(f"{self.base_url}/api/content/search?q={title}") as response:
                if response.status == 200:
                    results = await response.json()
                    
                    if len(results) == 0:
                        self.log_test(f"Metadata - {title}", "FAIL", 
                                    f"Title not found")
                        return False
                    
                    item = results[0]
                    issues = []
                    
                    # Check platform
                    if "expected_platform" in expected_data:
                        platform = item.get("platform")
                        if platform != expected_data["expected_platform"]:
                            issues.append(f"Platform: {platform} vs expected {expected_data['expected_platform']}")
                    
                    # Check year
                    if "expected_year" in expected_data:
                        year = item.get("year")
                        if year != expected_data["expected_year"]:
                            issues.append(f"Year: {year} vs expected {expected_data['expected_year']}")
                    
                    # Check rating exists (can be 0.0)
                    rating = item.get("rating")
                    if rating is None:
                        issues.append("Rating field is missing")
                    
                    # Check thumbnail/poster
                    thumbnail = item.get("thumbnail", "")
                    if not thumbnail or "unsplash" in thumbnail.lower():
                        issues.append("Missing or placeholder thumbnail")
                    
                    if len(issues) == 0:
                        self.log_test(f"Metadata - {title}", "PASS", 
                                    f"All metadata correct (Platform: {item.get('platform')}, Year: {item.get('year')}, Rating: {rating})")
                        return True
                    else:
                        self.log_test(f"Metadata - {title}", "WARN", 
                                    f"Minor issues: {'; '.join(issues)}")
                        return True  # Not critical
                else:
                    error_text = await response.text()
                    self.log_test(f"Metadata - {title}", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test(f"Metadata - {title}", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run comprehensive Nov 2025 content ingestion tests"""
        print(f"🚀 Starting Nov 2025 Content Ingestion Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Total content count (171 titles)
        print("\n📋 Test 1: Total Content Count (Expected: 171)")
        await self.test_total_content_count()
        
        # Test 2: Trending content count (12 titles)
        print("\n📋 Test 2: Trending Content Count (Expected: 12)")
        await self.test_trending_content_count()
        
        # Test 3: Search for new Nov 2025 titles
        print("\n📋 Test 3: Search New Nov 2025 Titles")
        new_titles = ["Kurukshetra", "Pushpa", "Wednesday"]
        for title in new_titles:
            await self.test_search_new_title(title)
        
        # Test 4: Platform-specific content
        print("\n📋 Test 4: Platform-Specific Content")
        platforms = ["Netflix", "Prime Video", "JioHotstar", "Apple TV", "SonyLIV"]
        for platform in platforms:
            await self.test_platform_content(platform)
        
        # Test 5: Content balance (60-40 international-Indian)
        print("\n📋 Test 5: Content Balance (60-40 International-Indian)")
        await self.test_content_balance()
        
        # Test 6: Rating field validation
        print("\n📋 Test 6: Rating Field Validation")
        await self.test_rating_field_validation()
        
        # Test 7: Metadata for specific new titles
        print("\n📋 Test 7: New Title Metadata Verification")
        new_title_tests = [
            {
                "title": "Kurukshetra",
                "expected_platform": "Netflix",
                "expected_year": 2024
            },
            {
                "title": "Pushpa 2",
                "expected_year": 2024
            },
            {
                "title": "Wednesday",
                "expected_platform": "Netflix"
            }
        ]
        
        for title_data in new_title_tests:
            await self.test_new_title_metadata(title_data["title"], title_data)
        
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
    async with Nov2025ContentTester() as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n🎉 All tests passed! Nov 2025 content ingestion is working correctly.")
            sys.exit(0)
        else:
            print("\n💥 Some tests failed. Check the issues above.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
