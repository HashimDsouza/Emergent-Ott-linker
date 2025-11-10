#!/usr/bin/env python3
"""
Backend API Testing for TheSportsDB Integration
Tests the new TheSportsDB API endpoints for Game On section
"""

import asyncio
import aiohttp
import json
import sys
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://connector-app.preview.emergentagent.com"

class TheSportsDBTester:
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
    
    async def test_sports_images_endpoint(self) -> bool:
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
                                    self.log_test(f"Image Access - {team}", "FAIL", 
                                                f"HTTP {img_response.status}: {url[:50]}...")
                        except Exception as e:
                            self.log_test(f"Image Access - {team}", "FAIL", 
                                        f"Exception accessing {url[:50]}...: {str(e)}")
                
                if accessible_count == total_tested and total_tested > 0:
                    self.log_test("Image URL Accessibility Overall", "PASS", 
                                f"All {accessible_count}/{total_tested} tested URLs accessible")
                    return True
                elif accessible_count > 0:
                    self.log_test("Image URL Accessibility Overall", "WARN", 
                                f"Only {accessible_count}/{total_tested} URLs accessible")
                    return True
                else:
                    self.log_test("Image URL Accessibility Overall", "FAIL", 
                                f"No URLs accessible ({accessible_count}/{total_tested})")
                    return False
                    
        except Exception as e:
            self.log_test("Image URL Accessibility", "FAIL", f"Exception: {str(e)}")
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
                    
                    # Check description for crime/thriller keywords
                    crime_keywords = ["psychological", "thriller", "serial killer", "forensic", "murder", "crime", "suspense"]
                    if description and not any(keyword in description for keyword in crime_keywords):
                        issues.append("Description doesn't mention crime/thriller keywords (expected for Indian Asur series)")
                    
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
    
    async def test_season_specific_enrichment(self) -> bool:
        """CRITICAL TEST: Verify season-specific data for Season 2 and Season 3 shows"""
        try:
            # Get buzzing content to find season-specific titles
            async with self.session.get(f"{self.base_url}/api/content?category=buzzing") as response:
                if response.status == 200:
                    content_list = await response.json()
                    
                    season_titles = {
                        "Squid Game Season 2": {
                            "expected_season": 2,
                            "expected_year_range": [2024, 2025],  # Season 2 air date
                            "expected_poster_different": True  # Should be different from Season 1
                        },
                        "Mirzapur Season 3": {
                            "expected_season": 3,
                            "expected_year_range": [2024, 2025],  # Season 3 air date
                            "expected_poster_different": True
                        },
                        "Asur Season 3": {
                            "expected_season": 3,
                            "expected_year_range": [2020, 2024],  # Could be original series year or season year
                            "expected_poster_different": True
                        }
                    }
                    
                    all_passed = True
                    season_results = []
                    
                    for item in content_list:
                        title = item.get("title", "")
                        
                        for season_title, expectations in season_titles.items():
                            if season_title in title:
                                issues = []
                                
                                # Check poster URL - should be TMDB, not placeholder
                                poster_url = item.get("poster_url", "")
                                if "unsplash" in poster_url.lower():
                                    issues.append("Using placeholder image instead of season-specific TMDB poster")
                                elif not poster_url.startswith("https://image.tmdb.org"):
                                    issues.append("Poster not from TMDB")
                                
                                # Check year - should be season air date, not original show year
                                year = item.get("year")
                                expected_range = expectations["expected_year_range"]
                                if year and (year < expected_range[0] or year > expected_range[1]):
                                    issues.append(f"Year {year} not in expected range {expected_range} for season air date")
                                
                                # Check episodes - should be season-specific count
                                episodes = item.get("episodes")
                                season_number = item.get("season_number")
                                
                                if season_number != expectations["expected_season"]:
                                    issues.append(f"Season number {season_number} vs expected {expectations['expected_season']}")
                                
                                # Check description - should be season-specific if available
                                description = item.get("description", "")
                                if not description or len(description) < 50:
                                    issues.append("Missing or too short season-specific description")
                                
                                # Check TMDB ID exists
                                tmdb_id = item.get("tmdb_id")
                                if not tmdb_id:
                                    issues.append("Missing TMDB ID for season-specific data")
                                
                                result = {
                                    "title": season_title,
                                    "poster_url": poster_url,
                                    "year": year,
                                    "episodes": episodes,
                                    "season_number": season_number,
                                    "tmdb_id": tmdb_id,
                                    "issues": issues,
                                    "passed": len(issues) == 0
                                }
                                season_results.append(result)
                                
                                if issues:
                                    all_passed = False
                                    self.log_test(f"Season-Specific Data - {season_title}", "FAIL", 
                                                f"Issues: {'; '.join(issues)}")
                                else:
                                    self.log_test(f"Season-Specific Data - {season_title}", "PASS", 
                                                f"✅ Season {expectations['expected_season']} data correct (Year: {year}, Episodes: {episodes}, TMDB: {tmdb_id})")
                    
                    # Summary of season-specific testing
                    if all_passed:
                        self.log_test("Season-Specific Enrichment Overall", "PASS", 
                                    f"All {len(season_results)} season titles have correct season-specific data")
                    else:
                        failed_titles = [r["title"] for r in season_results if not r["passed"]]
                        self.log_test("Season-Specific Enrichment Overall", "FAIL", 
                                    f"Failed titles: {', '.join(failed_titles)}")
                    
                    return all_passed
                        
                else:
                    error_text = await response.text()
                    self.log_test("Season-Specific Enrichment", "FAIL", 
                                f"HTTP {response.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Season-Specific Enrichment", "FAIL", f"Exception: {str(e)}")
            return False

    async def run_all_tests(self):
        """Run comprehensive season-specific enrichment tests"""
        print(f"🚀 Starting Season-Specific Enrichment Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Trigger re-enrichment for season-specific logic
        print("\n📋 Step 1: Triggering Content Re-Enrichment")
        enrichment_success = await self.test_enrich_all_content()
        
        # Test 2: CRITICAL - Season-Specific Data Verification
        print("\n📋 Step 2: CRITICAL Season-Specific Data Verification")
        season_success = await self.test_season_specific_enrichment()
        
        # Test 3: Get buzzing content for detailed verification
        print("\n📋 Step 3: Testing Buzzing Now Tray (Season Titles)")
        buzzing_content = await self.test_content_category("buzzing")
        
        # Test 4: Verify specific season titles individually
        print("\n📋 Step 4: Individual Season Title Verification")
        
        season_titles = [
            {
                "title": "Squid Game Season 2",
                "expected_year": 2024,  # Season 2 air date
                "expected_language": "Korean"
            },
            {
                "title": "Mirzapur Season 3", 
                "expected_year": 2024,  # Season 3 air date
                "expected_language": "Hindi"
            },
            {
                "title": "Asur Season 3",
                "expected_imdb_rating": 8.5,  # Around 8.5-8.6 for Indian series
                "expected_year": 2020,  # Original series year for TMDB search
                "expected_language": "Hindi"
            }
        ]
        
        for title_data in season_titles:
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