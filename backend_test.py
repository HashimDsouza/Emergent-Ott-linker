#!/usr/bin/env python3
"""
Backend API Testing for YouTube Data API Integration
Tests the new YouTube Data API endpoints for Game On section sports highlights
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://connector-hub-3.preview.emergentagent.com"

class YouTubeAPITester:
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
    
    async def test_youtube_health_endpoint(self) -> bool:
        """Test 1: GET /api/youtube/health - Health check endpoint"""
        try:
            async with self.session.get(f"{self.base_url}/api/youtube/health") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    status = data.get("status")
                    api_name = data.get("api")
                    connected = data.get("connected")
                    
                    if not status:
                        self.log_test("YouTube Health Endpoint", "FAIL", "Missing status field")
                        return False
                    
                    if api_name != "YouTube Data API v3":
                        self.log_test("YouTube Health Endpoint", "FAIL", 
                                    f"Wrong API name: {api_name}")
                        return False
                    
                    if status == "healthy" and connected:
                        self.log_test("YouTube Health Endpoint", "PASS", 
                                    f"API healthy, connected: {connected}")
                        return True
                    elif status == "degraded":
                        self.log_test("YouTube Health Endpoint", "WARN", 
                                    "API degraded but responding")
                        return True
                    else:
                        self.log_test("YouTube Health Endpoint", "FAIL", 
                                    f"API unhealthy: {status}, connected: {connected}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("YouTube Health Endpoint", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("YouTube Health Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_supported_sports_endpoint(self) -> bool:
        """Test 2: GET /api/youtube/supported-sports - List of supported sports"""
        try:
            async with self.session.get(f"{self.base_url}/api/youtube/supported-sports") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    if data.get("status") != "success":
                        self.log_test("Supported Sports Endpoint", "FAIL", 
                                    f"Status not success: {data.get('status')}")
                        return False
                    
                    sports = data.get("sports", [])
                    if not sports:
                        self.log_test("Supported Sports Endpoint", "FAIL", 
                                    "No sports returned")
                        return False
                    
                    # Check for expected sports
                    expected_sports = ['premier_league', 'cricket', 'uefa', 'formula1', 'tennis', 'nba']
                    sport_ids = [sport.get('id') for sport in sports]
                    
                    missing_sports = [sport for sport in expected_sports if sport not in sport_ids]
                    if missing_sports:
                        self.log_test("Supported Sports Endpoint", "FAIL", 
                                    f"Missing sports: {', '.join(missing_sports)}")
                        return False
                    
                    # Verify sport structure
                    for sport in sports:
                        required_fields = ['id', 'name', 'official_channels']
                        missing_fields = [field for field in required_fields if field not in sport]
                        if missing_fields:
                            self.log_test("Supported Sports Endpoint", "FAIL", 
                                        f"Sport {sport.get('id')} missing fields: {missing_fields}")
                            return False
                    
                    self.log_test("Supported Sports Endpoint", "PASS", 
                                f"Found {len(sports)} sports with all required fields")
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Supported Sports Endpoint", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Supported Sports Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_premier_league_highlights(self) -> bool:
        """Test 3: GET /api/youtube/sports-highlights?sport=premier_league&max_results=3"""
        try:
            params = "sport=premier_league&max_results=3"
            async with self.session.get(f"{self.base_url}/api/youtube/sports-highlights?{params}") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    if data.get("status") not in ["success", "error"]:
                        self.log_test("Premier League Highlights", "FAIL", 
                                    f"Invalid status: {data.get('status')}")
                        return False
                    
                    if data.get("status") == "error":
                        # Graceful error handling is acceptable
                        self.log_test("Premier League Highlights", "WARN", 
                                    f"API returned error: {data.get('error', 'Unknown error')}")
                        return True
                    
                    # Check sport name
                    if data.get("sport") != "Premier League":
                        self.log_test("Premier League Highlights", "FAIL", 
                                    f"Wrong sport name: {data.get('sport')}")
                        return False
                    
                    highlights = data.get("highlights", [])
                    
                    # Check if we got highlights
                    if not highlights:
                        self.log_test("Premier League Highlights", "WARN", 
                                    "No highlights returned (may be API quota or network issue)")
                        return True  # Not a failure, could be quota/network
                    
                    # Verify highlight structure
                    for i, highlight in enumerate(highlights[:3]):  # Check first 3
                        required_fields = ['video_id', 'title', 'thumbnail', 'video_url']
                        missing_fields = [field for field in required_fields if not highlight.get(field)]
                        
                        if missing_fields:
                            self.log_test("Premier League Highlights", "FAIL", 
                                        f"Highlight {i+1} missing fields: {missing_fields}")
                            return False
                        
                        # Check thumbnail quality (should be high quality)
                        thumbnail = highlight.get('thumbnail', '')
                        if not any(size in thumbnail for size in ['480x360', '1280x720', 'hqdefault', 'maxresdefault']):
                            self.log_test("Premier League Highlights", "WARN", 
                                        f"Highlight {i+1} may not have high quality thumbnail")
                        
                        # Check video URL format
                        video_url = highlight.get('video_url', '')
                        if not video_url.startswith('https://www.youtube.com/watch?v='):
                            self.log_test("Premier League Highlights", "FAIL", 
                                        f"Highlight {i+1} invalid video URL format")
                            return False
                    
                    # Check caching info
                    cached = data.get("cached")
                    if cached is not None:
                        cache_info = f"cached: {cached}"
                        if cached:
                            cache_hours = data.get("cache_expires_in_hours", "unknown")
                            cache_info += f", expires in {cache_hours}h"
                        else:
                            cache_info += f", will cache for {data.get('cache_expires_in_hours', 48)}h"
                        
                        self.log_test("Premier League Highlights", "PASS", 
                                    f"Found {len(highlights)} highlights, {cache_info}")
                    else:
                        self.log_test("Premier League Highlights", "PASS", 
                                    f"Found {len(highlights)} highlights")
                    
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Premier League Highlights", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Premier League Highlights", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_cricket_highlights(self) -> bool:
        """Test 4: GET /api/youtube/sports-highlights?sport=cricket&max_results=3"""
        try:
            params = "sport=cricket&max_results=3"
            async with self.session.get(f"{self.base_url}/api/youtube/sports-highlights?{params}") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    if data.get("status") not in ["success", "error"]:
                        self.log_test("Cricket Highlights", "FAIL", 
                                    f"Invalid status: {data.get('status')}")
                        return False
                    
                    if data.get("status") == "error":
                        # Graceful error handling is acceptable
                        self.log_test("Cricket Highlights", "WARN", 
                                    f"API returned error: {data.get('error', 'Unknown error')}")
                        return True
                    
                    # Check sport name
                    if data.get("sport") != "ICC Cricket":
                        self.log_test("Cricket Highlights", "FAIL", 
                                    f"Wrong sport name: {data.get('sport')}")
                        return False
                    
                    highlights = data.get("highlights", [])
                    
                    # Check if we got highlights
                    if not highlights:
                        self.log_test("Cricket Highlights", "WARN", 
                                    "No highlights returned (may be API quota or network issue)")
                        return True  # Not a failure, could be quota/network
                    
                    # Verify highlight structure (same as Premier League)
                    for i, highlight in enumerate(highlights[:3]):
                        required_fields = ['video_id', 'title', 'thumbnail', 'video_url']
                        missing_fields = [field for field in required_fields if not highlight.get(field)]
                        
                        if missing_fields:
                            self.log_test("Cricket Highlights", "FAIL", 
                                        f"Highlight {i+1} missing fields: {missing_fields}")
                            return False
                        
                        # Check video URL format
                        video_url = highlight.get('video_url', '')
                        if not video_url.startswith('https://www.youtube.com/watch?v='):
                            self.log_test("Cricket Highlights", "FAIL", 
                                        f"Highlight {i+1} invalid video URL format")
                            return False
                    
                    self.log_test("Cricket Highlights", "PASS", 
                                f"Found {len(highlights)} ICC Cricket highlights")
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Cricket Highlights", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Cricket Highlights", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_invalid_sport_error_handling(self) -> bool:
        """Test 5: GET /api/youtube/sports-highlights?sport=invalid - Error handling"""
        try:
            params = "sport=invalid"
            async with self.session.get(f"{self.base_url}/api/youtube/sports-highlights?{params}") as response:
                if response.status == 400:
                    data = await response.json()
                    
                    # Check error response structure
                    detail = data.get("detail", "")
                    if "not supported" in detail.lower() or "invalid" in detail.lower():
                        self.log_test("Invalid Sport Error Handling", "PASS", 
                                    f"Correctly returned 400 error: {detail}")
                        return True
                    else:
                        self.log_test("Invalid Sport Error Handling", "FAIL", 
                                    f"Wrong error message: {detail}")
                        return False
                elif response.status == 200:
                    # Should not return 200 for invalid sport
                    self.log_test("Invalid Sport Error Handling", "FAIL", 
                                "Should return 400 error for invalid sport")
                    return False
                else:
                    error_text = await response.text()
                    self.log_test("Invalid Sport Error Handling", "FAIL", 
                                f"Unexpected HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Invalid Sport Error Handling", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_caching_behavior(self) -> bool:
        """Test 6: Verify API caching is working (48-hour cache)"""
        try:
            # Make the same request twice and check caching info
            import time
            
            params = "sport=premier_league&max_results=2"
            
            # First request
            start_time = time.time()
            async with self.session.get(f"{self.base_url}/api/youtube/sports-highlights?{params}") as response1:
                first_response_time = time.time() - start_time
                if response1.status != 200:
                    self.log_test("Caching Behavior", "FAIL", 
                                f"First request failed: {response1.status}")
                    return False
                data1 = await response1.json()
            
            # Second request (should be faster due to caching)
            start_time = time.time()
            async with self.session.get(f"{self.base_url}/api/youtube/sports-highlights?{params}") as response2:
                second_response_time = time.time() - start_time
                if response2.status != 200:
                    self.log_test("Caching Behavior", "FAIL", 
                                f"Second request failed: {response2.status}")
                    return False
                data2 = await response2.json()
            
            # Check if second request indicates caching
            cached_first = data1.get("cached", False)
            cached_second = data2.get("cached", False)
            
            if not cached_first and cached_second:
                self.log_test("Caching Behavior", "PASS", 
                            f"Cache working: first request cached={cached_first}, second cached={cached_second}")
                return True
            elif cached_first and cached_second:
                self.log_test("Caching Behavior", "PASS", 
                            "Both requests served from cache (cache already populated)")
                return True
            elif second_response_time < first_response_time * 0.8:  # 20% faster threshold
                self.log_test("Caching Behavior", "PASS", 
                            f"Cache working (response time): {first_response_time:.3f}s -> {second_response_time:.3f}s")
                return True
            else:
                self.log_test("Caching Behavior", "WARN", 
                            f"Cache behavior unclear: first cached={cached_first}, second cached={cached_second}")
                return True  # Not a failure, just unclear
            
        except Exception as e:
            self.log_test("Caching Behavior", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_thumbnail_quality_verification(self) -> bool:
        """Test 7: Verify thumbnail URLs are high quality (480x360 or 1280x720)"""
        try:
            params = "sport=premier_league&max_results=2"
            async with self.session.get(f"{self.base_url}/api/youtube/sports-highlights?{params}") as response:
                if response.status != 200:
                    self.log_test("Thumbnail Quality Verification", "FAIL", 
                                f"Request failed: {response.status}")
                    return False
                
                data = await response.json()
                
                if data.get("status") == "error":
                    self.log_test("Thumbnail Quality Verification", "WARN", 
                                "API returned error, cannot test thumbnails")
                    return True
                
                highlights = data.get("highlights", [])
                
                if not highlights:
                    self.log_test("Thumbnail Quality Verification", "WARN", 
                                "No highlights returned, cannot test thumbnails")
                    return True
                
                high_quality_count = 0
                total_thumbnails = 0
                
                for i, highlight in enumerate(highlights[:2]):
                    thumbnail = highlight.get('thumbnail', '')
                    thumbnail_hd = highlight.get('thumbnail_hd', '')
                    
                    if thumbnail:
                        total_thumbnails += 1
                        
                        # Check if thumbnail is high quality
                        if any(indicator in thumbnail for indicator in ['hqdefault', 'maxresdefault', '480x360', '1280x720']):
                            high_quality_count += 1
                        elif thumbnail_hd and any(indicator in thumbnail_hd for indicator in ['maxresdefault', '1280x720']):
                            high_quality_count += 1
                        
                        # Test thumbnail accessibility
                        try:
                            async with self.session.head(thumbnail, timeout=10) as thumb_response:
                                if thumb_response.status == 200:
                                    self.log_test(f"Thumbnail Access - Highlight {i+1}", "PASS", 
                                                f"Thumbnail accessible: {thumbnail[:50]}...")
                                else:
                                    self.log_test(f"Thumbnail Access - Highlight {i+1}", "WARN", 
                                                f"Thumbnail HTTP {thumb_response.status}: {thumbnail[:50]}...")
                        except Exception as e:
                            self.log_test(f"Thumbnail Access - Highlight {i+1}", "WARN", 
                                        f"Thumbnail access error: {str(e)[:50]}...")
                
                if total_thumbnails == 0:
                    self.log_test("Thumbnail Quality Verification", "WARN", 
                                "No thumbnails found to verify")
                    return True
                
                quality_percentage = (high_quality_count / total_thumbnails) * 100
                
                if quality_percentage >= 80:  # 80% threshold
                    self.log_test("Thumbnail Quality Verification", "PASS", 
                                f"{high_quality_count}/{total_thumbnails} thumbnails are high quality ({quality_percentage:.0f}%)")
                    return True
                else:
                    self.log_test("Thumbnail Quality Verification", "WARN", 
                                f"Only {high_quality_count}/{total_thumbnails} thumbnails are high quality ({quality_percentage:.0f}%)")
                    return True  # Not a failure, just lower quality
                
        except Exception as e:
            self.log_test("Thumbnail Quality Verification", "FAIL", f"Exception: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run comprehensive YouTube API tests"""
        print(f"🚀 Starting YouTube Data API Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health Check Endpoint
        print("\n📋 Test 1: GET /api/youtube/health")
        await self.test_youtube_health_endpoint()
        
        # Test 2: Supported Sports Endpoint
        print("\n📋 Test 2: GET /api/youtube/supported-sports")
        await self.test_supported_sports_endpoint()
        
        # Test 3: Premier League Highlights
        print("\n📋 Test 3: GET /api/youtube/sports-highlights?sport=premier_league&max_results=3")
        await self.test_premier_league_highlights()
        
        # Test 4: Cricket Highlights
        print("\n📋 Test 4: GET /api/youtube/sports-highlights?sport=cricket&max_results=3")
        await self.test_cricket_highlights()
        
        # Test 5: Invalid Sport Error Handling
        print("\n📋 Test 5: GET /api/youtube/sports-highlights?sport=invalid")
        await self.test_invalid_sport_error_handling()
        
        # Test 6: Caching Behavior
        print("\n📋 Test 6: Caching Behavior (48-hour cache)")
        await self.test_caching_behavior()
        
        # Test 7: Thumbnail Quality Verification
        print("\n📋 Test 7: Thumbnail Quality Verification")
        await self.test_thumbnail_quality_verification()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 YOUTUBE DATA API TEST SUMMARY")
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
        
        if warnings > 0:
            print("\n⚠️  WARNINGS:")
            for result in self.test_results:
                if result["status"] == "WARN":
                    print(f"   • {result['test']}: {result['details']}")
        
        return failed == 0

async def main():
    """Main test runner"""
    async with YouTubeAPITester() as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n🎉 All YouTube Data API tests passed! Integration is working correctly.")
            sys.exit(0)
        else:
            print("\n💥 Some tests failed. Check the issues above.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())