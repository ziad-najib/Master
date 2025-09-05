#!/usr/bin/env python3
"""
MongoDB Connection Diagnostic Test
Tests the MongoDB connection issues mentioned in the review request
"""

import requests
import json
import time
import concurrent.futures
import os

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://souqonline.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

def test_single_request(endpoint, request_id):
    """Test a single API request"""
    try:
        response = requests.get(f"{API_BASE}/{endpoint}", timeout=10)
        return {
            'request_id': request_id,
            'endpoint': endpoint,
            'status_code': response.status_code,
            'success': response.status_code == 200,
            'error': None if response.status_code == 200 else response.text
        }
    except Exception as e:
        return {
            'request_id': request_id,
            'endpoint': endpoint,
            'status_code': None,
            'success': False,
            'error': str(e)
        }

def test_concurrent_requests():
    """Test concurrent requests to identify race conditions"""
    print("🔍 Testing Concurrent Requests (Race Condition Detection)")
    print("=" * 60)
    
    endpoints = ['products', 'categories', 'products', 'categories'] * 5  # 20 requests total
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(test_single_request, endpoint, i) 
                  for i, endpoint in enumerate(endpoints)]
        
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    # Analyze results
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    print(f"✅ Successful requests: {len(successful)}/{len(results)}")
    print(f"❌ Failed requests: {len(failed)}/{len(results)}")
    
    if failed:
        print("\n🚨 FAILED REQUESTS:")
        for failure in failed:
            print(f"   Request {failure['request_id']} ({failure['endpoint']}): {failure['error']}")
    
    return len(failed) == 0

def test_rapid_sequential_requests():
    """Test rapid sequential requests"""
    print("\n🔍 Testing Rapid Sequential Requests")
    print("=" * 60)
    
    endpoints = ['products', 'categories'] * 10  # 20 requests
    results = []
    
    for i, endpoint in enumerate(endpoints):
        result = test_single_request(endpoint, i)
        results.append(result)
        time.sleep(0.1)  # Small delay between requests
    
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    print(f"✅ Successful requests: {len(successful)}/{len(results)}")
    print(f"❌ Failed requests: {len(failed)}/{len(results)}")
    
    if failed:
        print("\n🚨 FAILED REQUESTS:")
        for failure in failed:
            print(f"   Request {failure['request_id']} ({failure['endpoint']}): {failure['error']}")
    
    return len(failed) == 0

def test_mongodb_connection_stability():
    """Test MongoDB connection stability over time"""
    print("\n🔍 Testing MongoDB Connection Stability")
    print("=" * 60)
    
    test_duration = 30  # seconds
    request_interval = 2  # seconds
    start_time = time.time()
    results = []
    
    request_count = 0
    while time.time() - start_time < test_duration:
        # Alternate between products and categories
        endpoint = 'products' if request_count % 2 == 0 else 'categories'
        
        result = test_single_request(endpoint, request_count)
        results.append(result)
        
        print(f"   Request {request_count}: {endpoint} -> {'✅' if result['success'] else '❌'}")
        
        request_count += 1
        time.sleep(request_interval)
    
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    print(f"\n📊 Stability Test Results:")
    print(f"   Duration: {test_duration} seconds")
    print(f"   Total requests: {len(results)}")
    print(f"   ✅ Successful: {len(successful)}")
    print(f"   ❌ Failed: {len(failed)}")
    print(f"   Success rate: {len(successful)/len(results)*100:.1f}%")
    
    if failed:
        print("\n🚨 FAILED REQUESTS:")
        for failure in failed:
            print(f"   Request {failure['request_id']} ({failure['endpoint']}): {failure['error']}")
    
    return len(failed) == 0

def test_specific_mongodb_error():
    """Test for the specific 'Cannot read properties of undefined' error"""
    print("\n🔍 Testing for Specific MongoDB Error")
    print("=" * 60)
    
    # Make multiple requests to products endpoint to try to trigger the error
    error_found = False
    for i in range(20):
        try:
            response = requests.get(f"{API_BASE}/products", timeout=10)
            
            if response.status_code == 500:
                error_text = response.text
                if "Cannot read properties of undefined" in error_text and "collection" in error_text:
                    print(f"🎯 FOUND THE ERROR on request {i+1}!")
                    print(f"   Status: {response.status_code}")
                    print(f"   Error: {error_text}")
                    error_found = True
                    break
                else:
                    print(f"   Request {i+1}: Different 500 error - {error_text}")
            elif response.status_code == 200:
                print(f"   Request {i+1}: ✅ Success")
            else:
                print(f"   Request {i+1}: Status {response.status_code}")
                
        except Exception as e:
            print(f"   Request {i+1}: Exception - {str(e)}")
        
        time.sleep(0.5)  # Small delay between requests
    
    if not error_found:
        print("ℹ️  Specific MongoDB error not reproduced in 20 attempts")
    
    return error_found

def main():
    """Run all MongoDB connection tests"""
    print("🧪 MONGODB CONNECTION DIAGNOSTIC TESTS")
    print("=" * 80)
    print(f"🔗 API Base URL: {API_BASE}")
    print("=" * 80)
    
    test_results = {}
    
    # Test 1: Concurrent requests (race conditions)
    test_results['concurrent'] = test_concurrent_requests()
    
    # Test 2: Rapid sequential requests
    test_results['sequential'] = test_rapid_sequential_requests()
    
    # Test 3: Connection stability over time
    test_results['stability'] = test_mongodb_connection_stability()
    
    # Test 4: Try to reproduce specific error
    test_results['specific_error'] = test_specific_mongodb_error()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 DIAGNOSTIC TEST SUMMARY")
    print("=" * 80)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper()}: {status}")
    
    failed_tests = [name for name, result in test_results.items() if not result]
    
    if failed_tests:
        print(f"\n🚨 ISSUES DETECTED:")
        print("- MongoDB connection instability found")
        print("- Potential race conditions in connection handling")
        print("- Database object may be undefined under certain conditions")
        print("\n💡 RECOMMENDED FIXES:")
        print("1. Add proper connection pooling")
        print("2. Implement connection retry logic")
        print("3. Add null checks for database object")
        print("4. Use connection singleton pattern")
    else:
        print("\n✅ All diagnostic tests passed - MongoDB connection appears stable")
    
    return len(failed_tests) == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)