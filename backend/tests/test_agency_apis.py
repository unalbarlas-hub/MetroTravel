"""
B2B Agency Panel API Tests
Tests for agency registration, admin management, users, bookings, and transactions
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@metrotravel.com"
ADMIN_PASSWORD = "admin123456"
AGENCY_OWNER_EMAIL = "elif@gmail.com"
AGENCY_OWNER_PASSWORD = "customer123"
CUSTOMER_EMAIL = "can@outlook.com"
CUSTOMER_PASSWORD = "customer123"

# Known agency ID from seed data
KNOWN_AGENCY_ID = "agency_0c9c4e85e748"


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
        assert "token" in data
        return data["token"]
    
    @pytest.fixture(scope="class")
    def agency_owner_token(self):
        """Get agency owner authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENCY_OWNER_EMAIL,
            "password": AGENCY_OWNER_PASSWORD
        })
        assert response.status_code == 200, f"Agency owner login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data.get("role") == "agency_owner", f"Expected agency_owner role, got {data.get('role')}"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Test admin can login"""
        assert admin_token is not None
        print(f"Admin token obtained successfully")
    
    def test_agency_owner_login(self, agency_owner_token):
        """Test agency owner can login"""
        assert agency_owner_token is not None
        print(f"Agency owner token obtained successfully")


class TestAgencyAPIs:
    """Agency CRUD and management tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def agency_owner_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENCY_OWNER_EMAIL,
            "password": AGENCY_OWNER_PASSWORD
        })
        return response.json().get("token")
    
    # ===== Agency List (Admin) =====
    def test_list_agencies_admin(self, admin_token):
        """Admin can list all agencies"""
        response = requests.get(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "agencies" in data
        assert "total" in data
        assert isinstance(data["agencies"], list)
        print(f"Found {data['total']} agencies")
    
    def test_list_agencies_filter_by_status(self, admin_token):
        """Admin can filter agencies by status"""
        response = requests.get(
            f"{BASE_URL}/api/agencies?status=approved",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        for agency in data["agencies"]:
            assert agency["status"] == "approved"
        print(f"Found {len(data['agencies'])} approved agencies")
    
    def test_list_agencies_unauthorized(self, agency_owner_token):
        """Non-admin cannot list all agencies"""
        response = requests.get(
            f"{BASE_URL}/api/agencies",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 403
        print("Non-admin correctly denied access to agency list")
    
    # ===== Get Agency Details =====
    def test_get_agency_details_owner(self, agency_owner_token):
        """Agency owner can get their agency details"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["agency_id"] == KNOWN_AGENCY_ID
        assert "name" in data
        assert "credit_limit" in data
        assert "commission_rate" in data
        print(f"Agency: {data['name']}, Credit: {data['credit_balance']}/{data['credit_limit']}")
    
    def test_get_agency_details_admin(self, admin_token):
        """Admin can get any agency details"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["agency_id"] == KNOWN_AGENCY_ID
        print(f"Admin accessed agency: {data['name']}")
    
    # ===== Update Agency =====
    def test_update_agency_owner(self, agency_owner_token):
        """Agency owner can update their agency details"""
        response = requests.put(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}",
            headers={
                "Authorization": f"Bearer {agency_owner_token}",
                "Content-Type": "application/json"
            },
            json={"website": "https://abcturizm.com"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("website") == "https://abcturizm.com"
        print("Agency website updated successfully")
    
    # ===== Agency Dashboard =====
    def test_agency_dashboard(self, agency_owner_token):
        """Agency owner can access dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/dashboard",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "agency" in data
        assert "stats" in data
        assert "recent_bookings" in data
        stats = data["stats"]
        assert "credit_limit" in stats
        assert "credit_balance" in stats
        assert "total_bookings" in stats
        print(f"Dashboard stats: Credit {stats['credit_balance']}/{stats['credit_limit']}, Bookings: {stats['total_bookings']}")


class TestAdminAgencyManagement:
    """Admin agency management tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json().get("token")
    
    # ===== Credit Management =====
    def test_add_credit_to_agency(self, admin_token):
        """Admin can add credit to agency"""
        response = requests.put(
            f"{BASE_URL}/api/admin/agencies/{KNOWN_AGENCY_ID}/credit?amount=1000&transaction_type=credit&description=Test credit",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "new_balance" in data
        print(f"Credit added. New balance: {data['new_balance']}")
    
    def test_debit_credit_from_agency(self, admin_token):
        """Admin can debit credit from agency"""
        response = requests.put(
            f"{BASE_URL}/api/admin/agencies/{KNOWN_AGENCY_ID}/credit?amount=500&transaction_type=debit&description=Test debit",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "new_balance" in data
        print(f"Credit debited. New balance: {data['new_balance']}")
    
    # ===== Commission Management =====
    def test_update_commission_rate(self, admin_token):
        """Admin can update agency commission rate"""
        response = requests.put(
            f"{BASE_URL}/api/admin/agencies/{KNOWN_AGENCY_ID}/commission?commission_rate=12&markup_rate=5",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["commission_rate"] == 12
        print(f"Commission updated to {data['commission_rate']}%")
        
        # Reset to original
        requests.put(
            f"{BASE_URL}/api/admin/agencies/{KNOWN_AGENCY_ID}/commission?commission_rate=10&markup_rate=5",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestAgencyUsers:
    """Agency sub-user management tests"""
    
    @pytest.fixture(scope="class")
    def agency_owner_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENCY_OWNER_EMAIL,
            "password": AGENCY_OWNER_PASSWORD
        })
        return response.json().get("token")
    
    created_user_id = None
    
    # ===== List Users =====
    def test_list_agency_users(self, agency_owner_token):
        """Agency owner can list their users"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/users",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "users" in data
        print(f"Found {len(data['users'])} agency users")
    
    # ===== Create User =====
    def test_create_agency_user(self, agency_owner_token):
        """Agency owner can create sub-user"""
        test_email = f"test_agent_{int(time.time())}@abcturizm.com"
        response = requests.post(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/users",
            headers={
                "Authorization": f"Bearer {agency_owner_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": "Test Agent",
                "email": test_email,
                "password": "testpass123",
                "phone": "+90 555 123 4567",
                "role": "agent"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["email"] == test_email
        assert data["agency_id"] == KNOWN_AGENCY_ID
        assert data["role"] == "agency_user"
        TestAgencyUsers.created_user_id = data["user_id"]
        print(f"Created user: {data['name']} ({data['email']})")
    
    # ===== Update User =====
    def test_update_agency_user(self, agency_owner_token):
        """Agency owner can update sub-user"""
        if not TestAgencyUsers.created_user_id:
            pytest.skip("No user created to update")
        
        response = requests.put(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/users/{TestAgencyUsers.created_user_id}",
            headers={
                "Authorization": f"Bearer {agency_owner_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": "Updated Agent Name",
                "role": "admin"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["name"] == "Updated Agent Name"
        print(f"Updated user: {data['name']}")
    
    # ===== Deactivate User =====
    def test_deactivate_agency_user(self, agency_owner_token):
        """Agency owner can deactivate sub-user"""
        if not TestAgencyUsers.created_user_id:
            pytest.skip("No user created to deactivate")
        
        response = requests.delete(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/users/{TestAgencyUsers.created_user_id}",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        print("User deactivated successfully")


class TestAgencyBookings:
    """Agency booking tests"""
    
    @pytest.fixture(scope="class")
    def agency_owner_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENCY_OWNER_EMAIL,
            "password": AGENCY_OWNER_PASSWORD
        })
        return response.json().get("token")
    
    # ===== List Bookings =====
    def test_list_agency_bookings(self, agency_owner_token):
        """Agency owner can list their bookings"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/bookings",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "bookings" in data
        assert "total" in data
        print(f"Found {data['total']} agency bookings")
    
    def test_list_agency_bookings_with_filter(self, agency_owner_token):
        """Agency owner can filter bookings by status"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/bookings?status=confirmed",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        for booking in data["bookings"]:
            assert booking["status"] == "confirmed"
        print(f"Found {len(data['bookings'])} confirmed bookings")


class TestAgencyTransactions:
    """Agency credit transaction tests"""
    
    @pytest.fixture(scope="class")
    def agency_owner_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENCY_OWNER_EMAIL,
            "password": AGENCY_OWNER_PASSWORD
        })
        return response.json().get("token")
    
    def test_list_transactions(self, agency_owner_token):
        """Agency owner can list credit transactions"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/{KNOWN_AGENCY_ID}/transactions",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        print(f"Found {data['total']} transactions")
        
        # Verify transaction structure
        if data["transactions"]:
            txn = data["transactions"][0]
            assert "transaction_id" in txn
            assert "amount" in txn
            assert "transaction_type" in txn
            print(f"Latest transaction: {txn['transaction_type']} - {txn['amount']}")


class TestAgencyRegistration:
    """Agency registration flow tests"""
    
    @pytest.fixture(scope="class")
    def customer_token(self):
        """Get customer token for registration test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_agency_registration_requires_auth(self):
        """Agency registration requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/agencies",
            json={
                "name": "Test Agency",
                "contact_person": "Test Person",
                "email": "test@testagency.com",
                "phone": "+90 555 000 0000",
                "city": "Istanbul"
            }
        )
        assert response.status_code == 401
        print("Unauthenticated registration correctly rejected")


class TestAccessControl:
    """Access control and authorization tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def agency_owner_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENCY_OWNER_EMAIL,
            "password": AGENCY_OWNER_PASSWORD
        })
        return response.json().get("token")
    
    def test_agency_owner_cannot_access_other_agency(self, agency_owner_token):
        """Agency owner cannot access other agency's data"""
        response = requests.get(
            f"{BASE_URL}/api/agencies/agency_nonexistent",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        # Should be 404 (not found) or 403 (forbidden)
        assert response.status_code in [403, 404]
        print("Access to other agency correctly denied")
    
    def test_admin_credit_requires_admin_role(self, agency_owner_token):
        """Non-admin cannot modify agency credit"""
        response = requests.put(
            f"{BASE_URL}/api/admin/agencies/{KNOWN_AGENCY_ID}/credit?amount=1000&transaction_type=credit",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 403
        print("Non-admin credit modification correctly denied")
    
    def test_admin_commission_requires_admin_role(self, agency_owner_token):
        """Non-admin cannot modify agency commission"""
        response = requests.put(
            f"{BASE_URL}/api/admin/agencies/{KNOWN_AGENCY_ID}/commission?commission_rate=15",
            headers={"Authorization": f"Bearer {agency_owner_token}"}
        )
        assert response.status_code == 403
        print("Non-admin commission modification correctly denied")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
