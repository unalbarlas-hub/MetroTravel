"""
Metro Travel Platform API Tests
Tests for: Auth, Search, Hotels, Bookings, Admin endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hotel-connect-9.preview.emergentagent.com')

# Test credentials
TEST_ADMIN_EMAIL = "admin_metro_test@test.com"
TEST_ADMIN_PASSWORD = "adminpass123"
TEST_OWNER_EMAIL = "owner_metro_test@test.com"
TEST_OWNER_PASSWORD = "ownerpass123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="function")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_ADMIN_EMAIL,
        "password": TEST_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"Admin token obtained for role: admin")
        return token
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="function")
def owner_token(api_client):
    """Get hotel owner authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_OWNER_EMAIL,
        "password": TEST_OWNER_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"Owner token obtained for role: hotel_owner")
        return token
    pytest.skip("Hotel owner authentication failed")


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint returns correct info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Hotel Booking Platform API" in data["message"]
        print(f"SUCCESS: API root returns: {data}")
    
    def test_cities_endpoint(self, api_client):
        """Test cities endpoint returns Turkish cities"""
        response = api_client.get(f"{BASE_URL}/api/cities")
        assert response.status_code == 200
        data = response.json()
        assert "cities" in data
        assert len(data["cities"]) > 0
        
        # Verify Turkish language support
        istanbul = next((c for c in data["cities"] if c["code"] == "IST"), None)
        assert istanbul is not None
        assert istanbul["name"]["tr"] == "İstanbul"
        assert istanbul["name"]["en"] == "Istanbul"
        print(f"SUCCESS: Cities endpoint returns {len(data['cities'])} cities with TR translations")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_register_new_user(self, api_client):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_user_{timestamp}@example.com",
            "name": "Test User",
            "password": "testpass123",
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "token" in data
        assert data["role"] == "customer"
        print(f"SUCCESS: User registered with ID: {data['user_id']}")
    
    def test_register_hotel_owner(self, api_client):
        """Test hotel owner registration"""
        timestamp = int(datetime.now().timestamp())
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_owner_{timestamp}@example.com",
            "name": "Test Hotel Owner",
            "password": "testpass123",
            "role": "hotel_owner"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "hotel_owner"
        print(f"SUCCESS: Hotel owner registered with role: {data['role']}")
    
    def test_login_success(self, api_client):
        """Test successful login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        print(f"SUCCESS: Login successful for {data['email']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials correctly rejected")
    
    def test_get_current_user(self, api_client, admin_token):
        """Test getting current user info"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "role" in data
        print(f"SUCCESS: Current user: {data['email']} with role {data['role']}")


class TestHotelSearch:
    """Hotel search functionality tests"""
    
    def test_search_hotels_basic(self, api_client):
        """Test basic hotel search"""
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        response = api_client.post(f"{BASE_URL}/api/search", json={
            "check_in": check_in,
            "check_out": check_out,
            "adults": 2,
            "children": 0
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure uses 'results' key (not 'hotels')
        assert "results" in data
        assert "total" in data
        assert "page" in data
        print(f"SUCCESS: Search returned {data['total']} hotels in 'results' key")
    
    def test_search_hotels_by_city(self, api_client):
        """Test hotel search filtered by city"""
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        response = api_client.post(f"{BASE_URL}/api/search", json={
            "city": "Istanbul",
            "check_in": check_in,
            "check_out": check_out,
            "adults": 2,
            "children": 0
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        
        # Verify all results are in Istanbul
        for hotel in data["results"]:
            assert "Istanbul" in hotel["address"]["city"]
        print(f"SUCCESS: City filter returned {len(data['results'])} Istanbul hotels")
    
    def test_search_hotels_with_filters(self, api_client):
        """Test hotel search with star rating and price filters"""
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        response = api_client.post(f"{BASE_URL}/api/search", json={
            "check_in": check_in,
            "check_out": check_out,
            "adults": 2,
            "star_ratings": [4, 5],
            "min_price": 100,
            "max_price": 5000
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"SUCCESS: Filtered search returned {len(data['results'])} hotels")


class TestHotelDetails:
    """Hotel detail page tests"""
    
    def test_get_hotel_by_id(self, api_client):
        """Test getting hotel details by ID"""
        hotel_id = "hotel_f728dac2bdb4"  # Known test hotel
        response = api_client.get(f"{BASE_URL}/api/hotels/{hotel_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify hotel structure
        assert "hotel_id" in data
        assert "name" in data
        assert "address" in data
        assert "rooms" in data
        
        # Verify Turkish translations exist
        assert "tr" in data["name"]
        print(f"SUCCESS: Hotel details loaded with {len(data['rooms'])} rooms")
    
    def test_get_hotel_not_found(self, api_client):
        """Test getting non-existent hotel"""
        response = api_client.get(f"{BASE_URL}/api/hotels/nonexistent_hotel")
        assert response.status_code == 404
        print("SUCCESS: Non-existent hotel returns 404")
    
    def test_hotel_availability(self, api_client):
        """Test hotel room availability check"""
        hotel_id = "hotel_f728dac2bdb4"
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        response = api_client.get(
            f"{BASE_URL}/api/search/availability",
            params={
                "hotel_id": hotel_id,
                "check_in": check_in,
                "check_out": check_out,
                "adults": 2
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        print(f"SUCCESS: Availability check returned {len(data['rooms'])} available rooms")


class TestHotelManagement:
    """Hotel CRUD operations tests"""
    
    def test_list_hotels(self, api_client):
        """Test listing approved hotels"""
        response = api_client.get(f"{BASE_URL}/api/hotels")
        assert response.status_code == 200
        data = response.json()
        assert "hotels" in data
        assert "total" in data
        print(f"SUCCESS: Listed {data['total']} approved hotels")
    
    def test_get_owner_hotels(self, api_client, owner_token):
        """Test getting hotel owner's hotels"""
        response = api_client.get(
            f"{BASE_URL}/api/hotels/owner/my-hotels",
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "hotels" in data
        print(f"SUCCESS: Owner has {len(data['hotels'])} hotels")


class TestAdminEndpoints:
    """Admin panel API tests"""
    
    def test_admin_stats(self, api_client, admin_token):
        """Test admin statistics endpoint"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "hotels" in data
        assert "users" in data
        assert "bookings" in data
        assert "revenue" in data
        print(f"SUCCESS: Admin stats - Hotels: {data['hotels']['total']}, Users: {data['users']['total']}")
    
    def test_admin_list_hotels(self, api_client, admin_token):
        """Test admin hotel listing"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/hotels",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "hotels" in data
        assert "total" in data
        print(f"SUCCESS: Admin can list {data['total']} hotels")
    
    def test_admin_list_users(self, api_client, admin_token):
        """Test admin user listing"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"SUCCESS: Admin can list {data['total']} users")
    
    def test_admin_list_bookings(self, api_client, admin_token):
        """Test admin booking listing"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"SUCCESS: Admin can list {len(data['bookings'])} bookings")


class TestAmenities:
    """Amenities endpoint tests"""
    
    def test_get_amenities(self, api_client):
        """Test amenities listing"""
        response = api_client.get(f"{BASE_URL}/api/amenities")
        assert response.status_code == 200
        data = response.json()
        assert "room_amenities" in data
        assert "property_amenities" in data
        assert len(data["room_amenities"]) > 0
        assert len(data["property_amenities"]) > 0
        print(f"SUCCESS: {len(data['room_amenities'])} room amenities, {len(data['property_amenities'])} property amenities")


class TestBookings:
    """Booking flow tests"""
    
    def test_get_user_bookings(self, api_client, admin_token):
        """Test getting user's bookings"""
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"SUCCESS: User has {len(data['bookings'])} bookings")


class TestExtranetEndpoints:
    """Hotel extranet (owner panel) tests"""
    
    def test_extranet_bookings(self, api_client, owner_token):
        """Test extranet booking listing"""
        response = api_client.get(
            f"{BASE_URL}/api/extranet/bookings",
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"SUCCESS: Extranet shows {len(data['bookings'])} bookings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
