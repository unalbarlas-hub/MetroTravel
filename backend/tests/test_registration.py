"""
Test Hotel and Agency Registration APIs
Tests the registration flows and user role upgrades
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hotel-connect-9.preview.emergentagent.com')

class TestHotelRegistration:
    """Hotel Registration API Tests"""
    
    @pytest.fixture
    def fresh_customer(self):
        """Create a fresh customer user for testing"""
        timestamp = int(time.time() * 1000)
        email = f"test_hotel_{timestamp}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "test123456",
            "name": "Test Hotel Customer",
            "role": "customer"
        })
        assert response.status_code == 200, f"Failed to create customer: {response.text}"
        data = response.json()
        return {"token": data["token"], "user_id": data["user_id"], "email": email}
    
    def test_hotel_registration_success(self, fresh_customer):
        """Test successful hotel registration with simple JSON"""
        token = fresh_customer["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/hotels/register",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": "Test Hotel Registration",
                "property_type": "hotel",
                "star_rating": 4,
                "city": "Istanbul",
                "description": "A test hotel for registration testing"
            }
        )
        
        assert response.status_code == 200, f"Hotel registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "hotel_id" in data, "Response should contain hotel_id"
        assert "message" in data, "Response should contain message"
        assert data["status"] == "pending", "Hotel status should be pending"
        assert data["hotel_id"].startswith("hotel_"), "Hotel ID should start with 'hotel_'"
    
    def test_hotel_registration_with_full_data(self, fresh_customer):
        """Test hotel registration with all optional fields"""
        token = fresh_customer["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/hotels/register",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": "Full Data Test Hotel",
                "name_translations": {"tr": "Tam Veri Test Oteli", "de": "Vollständige Daten Testhotel"},
                "property_type": "boutique_hotel",
                "star_rating": 5,
                "city": "Antalya",
                "district": "Konyaaltı",
                "street_address": "Test Street 123",
                "postal_code": "07000",
                "country": "Turkey",
                "description": "A luxury boutique hotel",
                "description_translations": {"tr": "Lüks butik otel", "de": "Luxus Boutique Hotel"},
                "amenities": ["wifi", "pool", "spa", "gym"],
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "contact_email": "test@hotel.com",
                "contact_phone": "+905551234567",
                "website": "https://testhotel.com"
            }
        )
        
        assert response.status_code == 200, f"Hotel registration failed: {response.text}"
        data = response.json()
        assert "hotel_id" in data
    
    def test_hotel_registration_upgrades_user_role(self, fresh_customer):
        """Test that hotel registration upgrades customer to hotel_owner"""
        token = fresh_customer["token"]
        
        # Verify initial role is customer
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        initial_role = me_response.json()["role"]
        assert initial_role == "customer", f"Initial role should be customer, got {initial_role}"
        
        # Register hotel
        response = requests.post(
            f"{BASE_URL}/api/hotels/register",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": "Role Upgrade Test Hotel",
                "property_type": "hotel",
                "star_rating": 3,
                "city": "Izmir",
                "description": "Testing role upgrade"
            }
        )
        assert response.status_code == 200
        
        # Verify role was upgraded
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        new_role = me_response.json()["role"]
        assert new_role == "hotel_owner", f"Role should be upgraded to hotel_owner, got {new_role}"
    
    def test_hotel_registration_requires_auth(self):
        """Test that hotel registration requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/hotels/register",
            headers={"Content-Type": "application/json"},
            json={
                "name": "Unauthorized Test Hotel",
                "property_type": "hotel",
                "star_rating": 3,
                "city": "Ankara",
                "description": "Should fail without auth"
            }
        )
        assert response.status_code == 401, "Should return 401 without authentication"


class TestAgencyRegistration:
    """Agency Registration API Tests"""
    
    @pytest.fixture
    def fresh_customer(self):
        """Create a fresh customer user for testing"""
        timestamp = int(time.time() * 1000)
        email = f"test_agency_{timestamp}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "test123456",
            "name": "Test Agency Customer",
            "role": "customer"
        })
        assert response.status_code == 200, f"Failed to create customer: {response.text}"
        data = response.json()
        return {"token": data["token"], "user_id": data["user_id"], "email": email}
    
    def test_agency_registration_success(self, fresh_customer):
        """Test successful agency registration"""
        token = fresh_customer["token"]
        timestamp = int(time.time() * 1000)
        
        response = requests.post(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": f"Test Agency {timestamp}",
                "contact_person": "Test Person",
                "email": f"agency_{timestamp}@test.com",
                "phone": "+905551234567",
                "city": "Istanbul",
                "country": "Turkey",
                "tax_number": f"TAX{timestamp}"
            }
        )
        
        assert response.status_code == 200, f"Agency registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "agency_id" in data, "Response should contain agency_id"
        assert data["agency_id"].startswith("agency_"), "Agency ID should start with 'agency_'"
        assert data["status"] == "pending", "Agency status should be pending"
        assert data["name"] == f"Test Agency {timestamp}"
        assert data["contact_person"] == "Test Person"
        assert data["city"] == "Istanbul"
    
    def test_agency_registration_with_optional_fields(self, fresh_customer):
        """Test agency registration with all optional fields"""
        token = fresh_customer["token"]
        timestamp = int(time.time() * 1000)
        
        response = requests.post(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": f"Full Agency {timestamp}",
                "contact_person": "Full Test Person",
                "email": f"fullagency_{timestamp}@test.com",
                "phone": "+905559876543",
                "address": "Test Address 123, Floor 5",
                "city": "Ankara",
                "country": "Turkey",
                "tax_number": f"FULLTAX{timestamp}",
                "website": "https://testagency.com"
            }
        )
        
        assert response.status_code == 200, f"Agency registration failed: {response.text}"
        data = response.json()
        assert data["address"] == "Test Address 123, Floor 5"
        assert data["website"] == "https://testagency.com"
    
    def test_agency_registration_upgrades_user_role(self, fresh_customer):
        """Test that agency registration upgrades customer to agency_owner"""
        token = fresh_customer["token"]
        timestamp = int(time.time() * 1000)
        
        # Verify initial role is customer
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        initial_role = me_response.json()["role"]
        assert initial_role == "customer", f"Initial role should be customer, got {initial_role}"
        
        # Register agency
        response = requests.post(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": f"Role Test Agency {timestamp}",
                "contact_person": "Role Test Person",
                "email": f"roleagency_{timestamp}@test.com",
                "phone": "+905551112233",
                "city": "Bursa",
                "country": "Turkey",
                "tax_number": f"ROLETAX{timestamp}"
            }
        )
        assert response.status_code == 200
        
        # Verify role was upgraded
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert user_data["role"] == "agency_owner", f"Role should be upgraded to agency_owner, got {user_data['role']}"
        assert user_data["agency_id"] is not None, "User should have agency_id after registration"
    
    def test_agency_registration_requires_auth(self):
        """Test that agency registration requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/agencies",
            headers={"Content-Type": "application/json"},
            json={
                "name": "Unauthorized Agency",
                "contact_person": "Test Person",
                "email": "unauth@test.com",
                "phone": "+905551234567",
                "city": "Istanbul",
                "country": "Turkey",
                "tax_number": "UNAUTHTAX"
            }
        )
        assert response.status_code == 401, "Should return 401 without authentication"
    
    def test_agency_duplicate_email_rejected(self, fresh_customer):
        """Test that duplicate agency email is rejected"""
        token = fresh_customer["token"]
        timestamp = int(time.time() * 1000)
        email = f"duplicate_{timestamp}@test.com"
        
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "name": f"First Agency {timestamp}",
                "contact_person": "First Person",
                "email": email,
                "phone": "+905551234567",
                "city": "Istanbul",
                "country": "Turkey",
                "tax_number": f"FIRST{timestamp}"
            }
        )
        assert response1.status_code == 200
        
        # Create another customer for second registration attempt
        timestamp2 = int(time.time() * 1000) + 1
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"second_customer_{timestamp2}@test.com",
            "password": "test123456",
            "name": "Second Customer",
            "role": "customer"
        })
        token2 = reg_response.json()["token"]
        
        # Second registration with same agency email should fail
        response2 = requests.post(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {token2}", "Content-Type": "application/json"},
            json={
                "name": f"Second Agency {timestamp}",
                "contact_person": "Second Person",
                "email": email,  # Same email
                "phone": "+905559876543",
                "city": "Ankara",
                "country": "Turkey",
                "tax_number": f"SECOND{timestamp}"
            }
        )
        assert response2.status_code == 400, "Should reject duplicate agency email"


class TestAuthEndpoints:
    """Test authentication endpoints used by registration flows"""
    
    def test_login_with_valid_credentials(self):
        """Test login with valid customer credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "can@outlook.com", "password": "customer123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["email"] == "can@outlook.com"
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
    
    def test_register_new_user(self):
        """Test registering a new user"""
        timestamp = int(time.time() * 1000)
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"newuser_{timestamp}@test.com",
                "password": "test123456",
                "name": "New Test User",
                "role": "customer"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        assert data["role"] == "customer"
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "can@outlook.com", "password": "customer123"}
        )
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "role" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
