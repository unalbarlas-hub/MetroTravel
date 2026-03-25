"""
Test suite for Cancellation/Refund Workflow and Map View features
Tests:
- GET /api/markets - List of 20 markets
- GET /api/bookings/{id}/cancellation-info - Get refund preview
- POST /api/bookings/{id}/cancel - Cancel with refund calculation
- GET /api/cancellations - User's cancellation history
- GET /api/admin/cancellations - Admin cancellation list
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hotel-connect-9.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@metrotravel.com", "password": "admin123456"}
CUSTOMER_CREDS = {"email": "can@outlook.com", "password": "customer123"}


class TestMarkets:
    """Test GET /api/markets endpoint for map view"""
    
    def test_markets_returns_200(self):
        """Markets endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/markets returns 200")
    
    def test_markets_returns_20_markets(self):
        """Markets endpoint should return exactly 20 markets"""
        response = requests.get(f"{BASE_URL}/api/markets")
        data = response.json()
        assert "markets" in data, "Response should have 'markets' key"
        assert len(data["markets"]) == 20, f"Expected 20 markets, got {len(data['markets'])}"
        print(f"✓ GET /api/markets returns 20 markets")
    
    def test_markets_have_required_fields(self):
        """Each market should have code, name, currency, flag"""
        response = requests.get(f"{BASE_URL}/api/markets")
        data = response.json()
        
        required_fields = ["code", "name", "currency", "flag"]
        for market in data["markets"]:
            for field in required_fields:
                assert field in market, f"Market missing field: {field}"
        print("✓ All markets have required fields (code, name, currency, flag)")
    
    def test_markets_include_turkey(self):
        """Markets should include Turkey (TR) with TRY currency"""
        response = requests.get(f"{BASE_URL}/api/markets")
        data = response.json()
        
        tr_market = next((m for m in data["markets"] if m["code"] == "TR"), None)
        assert tr_market is not None, "Turkey (TR) market not found"
        assert tr_market["currency"] == "TRY", f"Turkey currency should be TRY, got {tr_market['currency']}"
        print("✓ Turkey (TR) market exists with TRY currency")


class TestCancellationInfo:
    """Test GET /api/bookings/{id}/cancellation-info endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_cancellation_info_requires_auth(self):
        """Cancellation info endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/bookings/booking_aecefefe74a6/cancellation-info")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/bookings/{id}/cancellation-info requires authentication (401)")
    
    def test_cancellation_info_returns_refund_preview(self, admin_token):
        """Cancellation info should return refund preview for valid booking"""
        response = requests.get(
            f"{BASE_URL}/api/bookings/booking_aecefefe74a6/cancellation-info",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "can_cancel" in data, "Response should have 'can_cancel' field"
        assert "refund_preview" in data, "Response should have 'refund_preview' field"
        assert "policy" in data, "Response should have 'policy' field"
        print("✓ GET /api/bookings/{id}/cancellation-info returns refund preview")
    
    def test_cancellation_info_has_correct_structure(self, admin_token):
        """Cancellation info should have correct response structure"""
        response = requests.get(
            f"{BASE_URL}/api/bookings/booking_aecefefe74a6/cancellation-info",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        
        # Check refund_preview structure
        refund_preview = data.get("refund_preview", {})
        assert "type" in refund_preview, "refund_preview should have 'type'"
        assert "refund_amount" in refund_preview, "refund_preview should have 'refund_amount'"
        assert "penalty_amount" in refund_preview, "refund_preview should have 'penalty_amount'"
        assert "message" in refund_preview, "refund_preview should have 'message'"
        
        # Check policy structure
        policy = data.get("policy", {})
        assert "free_cancellation_days" in policy, "policy should have 'free_cancellation_days'"
        assert "penalty_percentage" in policy, "policy should have 'penalty_percentage'"
        print("✓ Cancellation info has correct response structure")
    
    def test_cancellation_info_404_for_invalid_booking(self, admin_token):
        """Cancellation info should return 404 for non-existent booking"""
        response = requests.get(
            f"{BASE_URL}/api/bookings/booking_nonexistent/cancellation-info",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ GET /api/bookings/{id}/cancellation-info returns 404 for invalid booking")


class TestCancellationEndpoints:
    """Test cancellation list endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def customer_token(self):
        """Get customer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Customer authentication failed")
    
    def test_user_cancellations_requires_auth(self):
        """User cancellations endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/cancellations")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/cancellations requires authentication (401)")
    
    def test_user_cancellations_returns_list(self, customer_token):
        """User cancellations should return a list"""
        response = requests.get(
            f"{BASE_URL}/api/cancellations",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "cancellations" in data, "Response should have 'cancellations' key"
        assert isinstance(data["cancellations"], list), "cancellations should be a list"
        print(f"✓ GET /api/cancellations returns list (count: {len(data['cancellations'])})")
    
    def test_admin_cancellations_requires_admin(self, customer_token):
        """Admin cancellations endpoint should require admin role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cancellations",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        # Customer is actually hotel_owner, so should get 403
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ GET /api/admin/cancellations requires admin role (403)")
    
    def test_admin_cancellations_returns_list(self, admin_token):
        """Admin cancellations should return a list with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cancellations",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "cancellations" in data, "Response should have 'cancellations' key"
        assert "total" in data, "Response should have 'total' key"
        assert "page" in data, "Response should have 'page' key"
        print(f"✓ GET /api/admin/cancellations returns list with pagination (total: {data['total']})")


class TestCancelBookingFlow:
    """Test POST /api/bookings/{id}/cancel endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_cancel_booking_requires_auth(self):
        """Cancel booking endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/bookings/booking_test/cancel")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/bookings/{id}/cancel requires authentication (401)")
    
    def test_cancel_booking_404_for_invalid(self, admin_token):
        """Cancel booking should return 404 for non-existent booking"""
        response = requests.post(
            f"{BASE_URL}/api/bookings/booking_nonexistent/cancel",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ POST /api/bookings/{id}/cancel returns 404 for invalid booking")
    
    def test_cancel_booking_success(self, admin_token):
        """Cancel booking should work for valid booking with full refund"""
        # First check if booking is already cancelled
        info_response = requests.get(
            f"{BASE_URL}/api/bookings/booking_aecefefe74a6/cancellation-info",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if info_response.status_code == 200:
            info_data = info_response.json()
            if not info_data.get("can_cancel", True):
                print("⚠ Booking already cancelled, skipping cancel test")
                pytest.skip("Booking already cancelled")
        
        # Perform cancellation
        response = requests.post(
            f"{BASE_URL}/api/bookings/booking_aecefefe74a6/cancel",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Could be 200 (success) or 400 (already cancelled)
        if response.status_code == 200:
            data = response.json()
            assert "cancellation_id" in data, "Response should have 'cancellation_id'"
            assert "refund_status" in data, "Response should have 'refund_status'"
            assert "refund_amount" in data, "Response should have 'refund_amount'"
            print(f"✓ POST /api/bookings/{{}}/cancel successful - refund: {data['refund_amount']} {data.get('currency', 'TRY')}")
        elif response.status_code == 400:
            data = response.json()
            assert "already cancelled" in data.get("detail", "").lower(), "Should indicate already cancelled"
            print("✓ POST /api/bookings/{id}/cancel correctly rejects already cancelled booking")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestSearchForMapView:
    """Test search endpoint that provides data for map view"""
    
    def test_search_istanbul_returns_hotels(self):
        """Search for Istanbul should return hotels for map view"""
        # Calculate dates for search
        check_in = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=31)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/search",
            json={
                "city": "Istanbul",
                "check_in": check_in,
                "check_out": check_out,
                "adults": 2,
                "children": 0
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "results" in data, "Response should have 'results' key"
        assert "total" in data, "Response should have 'total' key"
        print(f"✓ Search Istanbul returns {data['total']} hotels for map view")
    
    def test_search_results_have_map_data(self):
        """Search results should have data needed for map markers"""
        check_in = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=31)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/search",
            json={
                "city": "Istanbul",
                "check_in": check_in,
                "check_out": check_out,
                "adults": 2
            }
        )
        data = response.json()
        
        if data.get("results"):
            hotel = data["results"][0]
            # Check for fields needed by HotelMap component
            assert "hotel_id" in hotel, "Hotel should have 'hotel_id'"
            assert "name" in hotel, "Hotel should have 'name'"
            assert "min_price" in hotel, "Hotel should have 'min_price' for map markers"
            assert "address" in hotel, "Hotel should have 'address'"
            print("✓ Search results have required fields for map view (hotel_id, name, min_price, address)")
        else:
            print("⚠ No hotels found in Istanbul, skipping map data validation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
