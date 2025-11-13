#!/usr/bin/env python3
"""
Backend API Testing for OTT Linker - Pydantic Validation Fix
Tests the critical Pydantic validation fix for rating field
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://media-unifier.preview.emergentagent.com"

class PydanticValidationTester:
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
    
    async def test_content_endpoint_no_500_errors(self) -> bool:
        """CRITICAL TEST: GET /api/content should not return 500 errors"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    if isinstance(content_list, list) and len(content_list) > 0:
                        self.log_test("GET /api/content - No 500 Errors", "PASS", 
                                    f"Successfully returned {len(content_list)} content items")
                        return True
                    else:
                        self.log_test("GET /api/content - No 500 Errors", "FAIL", 
                                    "Returned empty list or invalid format")
                        return False
                elif response.status == 500:
                    error_text = await response.text()
                    self.log_test("GET /api/content - No 500 Errors", "FAIL", 
                                f"CRITICAL: Still getting 500 Internal Server Error: {error_text}")
                    return False
                else:
                    error_text = await response.text()
                    self.log_test("GET /api/content - No 500 Errors", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("GET /api/content - No 500 Errors", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_rating_field_validation(self) -> bool:
        """Test that content with rating=0.0 is handled correctly"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    # Check for items with rating 0.0 or null
                    zero_rating_items = []
                    null_rating_items = []
                    valid_rating_items = []
                    
                    for item in content_list:
                        rating = item.get("rating")
                        if rating == 0.0:
                            zero_rating_items.append(item.get("title", "Unknown"))
                        elif rating is None:
                            null_rating_items.append(item.get("title", "Unknown"))
                        elif isinstance(rating, (int, float)) and rating > 0:
                            valid_rating_items.append(item.get("title", "Unknown"))
                    
                    total_items = len(content_list)
                    zero_count = len(zero_rating_items)
                    null_count = len(null_rating_items)
                    valid_count = len(valid_rating_items)
                    
                    # The fix should handle both 0.0 and null ratings without errors
                    if total_items > 0:
                        self.log_test("Rating Field Validation", "PASS", 
                                    f"Total: {total_items}, Rating=0.0: {zero_count}, Rating=null: {null_count}, Valid ratings: {valid_count}")
                        return True
                    else:
                        self.log_test("Rating Field Validation", "FAIL", 
                                    "No content items found to test rating validation")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Rating Field Validation", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Rating Field Validation", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_search_functionality(self) -> bool:
        """Test search functionality with expanded catalog"""
        search_terms = ["Fighter", "Squid Game", "Mirzapur", "Asur", "12th Fail"]
        
        all_searches_passed = True
        search_results = {}
        
        for term in search_terms:
            try:
                async with self.session.get(f"{self.base_url}/api/search?q={term}") as response:
                    if response.status == 200:
                        results = await response.json()
                        
                        if isinstance(results, list):
                            search_results[term] = len(results)
                            
                            if len(results) > 0:
                                # Check if results contain the search term
                                relevant_results = [r for r in results if term.lower() in r.get("title", "").lower()]
                                if len(relevant_results) > 0:
                                    self.log_test(f"Search - {term}", "PASS", 
                                                f"Found {len(results)} results, {len(relevant_results)} relevant")
                                else:
                                    self.log_test(f"Search - {term}", "WARN", 
                                                f"Found {len(results)} results but none contain '{term}'")
                            else:
                                self.log_test(f"Search - {term}", "WARN", 
                                            f"No results found for '{term}'")
                        else:
                            self.log_test(f"Search - {term}", "FAIL", 
                                        "Invalid response format (not a list)")
                            all_searches_passed = False
                    elif response.status == 500:
                        error_text = await response.text()
                        self.log_test(f"Search - {term}", "FAIL", 
                                    f"500 Internal Server Error: {error_text}")
                        all_searches_passed = False
                    else:
                        error_text = await response.text()
                        self.log_test(f"Search - {term}", "FAIL", 
                                    f"HTTP {response.status}: {error_text}")
                        all_searches_passed = False
            except Exception as e:
                self.log_test(f"Search - {term}", "FAIL", f"Exception: {str(e)}")
                all_searches_passed = False
        
        # Overall search functionality test
        if all_searches_passed:
            total_results = sum(search_results.values())
            self.log_test("Search Functionality Overall", "PASS", 
                        f"All search queries processed successfully. Total results: {total_results}")
        else:
            self.log_test("Search Functionality Overall", "FAIL", 
                        "Some search queries failed")
        
        return all_searches_passed
    
    async def test_enriched_content_tmdb_data(self) -> bool:
        """Test that enriched content has proper TMDB data"""
        try:
            async with self.session.get(f"{self.base_url}/api/content") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    enriched_items = []
                    missing_tmdb_items = []
                    
                    for item in content_list:
                        title = item.get("title", "Unknown")
                        tmdb_id = item.get("tmdb_id")
                        poster_url = item.get("poster_url", "")
                        
                        if tmdb_id and poster_url and poster_url.startswith("https://image.tmdb.org"):
                            enriched_items.append(title)
                        else:
                            missing_tmdb_items.append(title)
                    
                    total_items = len(content_list)
                    enriched_count = len(enriched_items)
                    missing_count = len(missing_tmdb_items)
                    
                    if enriched_count > 0:
                        enrichment_percentage = (enriched_count / total_items) * 100
                        self.log_test("TMDB Data Enrichment", "PASS", 
                                    f"Enriched: {enriched_count}/{total_items} ({enrichment_percentage:.1f}%)")
                        
                        if missing_count > 0:
                            self.log_test("TMDB Data - Missing Items", "WARN", 
                                        f"{missing_count} items missing TMDB data: {', '.join(missing_tmdb_items[:5])}...")
                        
                        return True
                    else:
                        self.log_test("TMDB Data Enrichment", "FAIL", 
                                    "No items have TMDB enrichment data")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("TMDB Data Enrichment", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("TMDB Data Enrichment", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_platform_specific_endpoints(self) -> bool:
        """Test platform-specific content endpoints"""
        platforms = ["Netflix", "Prime Video", "JioHotstar", "Apple TV", "SonyLIV"]
        
        all_platforms_passed = True
        platform_results = {}
        
        for platform in platforms:
            try:
                # Test by filtering content by platform
                async with self.session.get(f"{self.base_url}/api/content") as response:
                    if response.status == 200:
                        all_content = await response.json()
                        
                        # Filter by platform
                        platform_content = [item for item in all_content 
                                          if item.get("platform", "").lower() == platform.lower()]
                        
                        platform_results[platform] = len(platform_content)
                        
                        if len(platform_content) > 0:
                            # Check if platform content has proper metadata
                            enriched_platform_content = [item for item in platform_content 
                                                       if item.get("tmdb_id")]
                            
                            self.log_test(f"Platform - {platform}", "PASS", 
                                        f"Found {len(platform_content)} items, {len(enriched_platform_content)} enriched")
                        else:
                            self.log_test(f"Platform - {platform}", "WARN", 
                                        f"No content found for {platform}")
                    else:
                        error_text = await response.text()
                        self.log_test(f"Platform - {platform}", "FAIL", 
                                    f"HTTP {response.status}: {error_text}")
                        all_platforms_passed = False
            except Exception as e:
                self.log_test(f"Platform - {platform}", "FAIL", f"Exception: {str(e)}")
                all_platforms_passed = False
        
        # Overall platform test
        if all_platforms_passed:
            total_platform_content = sum(platform_results.values())
            self.log_test("Platform-Specific Content Overall", "PASS", 
                        f"All platforms accessible. Total platform content: {total_platform_content}")
        else:
            self.log_test("Platform-Specific Content Overall", "FAIL", 
                        "Some platform queries failed")
        
        return all_platforms_passed
    
    async def test_backend_stability(self) -> bool:
        """Test backend stability by making multiple rapid requests"""
        try:
            # Make 5 rapid requests to test stability
            tasks = []
            for i in range(5):
                task = self.session.get(f"{self.base_url}/api/content")
                tasks.append(task)
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            success_count = 0
            error_count = 0
            
            for i, response in enumerate(responses):
                if isinstance(response, Exception):
                    error_count += 1
                else:
                    if response.status == 200:
                        success_count += 1
                        await response.json()  # Ensure we can parse the response
                    else:
                        error_count += 1
                    response.close()
            
            if success_count == 5:
                self.log_test("Backend Stability", "PASS", 
                            f"All 5 rapid requests successful")
                return True
            else:
                self.log_test("Backend Stability", "FAIL", 
                            f"Only {success_count}/5 requests successful, {error_count} failed")
                return False
        except Exception as e:
            self.log_test("Backend Stability", "FAIL", f"Exception: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run comprehensive Pydantic validation fix tests"""
        print(f"🚀 Starting Pydantic Validation Fix Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: CRITICAL - No 500 errors on /api/content
        print("\n📋 Step 1: CRITICAL - Testing /api/content endpoint (no 500 errors)")
        content_success = await self.test_content_endpoint_no_500_errors()
        
        # Test 2: Rating field validation
        print("\n📋 Step 2: Testing rating field validation (0.0 and null values)")
        rating_success = await self.test_rating_field_validation()
        
        # Test 3: Search functionality
        print("\n📋 Step 3: Testing search functionality with expanded catalog")
        search_success = await self.test_search_functionality()
        
        # Test 4: TMDB enrichment data
        print("\n📋 Step 4: Testing TMDB enrichment data")
        tmdb_success = await self.test_enriched_content_tmdb_data()
        
        # Test 5: Platform-specific content
        print("\n📋 Step 5: Testing platform-specific content")
        platform_success = await self.test_platform_specific_endpoints()
        
        # Test 6: Backend stability
        print("\n📋 Step 6: Testing backend stability")
        stability_success = await self.test_backend_stability()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 PYDANTIC VALIDATION FIX TEST SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] == "FAIL"])
        warnings = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"📊 Total: {len(self.test_results)}")
        
        # Critical tests that must pass
        critical_tests = [
            "GET /api/content - No 500 Errors",
            "Rating Field Validation",
            "Backend Stability"
        ]
        
        critical_failures = []
        for result in self.test_results:
            if result["test"] in critical_tests and result["status"] == "FAIL":
                critical_failures.append(result)
        
        if critical_failures:
            print("\n❌ CRITICAL FAILURES:")
            for failure in critical_failures:
                print(f"   • {failure['test']}: {failure['details']}")
            print("\n💥 PYDANTIC VALIDATION FIX NOT WORKING - CRITICAL ISSUES FOUND")
            return False
        
        if failed > 0:
            print("\n❌ NON-CRITICAL FAILURES:")
            for result in self.test_results:
                if result["status"] == "FAIL" and result["test"] not in critical_tests:
                    print(f"   • {result['test']}: {result['details']}")
        
        if len(critical_failures) == 0:
            print("\n🎉 PYDANTIC VALIDATION FIX SUCCESSFUL - All critical tests passed!")
            return True
        else:
            return False

async def main():
    """Main test runner"""
    async with PydanticValidationTester() as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n🎉 Pydantic validation fix verified successfully!")
            sys.exit(0)
        else:
            print("\n💥 Pydantic validation fix verification failed!")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())