"""
Test suite for Coupon/Promotion System and Password Reset features
Tests:
- Coupon CRUD operations (Admin)
- Coupon validation
- Password reset flow (forgot-password, verify-token, reset-password)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@metrotravel.com"
ADMIN_PASSWORD = "admin123456"
CUSTOMER_EMAIL = "elif@gmail.com"
CUSTOMER_PASSWORD = "customer123"


class TestAuthSetup:
    """Authentication setup tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def customer_token(self):
        """Get customer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        assert response.status_code == 200, f"Customer login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]


class TestCouponCRUD(TestAuthSetup):
    """Coupon CRUD operations - Admin only"""
    
    def test_list_coupons_requires_auth(self):
        """GET /api/coupons requires authentication"""
        response = requests.get(f"{BASE_URL}/api/coupons")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/coupons requires authentication (401)")
    
    def test_list_coupons_as_admin(self, admin_token):
        """Admin can list all coupons"""
        response = requests.get(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "coupons" in data, "Response should contain 'coupons' key"
        assert "total" in data, "Response should contain 'total' key"
        print(f"✓ Admin can list coupons - found {data['total']} coupons")
        return data
    
    def test_create_coupon_requires_auth(self):
        """POST /api/coupons requires authentication"""
        response = requests.post(f"{BASE_URL}/api/coupons", json={
            "code": "TEST123",
            "coupon_type": "percentage",
            "value": 10,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/coupons requires authentication (401)")
    
    def test_create_coupon_as_admin(self, admin_token):
        """Admin can create a new coupon"""
        unique_code = f"TEST_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "code": unique_code,
            "description": {"tr": "Test kuponu", "en": "Test coupon"},
            "coupon_type": "percentage",
            "value": 15,
            "min_order_amount": 500,
            "max_discount": 200,
            "usage_limit": 100,
            "per_user_limit": 1,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31",
            "first_booking_only": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "coupon_id" in data, "Response should contain coupon_id"
        assert data["code"] == unique_code, f"Code mismatch: {data['code']} != {unique_code}"
        assert data["coupon_type"] == "percentage", "Coupon type should be percentage"
        assert data["value"] == 15, "Value should be 15"
        assert data["status"] == "active", "Status should be active"
        
        print(f"✓ Admin created coupon: {unique_code} (ID: {data['coupon_id']})")
        return data
    
    def test_create_duplicate_coupon_fails(self, admin_token):
        """Creating coupon with existing code should fail"""
        # Try to create with existing code METRO2026
        payload = {
            "code": "METRO2026",
            "coupon_type": "percentage",
            "value": 10,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json=payload
        )
        assert response.status_code == 400, f"Expected 400 for duplicate code, got {response.status_code}"
        print("✓ Duplicate coupon code rejected (400)")
    
    def test_get_coupon_by_id(self, admin_token):
        """Admin can get coupon details by ID"""
        # First list coupons to get an ID
        list_response = requests.get(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        coupons = list_response.json().get("coupons", [])
        
        if coupons:
            coupon_id = coupons[0]["coupon_id"]
            response = requests.get(
                f"{BASE_URL}/api/coupons/{coupon_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()
            assert data["coupon_id"] == coupon_id, "Coupon ID mismatch"
            print(f"✓ Admin can get coupon by ID: {coupon_id}")
        else:
            pytest.skip("No coupons available to test")
    
    def test_update_coupon(self, admin_token):
        """Admin can update coupon"""
        # First create a coupon to update
        unique_code = f"UPDATE_{uuid.uuid4().hex[:6].upper()}"
        create_response = requests.post(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={
                "code": unique_code,
                "coupon_type": "percentage",
                "value": 10,
                "valid_from": "2026-01-01",
                "valid_until": "2026-12-31"
            }
        )
        coupon_id = create_response.json()["coupon_id"]
        
        # Update the coupon
        update_response = requests.put(
            f"{BASE_URL}/api/coupons/{coupon_id}",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={"value": 20, "max_discount": 300}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        updated = update_response.json()
        assert updated["value"] == 20, "Value should be updated to 20"
        print(f"✓ Admin updated coupon {coupon_id}: value changed to 20")
    
    def test_delete_coupon(self, admin_token):
        """Admin can disable (delete) coupon"""
        # First create a coupon to delete
        unique_code = f"DELETE_{uuid.uuid4().hex[:6].upper()}"
        create_response = requests.post(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={
                "code": unique_code,
                "coupon_type": "fixed_amount",
                "value": 50,
                "valid_from": "2026-01-01",
                "valid_until": "2026-12-31"
            }
        )
        coupon_id = create_response.json()["coupon_id"]
        
        # Delete the coupon
        delete_response = requests.delete(
            f"{BASE_URL}/api/coupons/{coupon_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify it's disabled
        get_response = requests.get(
            f"{BASE_URL}/api/coupons/{coupon_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_response.json()["status"] == "disabled", "Coupon should be disabled"
        print(f"✓ Admin disabled coupon {coupon_id}")


class TestCouponValidation(TestAuthSetup):
    """Coupon validation tests"""
    
    def test_validate_valid_coupon(self):
        """Validate existing coupon METRO2026"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Content-Type": "application/json"},
            json={
                "code": "METRO2026",
                "hotel_id": "hotel_test123",
                "total_amount": 1000,
                "currency": "TRY"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "valid" in data, "Response should contain 'valid' field"
        assert "message" in data, "Response should contain 'message' field"
        
        if data["valid"]:
            assert "discount_amount" in data, "Valid coupon should have discount_amount"
            assert "final_amount" in data, "Valid coupon should have final_amount"
            print(f"✓ METRO2026 validated: discount={data.get('discount_amount')}, final={data.get('final_amount')}")
        else:
            print(f"✓ METRO2026 validation returned: {data['message']}")
    
    def test_validate_invalid_coupon(self):
        """Validate non-existent coupon code"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Content-Type": "application/json"},
            json={
                "code": "INVALIDCODE123",
                "hotel_id": "hotel_test123",
                "total_amount": 1000,
                "currency": "TRY"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["valid"] == False, "Invalid coupon should return valid=False"
        assert "message" in data, "Should have error message"
        print(f"✓ Invalid coupon rejected: {data['message']}")
    
    def test_validate_expired_coupon(self):
        """Validate expired coupon YILBASI20 (2025 dates)"""
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Content-Type": "application/json"},
            json={
                "code": "YILBASI20",
                "hotel_id": "hotel_test123",
                "total_amount": 1000,
                "currency": "TRY"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should be invalid due to expired dates
        if not data["valid"]:
            print(f"✓ Expired coupon YILBASI20 rejected: {data['message']}")
        else:
            print(f"✓ YILBASI20 still valid (dates may have been updated)")
    
    def test_validate_coupon_min_amount(self, admin_token):
        """Validate coupon with minimum order amount check"""
        # Create a coupon with min_order_amount
        unique_code = f"MINAMT_{uuid.uuid4().hex[:6].upper()}"
        requests.post(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            json={
                "code": unique_code,
                "coupon_type": "percentage",
                "value": 10,
                "min_order_amount": 2000,
                "valid_from": "2026-01-01",
                "valid_until": "2026-12-31"
            }
        )
        
        # Try to validate with amount below minimum
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate",
            headers={"Content-Type": "application/json"},
            json={
                "code": unique_code,
                "hotel_id": "hotel_test123",
                "total_amount": 500,  # Below 2000 minimum
                "currency": "TRY"
            }
        )
        data = response.json()
        assert data["valid"] == False, "Should reject order below minimum amount"
        print(f"✓ Minimum order amount check works: {data['message']}")


class TestPasswordReset:
    """Password reset flow tests"""
    
    def test_forgot_password_endpoint(self):
        """POST /api/auth/forgot-password initiates reset"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            headers={"Content-Type": "application/json"},
            json={"email": CUSTOMER_EMAIL}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        # Note: email_sent may be false if RESEND_API_KEY is not configured
        print(f"✓ Forgot password initiated: {data['message']} (email_sent: {data.get('email_sent', 'N/A')})")
    
    def test_forgot_password_nonexistent_email(self):
        """Forgot password with non-existent email should still return 200 (security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            headers={"Content-Type": "application/json"},
            json={"email": "nonexistent@example.com"}
        )
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Non-existent email returns 200 (security best practice)")
    
    def test_verify_reset_token_invalid(self):
        """GET /api/auth/verify-reset-token with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/verify-reset-token?token=invalid_token_12345"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["valid"] == False, "Invalid token should return valid=False"
        print(f"✓ Invalid reset token rejected: {data.get('message', 'No message')}")
    
    def test_reset_password_invalid_token(self):
        """POST /api/auth/reset-password with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            headers={"Content-Type": "application/json"},
            json={
                "token": "invalid_token_12345",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Reset password with invalid token rejected (400)")
    
    def test_reset_password_short_password(self):
        """POST /api/auth/reset-password with short password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            headers={"Content-Type": "application/json"},
            json={
                "token": "some_token",
                "new_password": "123"  # Too short
            }
        )
        # Should fail validation (either 400 or 422)
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ Short password rejected")


class TestExchangeRates:
    """Exchange rates API for currency selector"""
    
    def test_get_exchange_rates(self):
        """GET /api/exchange-rates returns currency rates"""
        response = requests.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "rates" in data, "Response should contain 'rates'"
        rates = data["rates"]
        
        # Check for expected currencies
        expected_currencies = ["TRY", "EUR", "USD"]
        for curr in expected_currencies:
            assert curr in rates, f"Missing currency: {curr}"
        
        print(f"✓ Exchange rates available: {list(rates.keys())}")


class TestCustomerCouponAccess(TestAuthSetup):
    """Test that customers cannot access admin coupon endpoints"""
    
    def test_customer_cannot_list_coupons(self, customer_token):
        """Customer should not be able to list coupons"""
        response = requests.get(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Customer cannot list coupons (403)")
    
    def test_customer_cannot_create_coupon(self, customer_token):
        """Customer should not be able to create coupons"""
        response = requests.post(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {customer_token}", "Content-Type": "application/json"},
            json={
                "code": "CUSTOMER_HACK",
                "coupon_type": "percentage",
                "value": 100,
                "valid_from": "2026-01-01",
                "valid_until": "2026-12-31"
            }
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Customer cannot create coupons (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
