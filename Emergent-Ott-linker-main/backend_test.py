#!/usr/bin/env python3
"""
Backend API Testing for The Connector Deep Linking
Tests the /api/resolve-link endpoint with various platforms and scenarios
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from frontend .env
BACKEND_URL = "https://streamgrid-1.preview.emergentagent.com/api"

def test_api_endpoint(endpoint: str, params: Dict[str, Any] = None, method: str = "GET") -> Dict[str, Any]:
    """Test an API endpoint and return response data"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=params, timeout=10)
        
        print(f"\n{'='*60}")
        print(f"Testing: {method} {url}")
        if params:
            print(f"Params: {params}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
                return {"success": True, "data": data, "status_code": response.status_code}
            except json.JSONDecodeError:
                print(f"Response Text: {response.text}")
                return {"success": False, "error": "Invalid JSON response", "status_code": response.status_code}
        else:
            print(f"Error Response: {response.text}")
            return {"success": False, "error": response.text, "status_code": response.status_code}
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        return {"success": False, "error": str(e), "status_code": None}

def get_sample_content():
    """Get sample content from the database to use for testing"""
    print("\n" + "="*60)
    print("FETCHING SAMPLE CONTENT FOR TESTING")
    print("="*60)
    
    result = test_api_endpoint("/content")
    if result["success"] and result["data"]:
        content_list = result["data"]
        print(f"Found {len(content_list)} content items")
        
        # Group by platform for testing
        platforms = {}
        for content in content_list:
            platform = content.get("platform", "").lower()
            if platform not in platforms:
                platforms[platform] = []
            platforms[platform].append(content)
        
        print(f"Available platforms: {list(platforms.keys())}")
        return platforms
    else:
        print("Failed to fetch content or no content available")
        return {}

def test_resolve_link_endpoint():
    """Test the /api/resolve-link endpoint with various scenarios"""
    print("\n" + "="*60)
    print("TESTING /api/resolve-link ENDPOINT")
    print("="*60)
    
    # Get sample content first
    platforms = get_sample_content()
    
    if not platforms:
        print("No content available for testing. Creating test scenarios with provided IDs...")
        # Use the specific test cases from the review request
        test_cases = [
            {
                "title_id": "208c17e4-5087-4f0a-9234-352fac787bbe",
                "provider": "Netflix",
                "description": "Netflix content test"
            },
            {
                "title_id": "bf0a6d14-6e46-491b-8b62-5683e728d26b", 
                "provider": "Apple TV",
                "description": "Apple TV content test"
            },
            {
                "title_id": "c51d6ce2-fc47-412b-b0e5-d9d7962bc231",
                "provider": "SonyLIV", 
                "description": "SonyLIV content test"
            }
        ]
    else:
        # Create test cases from actual content
        test_cases = []
        priority_platforms = ["netflix", "apple tv", "sonyliv", "prime video", "jiohotstar"]
        
        for platform in priority_platforms:
            if platform in platforms and platforms[platform]:
                content = platforms[platform][0]  # Take first content item
                test_cases.append({
                    "title_id": content["id"],
                    "provider": content["platform"],
                    "description": f"{content['platform']} - {content['title']}"
                })
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i}: {test_case['description']} ---")
        
        params = {
            "title_id": test_case["title_id"],
            "provider": test_case["provider"],
            "country": "IN"
        }
        
        result = test_api_endpoint("/resolve-link", params)
        results.append({
            "test_case": test_case,
            "result": result
        })
        
        # Validate response structure if successful
        if result["success"]:
            data = result["data"]
            required_fields = ["url", "fallback_search_url", "provider"]
            optional_fields = ["scheme_url", "platform_content_id"]
            
            print(f"✓ Response structure validation:")
            for field in required_fields:
                if field in data:
                    print(f"  ✓ {field}: {data[field]}")
                else:
                    print(f"  ✗ Missing required field: {field}")
            
            for field in optional_fields:
                if field in data:
                    print(f"  ✓ {field}: {data[field]}")
                else:
                    print(f"  - {field}: Not present")
    
    return results

def test_error_handling():
    """Test error handling scenarios"""
    print("\n" + "="*60)
    print("TESTING ERROR HANDLING")
    print("="*60)
    
    error_test_cases = [
        {
            "description": "Invalid title_id",
            "params": {
                "title_id": "invalid-uuid-12345",
                "provider": "Netflix"
            },
            "expected_status": 404
        },
        {
            "description": "Missing title_id parameter",
            "params": {
                "provider": "Netflix"
            },
            "expected_status": 422
        },
        {
            "description": "Missing provider parameter", 
            "params": {
                "title_id": "208c17e4-5087-4f0a-9234-352fac787bbe"
            },
            "expected_status": 422
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(error_test_cases, 1):
        print(f"\n--- Error Test {i}: {test_case['description']} ---")
        
        result = test_api_endpoint("/resolve-link", test_case["params"])
        results.append({
            "test_case": test_case,
            "result": result
        })
        
        expected_status = test_case["expected_status"]
        actual_status = result["status_code"]
        
        if actual_status == expected_status:
            print(f"✓ Correct error status: {actual_status}")
        else:
            print(f"✗ Expected status {expected_status}, got {actual_status}")
    
    return results

def test_provider_variations():
    """Test provider name variations (case insensitivity)"""
    print("\n" + "="*60)
    print("TESTING PROVIDER NAME VARIATIONS")
    print("="*60)
    
    # Use a test title_id - try to get one from content first
    platforms = get_sample_content()
    
    if platforms and "netflix" in platforms:
        test_title_id = platforms["netflix"][0]["id"]
    else:
        test_title_id = "208c17e4-5087-4f0a-9234-352fac787bbe"  # Fallback to provided ID
    
    provider_variations = [
        "Netflix",
        "netflix", 
        "NETFLIX",
        "Apple TV",
        "apple tv",
        "APPLE TV"
    ]
    
    results = []
    
    for provider in provider_variations:
        print(f"\n--- Testing provider: '{provider}' ---")
        
        params = {
            "title_id": test_title_id,
            "provider": provider,
            "country": "IN"
        }
        
        result = test_api_endpoint("/resolve-link", params)
        results.append({
            "provider": provider,
            "result": result
        })
    
    return results

def test_api_health():
    """Test basic API health"""
    print("\n" + "="*60)
    print("TESTING API HEALTH")
    print("="*60)
    
    # Test root endpoint
    result = test_api_endpoint("/")
    return result

def main():
    """Run all backend tests"""
    print("STARTING BACKEND API TESTS FOR THE CONNECTOR")
    print("=" * 60)
    
    all_results = {
        "api_health": None,
        "resolve_link_tests": [],
        "error_handling_tests": [],
        "provider_variation_tests": []
    }
    
    try:
        # Test API health
        all_results["api_health"] = test_api_health()
        
        # Test resolve-link endpoint
        all_results["resolve_link_tests"] = test_resolve_link_endpoint()
        
        # Test error handling
        all_results["error_handling_tests"] = test_error_handling()
        
        # Test provider variations
        all_results["provider_variation_tests"] = test_provider_variations()
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        # API Health
        if all_results["api_health"] and all_results["api_health"]["success"]:
            print("✓ API Health: PASS")
        else:
            print("✗ API Health: FAIL")
        
        # Resolve Link Tests
        resolve_success = sum(1 for test in all_results["resolve_link_tests"] if test["result"]["success"])
        resolve_total = len(all_results["resolve_link_tests"])
        print(f"✓ Resolve Link Tests: {resolve_success}/{resolve_total} PASS")
        
        # Error Handling Tests
        error_success = sum(1 for test in all_results["error_handling_tests"] 
                          if test["result"]["status_code"] in [404, 422])
        error_total = len(all_results["error_handling_tests"])
        print(f"✓ Error Handling Tests: {error_success}/{error_total} PASS")
        
        # Provider Variation Tests
        provider_success = sum(1 for test in all_results["provider_variation_tests"] if test["result"]["success"])
        provider_total = len(all_results["provider_variation_tests"])
        print(f"✓ Provider Variation Tests: {provider_success}/{provider_total} PASS")
        
        # Overall Status
        total_tests = resolve_total + error_total + provider_total + 1
        total_success = resolve_success + error_success + provider_success + (1 if all_results["api_health"]["success"] else 0)
        
        print(f"\nOVERALL: {total_success}/{total_tests} tests passed")
        
        if total_success == total_tests:
            print("🎉 ALL TESTS PASSED!")
            return True
        else:
            print("❌ SOME TESTS FAILED")
            return False
            
    except Exception as e:
        print(f"Test execution failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)