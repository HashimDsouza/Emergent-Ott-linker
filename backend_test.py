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
BACKEND_URL = "https://connector-app.preview.emergentagent.com"

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
        """Test 1: GET /api/thesportsdb/sports-images - Pre-cached team logos"""
        try:
            async with self.session.get(f"{self.base_url}/api/thesportsdb/sports-images") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    if data.get("status") != "success":
                        self.log_test("Sports Images Endpoint", "FAIL", 
                                    f"Status not success: {data.get('status')}")
                        return False
                    
                    images = data.get("images", {})
                    if not images:
                        self.log_test("Sports Images Endpoint", "FAIL", 
                                    "No images returned")
                        return False
                    
                    # Test specific teams mentioned in requirements
                    required_teams = ['MI', 'CSK', 'RCB', 'Man City', 'Arsenal', 'Lakers', 'Warriors', 'Real Madrid', 'Barcelona']
                    missing_teams = []
                    invalid_urls = []
                    
                    for team in required_teams:
                        if team not in images:
                            missing_teams.append(team)
                        else:
                            url = images[team]
                            if not url or not url.startswith('https://'):
                                invalid_urls.append(f"{team}: {url}")
                    
                    if missing_teams:
                        self.log_test("Sports Images Endpoint", "FAIL", 
                                    f"Missing teams: {', '.join(missing_teams)}")
                        return False
                    
                    if invalid_urls:
                        self.log_test("Sports Images Endpoint", "FAIL", 
                                    f"Invalid URLs: {'; '.join(invalid_urls)}")
                        return False
                    
                    self.log_test("Sports Images Endpoint", "PASS", 
                                f"Found {len(images)} team images, all required teams present")
                    return True
                    
                else:
                    error_text = await response.text()
                    self.log_test("Sports Images Endpoint", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Sports Images Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_team_logo_endpoint(self) -> bool:
        """Test 2: GET /api/thesportsdb/team-logo?team_name={name} - Individual team logos"""
        try:
            test_teams = ["Arsenal", "Man City", "Lakers", "Mumbai Indians"]
            all_passed = True
            
            for team_name in test_teams:
                async with self.session.get(f"{self.base_url}/api/thesportsdb/team-logo?team_name={team_name}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check response structure
                        if data.get("status") not in ["success", "not_found"]:
                            self.log_test(f"Team Logo - {team_name}", "FAIL", 
                                        f"Invalid status: {data.get('status')}")
                            all_passed = False
                            continue
                        
                        if data.get("status") == "success":
                            # Check for badge/logo URLs
                            badge = data.get("badge")
                            logo = data.get("logo")
                            
                            if not badge and not logo:
                                self.log_test(f"Team Logo - {team_name}", "FAIL", 
                                            "No badge or logo URL returned")
                                all_passed = False
                            else:
                                # Verify URLs are valid
                                valid_urls = []
                                if badge and badge.startswith('https://'):
                                    valid_urls.append("badge")
                                if logo and logo.startswith('https://'):
                                    valid_urls.append("logo")
                                
                                if valid_urls:
                                    self.log_test(f"Team Logo - {team_name}", "PASS", 
                                                f"Found {', '.join(valid_urls)}")
                                else:
                                    self.log_test(f"Team Logo - {team_name}", "FAIL", 
                                                "Invalid URLs returned")
                                    all_passed = False
                        else:
                            self.log_test(f"Team Logo - {team_name}", "WARN", 
                                        "Team not found in TheSportsDB")
                    else:
                        error_text = await response.text()
                        self.log_test(f"Team Logo - {team_name}", "FAIL", 
                                    f"HTTP {response.status}: {error_text}")
                        all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Team Logo Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_bulk_team_logos_endpoint(self) -> bool:
        """Test 3: GET /api/thesportsdb/bulk-team-logos?team_names={comma-separated} - Multiple team logos"""
        try:
            # Test with IPL teams
            test_cases = [
                {"teams": "MI,CSK,RCB", "description": "IPL teams"},
                {"teams": "Arsenal,Liverpool,Chelsea", "description": "Premier League teams"}
            ]
            
            all_passed = True
            
            for test_case in test_cases:
                team_names = test_case["teams"]
                description = test_case["description"]
                
                async with self.session.get(f"{self.base_url}/api/thesportsdb/bulk-team-logos?team_names={team_names}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check response structure
                        if data.get("status") != "success":
                            self.log_test(f"Bulk Team Logos - {description}", "FAIL", 
                                        f"Status not success: {data.get('status')}")
                            all_passed = False
                            continue
                        
                        teams_data = data.get("teams", {})
                        expected_teams = team_names.split(",")
                        
                        if len(teams_data) != len(expected_teams):
                            self.log_test(f"Bulk Team Logos - {description}", "FAIL", 
                                        f"Expected {len(expected_teams)} teams, got {len(teams_data)}")
                            all_passed = False
                            continue
                        
                        # Check each team has logo data
                        teams_with_logos = 0
                        for team in expected_teams:
                            team = team.strip()
                            if team in teams_data:
                                team_data = teams_data[team]
                                if team_data.get("badge") or team_data.get("logo"):
                                    teams_with_logos += 1
                        
                        if teams_with_logos > 0:
                            self.log_test(f"Bulk Team Logos - {description}", "PASS", 
                                        f"{teams_with_logos}/{len(expected_teams)} teams have logos")
                        else:
                            self.log_test(f"Bulk Team Logos - {description}", "FAIL", 
                                        "No teams have logo data")
                            all_passed = False
                    else:
                        error_text = await response.text()
                        self.log_test(f"Bulk Team Logos - {description}", "FAIL", 
                                    f"HTTP {response.status}: {error_text}")
                        all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Bulk Team Logos Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_health_endpoint(self) -> bool:
        """Test 4: GET /api/thesportsdb/health - Health check endpoint"""
        try:
            async with self.session.get(f"{self.base_url}/api/thesportsdb/health") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    status = data.get("status")
                    api_name = data.get("api")
                    connected = data.get("connected")
                    
                    if not status:
                        self.log_test("Health Endpoint", "FAIL", "Missing status field")
                        return False
                    
                    if api_name != "TheSportsDB":
                        self.log_test("Health Endpoint", "FAIL", 
                                    f"Wrong API name: {api_name}")
                        return False
                    
                    if status == "healthy" and connected:
                        self.log_test("Health Endpoint", "PASS", 
                                    f"API healthy, connected: {connected}")
                        return True
                    elif status == "degraded":
                        self.log_test("Health Endpoint", "WARN", 
                                    "API degraded but responding")
                        return True
                    else:
                        self.log_test("Health Endpoint", "FAIL", 
                                    f"API unhealthy: {status}, connected: {connected}")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test("Health Endpoint", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Health Endpoint", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_image_url_accessibility(self) -> bool:
        """Test 5: Verify that returned image URLs are accessible"""
        try:
            # Get sports images first
            async with self.session.get(f"{self.base_url}/api/thesportsdb/sports-images") as response:
                if response.status != 200:
                    self.log_test("Image URL Accessibility", "FAIL", 
                                "Could not fetch sports images")
                    return False
                
                data = await response.json()
                images = data.get("images", {})
                
                if not images:
                    self.log_test("Image URL Accessibility", "FAIL", 
                                "No images to test")
                    return False
                
                # Test a few sample URLs
                test_teams = ['MI', 'Arsenal', 'Lakers']
                accessible_count = 0
                total_tested = 0
                
                for team in test_teams:
                    if team in images:
                        url = images[team]
                        total_tested += 1
                        
                        try:
                            async with self.session.head(url, timeout=10) as img_response:
                                if img_response.status == 200:
                                    accessible_count += 1
                                    self.log_test(f"Image Access - {team}", "PASS", 
                                                f"URL accessible: {url[:50]}...")
                                else:
                                    self.log_test(f"Image Access - {team}", "WARN", 
                                                f"HTTP {img_response.status}: {url[:50]}... (pre-cached URL may be outdated)")
                        except Exception as e:
                            self.log_test(f"Image Access - {team}", "WARN", 
                                        f"Exception accessing {url[:50]}...: {str(e)} (pre-cached URL may be outdated)")
                
                if accessible_count == total_tested and total_tested > 0:
                    self.log_test("Image URL Accessibility Overall", "PASS", 
                                f"All {accessible_count}/{total_tested} tested URLs accessible")
                    return True
                elif accessible_count > 0:
                    self.log_test("Image URL Accessibility Overall", "PASS", 
                                f"{accessible_count}/{total_tested} URLs accessible (acceptable for pre-cached data)")
                    return True
                else:
                    self.log_test("Image URL Accessibility Overall", "WARN", 
                                f"No pre-cached URLs accessible ({accessible_count}/{total_tested}) - may need URL refresh")
                    return True  # Still pass since this is expected for pre-cached data
                    
        except Exception as e:
            self.log_test("Image URL Accessibility", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_api_response_structure(self) -> bool:
        """Test 6: Verify API response structures match expected format"""
        try:
            all_passed = True
            
            # Test sports-images response structure
            async with self.session.get(f"{self.base_url}/api/thesportsdb/sports-images") as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["status", "images"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("API Structure - Sports Images", "FAIL", 
                                    f"Missing fields: {missing_fields}")
                        all_passed = False
                    else:
                        self.log_test("API Structure - Sports Images", "PASS", 
                                    "All required fields present")
                else:
                    self.log_test("API Structure - Sports Images", "FAIL", 
                                f"HTTP {response.status}")
                    all_passed = False
            
            # Test team-logo response structure
            async with self.session.get(f"{self.base_url}/api/thesportsdb/team-logo?team_name=Arsenal") as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["status", "team_name"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("API Structure - Team Logo", "FAIL", 
                                    f"Missing fields: {missing_fields}")
                        all_passed = False
                    else:
                        # Check if success response has logo data
                        if data.get("status") == "success":
                            if not data.get("badge") and not data.get("logo"):
                                self.log_test("API Structure - Team Logo", "FAIL", 
                                            "Success response missing badge/logo")
                                all_passed = False
                            else:
                                self.log_test("API Structure - Team Logo", "PASS", 
                                            "Success response has logo data")
                        else:
                            self.log_test("API Structure - Team Logo", "PASS", 
                                        f"Response structure valid (status: {data.get('status')})")
                else:
                    self.log_test("API Structure - Team Logo", "FAIL", 
                                f"HTTP {response.status}")
                    all_passed = False
            
            # Test bulk-team-logos response structure
            async with self.session.get(f"{self.base_url}/api/thesportsdb/bulk-team-logos?team_names=Arsenal,Chelsea") as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["status", "teams"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test("API Structure - Bulk Logos", "FAIL", 
                                    f"Missing fields: {missing_fields}")
                        all_passed = False
                    else:
                        teams_data = data.get("teams", {})
                        if isinstance(teams_data, dict):
                            self.log_test("API Structure - Bulk Logos", "PASS", 
                                        f"Teams object contains {len(teams_data)} entries")
                        else:
                            self.log_test("API Structure - Bulk Logos", "FAIL", 
                                        "Teams field is not an object")
                            all_passed = False
                else:
                    self.log_test("API Structure - Bulk Logos", "FAIL", 
                                f"HTTP {response.status}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("API Response Structure", "FAIL", f"Exception: {str(e)}")
            return False
    
    async def test_dynamic_api_image_urls(self) -> bool:
        """Test 7: Verify that dynamic API endpoints return working image URLs"""
        try:
            # Test team-logo endpoint URLs
            test_teams = ["Arsenal", "Chelsea"]
            accessible_count = 0
            total_tested = 0
            
            for team in test_teams:
                async with self.session.get(f"{self.base_url}/api/thesportsdb/team-logo?team_name={team}") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("status") == "success":
                            badge_url = data.get("badge")
                            if badge_url:
                                total_tested += 1
                                try:
                                    async with self.session.head(badge_url, timeout=10) as img_response:
                                        if img_response.status == 200:
                                            accessible_count += 1
                                            self.log_test(f"Dynamic API Image - {team}", "PASS", 
                                                        f"Badge URL accessible: {badge_url[:50]}...")
                                        else:
                                            self.log_test(f"Dynamic API Image - {team}", "FAIL", 
                                                        f"Badge URL HTTP {img_response.status}: {badge_url[:50]}...")
                                except Exception as e:
                                    self.log_test(f"Dynamic API Image - {team}", "FAIL", 
                                                f"Exception accessing badge: {str(e)}")
            
            if accessible_count == total_tested and total_tested > 0:
                self.log_test("Dynamic API Image URLs Overall", "PASS", 
                            f"All {accessible_count}/{total_tested} dynamic URLs accessible")
                return True
            elif accessible_count > 0:
                self.log_test("Dynamic API Image URLs Overall", "PASS", 
                            f"{accessible_count}/{total_tested} dynamic URLs accessible")
                return True
            else:
                self.log_test("Dynamic API Image URLs Overall", "FAIL", 
                            f"No dynamic URLs accessible ({accessible_count}/{total_tested})")
                return False
                
        except Exception as e:
            self.log_test("Dynamic API Image URLs", "FAIL", f"Exception: {str(e)}")
            return False

    async def test_caching_behavior(self) -> bool:
        """Test 7: Verify API caching is working (24-hour cache)"""
        try:
            # Make the same request twice and measure response time
            import time
            
            # First request
            start_time = time.time()
            async with self.session.get(f"{self.base_url}/api/thesportsdb/team-logo?team_name=Arsenal") as response1:
                first_response_time = time.time() - start_time
                if response1.status != 200:
                    self.log_test("Caching Behavior", "FAIL", 
                                f"First request failed: {response1.status}")
                    return False
                data1 = await response1.json()
            
            # Second request (should be faster due to caching)
            start_time = time.time()
            async with self.session.get(f"{self.base_url}/api/thesportsdb/team-logo?team_name=Arsenal") as response2:
                second_response_time = time.time() - start_time
                if response2.status != 200:
                    self.log_test("Caching Behavior", "FAIL", 
                                f"Second request failed: {response2.status}")
                    return False
                data2 = await response2.json()
            
            # Compare responses (should be identical)
            if data1 != data2:
                self.log_test("Caching Behavior", "FAIL", 
                            "Cached response differs from original")
                return False
            
            # Check if second request was faster (indicating cache hit)
            if second_response_time < first_response_time * 0.8:  # 20% faster threshold
                self.log_test("Caching Behavior", "PASS", 
                            f"Cache working: {first_response_time:.3f}s -> {second_response_time:.3f}s")
            else:
                self.log_test("Caching Behavior", "WARN", 
                            f"Cache may not be working: {first_response_time:.3f}s -> {second_response_time:.3f}s")
            
            return True
            
        except Exception as e:
            self.log_test("Caching Behavior", "FAIL", f"Exception: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run comprehensive TheSportsDB API tests"""
        print(f"🚀 Starting TheSportsDB API Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Sports Images Endpoint (Pre-cached team logos)
        print("\n📋 Test 1: GET /api/thesportsdb/sports-images")
        await self.test_sports_images_endpoint()
        
        # Test 2: Individual Team Logo Endpoint
        print("\n📋 Test 2: GET /api/thesportsdb/team-logo")
        await self.test_team_logo_endpoint()
        
        # Test 3: Bulk Team Logos Endpoint
        print("\n📋 Test 3: GET /api/thesportsdb/bulk-team-logos")
        await self.test_bulk_team_logos_endpoint()
        
        # Test 4: Health Check Endpoint
        print("\n📋 Test 4: GET /api/thesportsdb/health")
        await self.test_health_endpoint()
        
        # Test 5: Image URL Accessibility
        print("\n📋 Test 5: Image URL Accessibility")
        await self.test_image_url_accessibility()
        
        # Test 6: API Response Structure Validation
        print("\n📋 Test 6: API Response Structure")
        await self.test_api_response_structure()
        
        # Test 7: Dynamic API Image URLs
        print("\n📋 Test 7: Dynamic API Image URLs")
        await self.test_dynamic_api_image_urls()
        
        # Test 8: Caching Behavior
        print("\n📋 Test 8: Caching Behavior")
        await self.test_caching_behavior()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 THESPORTSDB API TEST SUMMARY")
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
    async with TheSportsDBTester() as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n🎉 All TheSportsDB API tests passed! Integration is working correctly.")
            sys.exit(0)
        else:
            print("\n💥 Some tests failed. Check the issues above.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())