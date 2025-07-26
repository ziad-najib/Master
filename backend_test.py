#!/usr/bin/env python3
"""
E-commerce Backend API Testing Script
Tests all key endpoints for the e-commerce system with Arabic support
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Configuration
BASE_URL = "https://c80fd7e2-8bfd-4ebf-86bb-559c8a6bc8dc.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, data=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if data:
        print(f"Data: {json.dumps(data, indent=2, ensure_ascii=False)}")
    print("-" * 40)

def test_api_root():
    """Test the root API endpoint"""
    print_test_header("API Root Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "E-commerce API is running" in data.get('message', ''):
                print_result(True, "API root endpoint is working", data)
                return True
            else:
                print_result(False, f"Unexpected response: {data}")
                return False
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Connection error: {str(e)}")
        return False

def test_products_api():
    """Test the Products API - GET /api/products"""
    print_test_header("Products API - GET /api/products")
    
    try:
        response = requests.get(f"{BASE_URL}/products", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            products = response.json()
            
            if isinstance(products, list) and len(products) > 0:
                # Check first product structure
                product = products[0]
                required_fields = ['id', 'name', 'nameEn', 'price', 'category', 'categoryAr', 'rating', 'stock']
                
                missing_fields = [field for field in required_fields if field not in product]
                if missing_fields:
                    print_result(False, f"Missing required fields: {missing_fields}", product)
                    return False
                
                # Check for Arabic content
                has_arabic = any(field in product for field in ['name', 'categoryAr', 'description'])
                if not has_arabic:
                    print_result(False, "No Arabic content found in products")
                    return False
                
                # Check that MongoDB _id is not present
                if '_id' in product:
                    print_result(False, "MongoDB _id field found in response (should be removed)")
                    return False
                
                print_result(True, f"Products API working - {len(products)} products returned", {
                    'total_products': len(products),
                    'sample_product': {
                        'name': product.get('name'),
                        'nameEn': product.get('nameEn'),
                        'price': product.get('price'),
                        'category': product.get('category'),
                        'rating': product.get('rating')
                    }
                })
                return True
            else:
                print_result(False, "No products returned or invalid format")
                return False
                
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False

def test_categories_api():
    """Test the Categories API - GET /api/categories"""
    print_test_header("Categories API - GET /api/categories")
    
    try:
        response = requests.get(f"{BASE_URL}/categories", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            categories = response.json()
            
            if isinstance(categories, list) and len(categories) > 0:
                # Check first category structure
                category = categories[0]
                required_fields = ['id', 'name', 'nameEn', 'slug', 'active']
                
                missing_fields = [field for field in required_fields if field not in category]
                if missing_fields:
                    print_result(False, f"Missing required fields: {missing_fields}", category)
                    return False
                
                # Check for Arabic content
                if 'name' not in category or not category['name']:
                    print_result(False, "No Arabic name found in categories")
                    return False
                
                # Check that MongoDB _id is not present
                if '_id' in category:
                    print_result(False, "MongoDB _id field found in response (should be removed)")
                    return False
                
                # Check for expected categories
                category_slugs = [cat.get('slug') for cat in categories]
                expected_categories = ['electronics', 'clothing', 'food']
                found_categories = [cat for cat in expected_categories if cat in category_slugs]
                
                print_result(True, f"Categories API working - {len(categories)} categories returned", {
                    'total_categories': len(categories),
                    'found_categories': found_categories,
                    'sample_category': {
                        'name': category.get('name'),
                        'nameEn': category.get('nameEn'),
                        'slug': category.get('slug')
                    }
                })
                return True
            else:
                print_result(False, "No categories returned or invalid format")
                return False
                
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False

def test_create_user():
    """Test creating a new user - POST /api/users"""
    print_test_header("Users API - POST /api/users")
    
    # Generate test user data
    test_uid = f"test_user_{uuid.uuid4().hex[:8]}"
    user_data = {
        "uid": test_uid,
        "email": f"{test_uid}@example.com",
        "name": "أحمد محمد",
        "nameEn": "Ahmed Mohammed",
        "phone": "+966501234567",
        "walletBalance": 2000,
        "address": {
            "street": "شارع الملك فهد",
            "city": "الرياض",
            "country": "السعودية"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users", 
                               headers=HEADERS, 
                               json=user_data, 
                               timeout=10)
        
        if response.status_code == 200:
            created_user = response.json()
            
            # Check required fields
            required_fields = ['id', 'uid', 'email', 'name', 'walletBalance', 'createdAt']
            missing_fields = [field for field in required_fields if field not in created_user]
            
            if missing_fields:
                print_result(False, f"Missing required fields in response: {missing_fields}", created_user)
                return False, None
            
            # Check that MongoDB _id is not present
            if '_id' in created_user:
                print_result(False, "MongoDB _id field found in response (should be removed)")
                return False, None
            
            # Check wallet balance
            if created_user.get('walletBalance') != 2000:
                print_result(False, f"Expected wallet balance 2000, got {created_user.get('walletBalance')}")
                return False, None
            
            print_result(True, "User created successfully", {
                'uid': created_user.get('uid'),
                'name': created_user.get('name'),
                'email': created_user.get('email'),
                'walletBalance': created_user.get('walletBalance')
            })
            return True, test_uid
            
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False, None
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False, None

def test_get_user(uid):
    """Test retrieving a user by UID - GET /api/users/{uid}"""
    print_test_header(f"User Retrieval - GET /api/users/{uid}")
    
    if not uid:
        print_result(False, "No UID provided for user retrieval test")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/users/{uid}", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            user = response.json()
            
            # Check required fields
            required_fields = ['id', 'uid', 'email', 'name', 'walletBalance']
            missing_fields = [field for field in required_fields if field not in user]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}", user)
                return False
            
            # Check that MongoDB _id is not present
            if '_id' in user:
                print_result(False, "MongoDB _id field found in response (should be removed)")
                return False
            
            # Check UID matches
            if user.get('uid') != uid:
                print_result(False, f"UID mismatch: expected {uid}, got {user.get('uid')}")
                return False
            
            print_result(True, "User retrieved successfully", {
                'uid': user.get('uid'),
                'name': user.get('name'),
                'email': user.get('email'),
                'walletBalance': user.get('walletBalance')
            })
            return True
            
        elif response.status_code == 404:
            print_result(False, f"User not found: {response.json()}")
            return False
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False

def test_create_order(user_uid):
    """Test creating a new order - POST /api/orders"""
    print_test_header("Orders API - POST /api/orders")
    
    if not user_uid:
        print_result(False, "No user UID provided for order creation test")
        return False
    
    # Create test order data
    order_data = {
        "userId": user_uid,
        "items": [
            {
                "productId": "test_product_1",
                "name": "آيفون 15 برو",
                "price": 850000,
                "quantity": 1
            },
            {
                "productId": "test_product_2", 
                "name": "قميص قطني أنيق",
                "price": 25000,
                "quantity": 2
            }
        ],
        "total": 900000,
        "paymentMethod": "wallet",
        "shippingAddress": {
            "name": "أحمد محمد",
            "street": "شارع الملك فهد",
            "city": "الرياض",
            "country": "السعودية",
            "phone": "+966501234567"
        },
        "customerNotes": "يرجى التوصيل في المساء"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/orders", 
                               headers=HEADERS, 
                               json=order_data, 
                               timeout=10)
        
        if response.status_code == 200:
            order = response.json()
            
            # Check required fields
            required_fields = ['id', 'orderNumber', 'status', 'paymentStatus', 'total', 'items', 'userId']
            missing_fields = [field for field in required_fields if field not in order]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}", order)
                return False
            
            # Check that MongoDB _id is not present
            if '_id' in order:
                print_result(False, "MongoDB _id field found in response (should be removed)")
                return False
            
            # Check order details
            if order.get('total') != 900000:
                print_result(False, f"Total mismatch: expected 900000, got {order.get('total')}")
                return False
            
            if order.get('paymentMethod') != 'wallet':
                print_result(False, f"Payment method mismatch: expected 'wallet', got {order.get('paymentMethod')}")
                return False
            
            print_result(True, "Order created successfully", {
                'orderNumber': order.get('orderNumber'),
                'status': order.get('status'),
                'total': order.get('total'),
                'paymentMethod': order.get('paymentMethod'),
                'items_count': len(order.get('items', []))
            })
            return True
            
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False

def test_wallet_recharge(user_uid):
    """Test wallet recharge functionality - POST /api/wallet/recharge"""
    print_test_header("Wallet Recharge - POST /api/wallet/recharge")
    
    if not user_uid:
        print_result(False, "No user UID provided for wallet recharge test")
        return False
    
    # Test QR code recharge (should be completed immediately)
    recharge_data = {
        "userId": user_uid,
        "amount": 500000,
        "method": "qr_code",
        "reference": f"QR_{uuid.uuid4().hex[:8]}"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/wallet/recharge", 
                               headers=HEADERS, 
                               json=recharge_data, 
                               timeout=10)
        
        if response.status_code == 200:
            transaction = response.json()
            
            # Check required fields
            required_fields = ['id', 'type', 'method', 'amount', 'status', 'userId']
            missing_fields = [field for field in required_fields if field not in transaction]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}", transaction)
                return False
            
            # Check that MongoDB _id is not present
            if '_id' in transaction:
                print_result(False, "MongoDB _id field found in response (should be removed)")
                return False
            
            # Check transaction details
            if transaction.get('amount') != 500000:
                print_result(False, f"Amount mismatch: expected 500000, got {transaction.get('amount')}")
                return False
            
            if transaction.get('method') != 'qr_code':
                print_result(False, f"Method mismatch: expected 'qr_code', got {transaction.get('method')}")
                return False
            
            if transaction.get('status') != 'completed':
                print_result(False, f"Status should be 'completed' for QR code, got {transaction.get('status')}")
                return False
            
            print_result(True, "Wallet recharge successful", {
                'transaction_id': transaction.get('id'),
                'amount': transaction.get('amount'),
                'method': transaction.get('method'),
                'status': transaction.get('status')
            })
            return True
            
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False

def test_wallet_balance_after_operations(user_uid):
    """Test that wallet balance is correctly updated after order and recharge"""
    print_test_header("Wallet Balance Verification")
    
    if not user_uid:
        print_result(False, "No user UID provided for balance verification")
        return False
    
    try:
        # Get user to check final balance
        response = requests.get(f"{BASE_URL}/users/{user_uid}", headers=HEADERS, timeout=10)
        
        if response.status_code == 200:
            user = response.json()
            final_balance = user.get('walletBalance', 0)
            
            # Expected balance: 2000 (initial) - 900000 (order) + 500000 (recharge) = -398000
            expected_balance = 2000 - 900000 + 500000
            
            if final_balance == expected_balance:
                print_result(True, f"Wallet balance correctly updated", {
                    'initial_balance': 2000,
                    'order_deduction': -900000,
                    'recharge_addition': 500000,
                    'expected_balance': expected_balance,
                    'actual_balance': final_balance
                })
                return True
            else:
                print_result(False, f"Balance mismatch: expected {expected_balance}, got {final_balance}")
                return False
                
        else:
            print_result(False, f"Failed to retrieve user: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Request error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print(f"\n{'='*80}")
    print("E-COMMERCE BACKEND API TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"{'='*80}")
    
    results = {}
    test_user_uid = None
    
    # Test 1: API Root
    results['api_root'] = test_api_root()
    
    # Test 2: Products API
    results['products_api'] = test_products_api()
    
    # Test 3: Categories API  
    results['categories_api'] = test_categories_api()
    
    # Test 4: Create User
    user_created, test_user_uid = test_create_user()
    results['create_user'] = user_created
    
    # Test 5: Get User (only if user was created)
    if test_user_uid:
        results['get_user'] = test_get_user(test_user_uid)
        
        # Test 6: Create Order (only if user exists)
        results['create_order'] = test_create_order(test_user_uid)
        
        # Test 7: Wallet Recharge (only if user exists)
        results['wallet_recharge'] = test_wallet_recharge(test_user_uid)
        
        # Test 8: Verify wallet balance after operations
        results['wallet_balance_verification'] = test_wallet_balance_after_operations(test_user_uid)
    else:
        results['get_user'] = False
        results['create_order'] = False
        results['wallet_recharge'] = False
        results['wallet_balance_verification'] = False
    
    # Print summary
    print(f"\n{'='*80}")
    print("TEST SUMMARY")
    print(f"{'='*80}")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name.replace('_', ' ').title()}")
    
    print(f"\nOverall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the detailed output above.")
    
    return results

if __name__ == "__main__":
    run_all_tests()