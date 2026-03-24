#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class HotelBookingAPITester:
    def __init__(self, base_url: str = "https://hotel-connect-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.hotel_id = None
        self.room_id = None
        self.rate_plan_id = None
        self.booking_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        
    def log(self, message: str):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    self.log(f"   Response: {response.text[:200]}")

            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw_response": response.text}
                
            return success, response_data

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_cities_api(self):
        """Test cities API"""
        success, data = self.run_test("Cities API", "GET", "cities", 200)
        if success and 'cities' in data:
            self.log(f"   Found {len(data['cities'])} cities")
            # Check if Turkey cities are present
            city_names = [city['name']['en'] for city in data['cities']]
            expected_cities = ['Istanbul', 'Antalya', 'Bodrum']
            for city in expected_cities:
                if city in city_names:
                    self.log(f"   ✓ {city} found")
                else:
                    self.log(f"   ⚠ {city} not found")
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "testpass123",
            "role": "customer"
        }
        
        success, data = self.run_test("User Registration", "POST", "auth/register", 200, test_data)
        if success and 'token' in data:
            self.token = data['token']
            self.user_id = data['user_id']
            self.log(f"   User registered: {data['email']}")
        return success

    def test_hotel_owner_registration(self):
        """Test hotel owner registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_data = {
            "name": f"Hotel Owner {timestamp}",
            "email": f"owner{timestamp}@example.com",
            "password": "testpass123",
            "role": "hotel_owner"
        }
        
        success, data = self.run_test("Hotel Owner Registration", "POST", "auth/register", 200, test_data)
        if success and 'token' in data:
            # Store hotel owner credentials for later use
            self.hotel_owner_token = data['token']
            self.hotel_owner_id = data['user_id']
            self.log(f"   Hotel owner registered: {data['email']}")
        return success

    def test_user_login(self):
        """Test user login"""
        if not hasattr(self, 'hotel_owner_token'):
            return False
            
        # Use hotel owner for subsequent tests
        self.token = self.hotel_owner_token
        self.user_id = self.hotel_owner_id
        
        success, data = self.run_test("Get User Profile", "GET", "auth/me", 200)
        if success:
            self.log(f"   Logged in as: {data.get('name')} ({data.get('role')})")
        return success

    def test_hotel_creation(self):
        """Test hotel creation"""
        if not self.token:
            return False
            
        hotel_data = {
            "name": {
                "en": "Test Hotel Istanbul",
                "tr": "Test Otel İstanbul",
                "de": "Test Hotel Istanbul"
            },
            "property_type": "hotel",
            "star_rating": 4,
            "address": {
                "street": "Test Street 123",
                "city": "Istanbul",
                "district": "Beyoğlu",
                "postal_code": "34430",
                "country": "Turkey",
                "coordinates": {
                    "lat": 41.0082,
                    "lng": 28.9784
                }
            },
            "description": {
                "en": "A beautiful test hotel in Istanbul",
                "tr": "İstanbul'da güzel bir test oteli",
                "de": "Ein schönes Testhotel in Istanbul"
            },
            "property_amenities": ["wifi", "pool", "restaurant", "parking"],
            "contact_email": "test@testhotel.com",
            "contact_phone": "+90 212 555 0123"
        }
        
        success, data = self.run_test("Hotel Creation", "POST", "hotels", 200, hotel_data)
        if success and 'hotel_id' in data:
            self.hotel_id = data['hotel_id']
            self.log(f"   Hotel created: {self.hotel_id}")
        return success

    def test_room_creation(self):
        """Test room creation"""
        if not self.hotel_id:
            return False
            
        room_data = {
            "hotel_id": self.hotel_id,
            "name": {
                "en": "Deluxe Double Room",
                "tr": "Deluxe Çift Kişilik Oda",
                "de": "Deluxe Doppelzimmer"
            },
            "room_type": "deluxe",
            "beds": [
                {
                    "bed_type": "double",
                    "count": 1
                }
            ],
            "max_adults": 2,
            "max_children": 1,
            "size_sqm": 35.0,
            "is_smoking": False,
            "amenities": ["wifi", "tv", "air_conditioning", "minibar", "safe_box"],
            "description": {
                "en": "Spacious deluxe room with city view",
                "tr": "Şehir manzaralı geniş deluxe oda",
                "de": "Geräumiges Deluxe-Zimmer mit Stadtblick"
            }
        }
        
        success, data = self.run_test("Room Creation", "POST", "rooms", 200, room_data)
        if success and 'room_id' in data:
            self.room_id = data['room_id']
            self.log(f"   Room created: {self.room_id}")
        return success

    def test_rate_plan_creation(self):
        """Test rate plan creation"""
        if not self.room_id:
            return False
            
        rate_plan_data = {
            "room_id": self.room_id,
            "name": {
                "en": "Standard Rate",
                "tr": "Standart Tarife",
                "de": "Standardtarif"
            },
            "rate_type": "refundable",
            "meal_plan": "breakfast",
            "base_price": 150.0,
            "currency": "TRY"
        }
        
        success, data = self.run_test("Rate Plan Creation", "POST", "rate-plans", 200, rate_plan_data)
        if success and 'rate_plan_id' in data:
            self.rate_plan_id = data['rate_plan_id']
            self.log(f"   Rate plan created: {self.rate_plan_id}")
        return success

    def test_inventory_update(self):
        """Test inventory update"""
        if not self.room_id or not self.rate_plan_id:
            return False
            
        # Create inventory for next 30 days
        today = datetime.now()
        dates = []
        for i in range(30):
            date = today + timedelta(days=i)
            dates.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": 150.0 + (i * 5),  # Varying prices
                "available_units": 5
            })
        
        inventory_data = {
            "room_id": self.room_id,
            "rate_plan_id": self.rate_plan_id,
            "dates": dates
        }
        
        success, data = self.run_test("Inventory Update", "POST", "inventory", 200, inventory_data)
        if success:
            self.log(f"   Updated inventory for {len(dates)} dates")
        return success

    def test_hotel_search(self):
        """Test hotel search"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        search_data = {
            "city": "Istanbul",
            "check_in": tomorrow,
            "check_out": day_after,
            "adults": 2,
            "children": 0
        }
        
        success, data = self.run_test("Hotel Search", "POST", "search", 200, search_data)
        if success and 'results' in data:
            self.log(f"   Found {len(data['results'])} hotels")
            if data['results']:
                hotel = data['results'][0]
                self.log(f"   First result: {hotel.get('name')} - {hotel.get('min_price')} {hotel.get('currency')}")
        return success

    def test_availability_check(self):
        """Test availability check"""
        if not self.hotel_id:
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        params = f"hotel_id={self.hotel_id}&check_in={tomorrow}&check_out={day_after}&adults=2&children=0"
        
        success, data = self.run_test("Availability Check", "GET", f"search/availability?{params}", 200)
        if success and 'rooms' in data:
            self.log(f"   Found {len(data['rooms'])} available rooms")
        return success

    def test_booking_creation(self):
        """Test booking creation"""
        if not self.hotel_id or not self.room_id or not self.rate_plan_id:
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        booking_data = {
            "hotel_id": self.hotel_id,
            "check_in": tomorrow,
            "check_out": day_after,
            "rooms": [
                {
                    "room_id": self.room_id,
                    "rate_plan_id": self.rate_plan_id,
                    "quantity": 1,
                    "guest_names": ["John Doe"]
                }
            ],
            "guest_info": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "+90 555 123 4567",
                "special_requests": "Late check-in please"
            },
            "adults": 2,
            "children": 0,
            "children_ages": []
        }
        
        success, data = self.run_test("Booking Creation", "POST", "bookings", 200, booking_data)
        if success and 'booking_id' in data:
            self.booking_id = data['booking_id']
            self.log(f"   Booking created: {data['booking_ref']} (ID: {self.booking_id})")
            self.log(f"   Total price: {data['total_price']} {data['currency']}")
        return success

    def test_get_booking(self):
        """Test get booking details"""
        if not self.booking_id:
            return False
            
        success, data = self.run_test("Get Booking", "GET", f"bookings/{self.booking_id}", 200)
        if success:
            self.log(f"   Booking status: {data.get('status')}")
            self.log(f"   Payment status: {data.get('payment_status')}")
        return success

    def test_user_bookings(self):
        """Test get user bookings"""
        success, data = self.run_test("User Bookings", "GET", "bookings", 200)
        if success and 'bookings' in data:
            self.log(f"   User has {len(data['bookings'])} bookings")
        return success

    def test_hotel_list(self):
        """Test hotel listing"""
        success, data = self.run_test("Hotel List", "GET", "hotels", 200)
        if success and 'hotels' in data:
            self.log(f"   Found {len(data['hotels'])} approved hotels")
        return success

    def test_my_hotels(self):
        """Test get my hotels (hotel owner)"""
        success, data = self.run_test("My Hotels", "GET", "hotels/owner/my-hotels", 200)
        if success and 'hotels' in data:
            self.log(f"   Hotel owner has {len(data['hotels'])} hotels")
        return success

    def test_extranet_bookings(self):
        """Test extranet bookings"""
        success, data = self.run_test("Extranet Bookings", "GET", "extranet/bookings", 200)
        if success and 'bookings' in data:
            self.log(f"   Hotel has {len(data['bookings'])} bookings")
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Hotel Booking Platform API Tests")
        self.log(f"Testing against: {self.base_url}")
        
        test_methods = [
            self.test_root_endpoint,
            self.test_cities_api,
            self.test_user_registration,
            self.test_hotel_owner_registration,
            self.test_user_login,
            self.test_hotel_creation,
            self.test_room_creation,
            self.test_rate_plan_creation,
            self.test_inventory_update,
            self.test_hotel_search,
            self.test_availability_check,
            self.test_booking_creation,
            self.test_get_booking,
            self.test_user_bookings,
            self.test_hotel_list,
            self.test_my_hotels,
            self.test_extranet_bookings,
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log(f"❌ {test_method.__name__} failed with exception: {e}")
            self.log("")  # Empty line for readability
        
        # Print summary
        self.log("=" * 50)
        self.log(f"📊 Test Summary:")
        self.log(f"   Tests run: {self.tests_run}")
        self.log(f"   Tests passed: {self.tests_passed}")
        self.log(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!")
            return 0
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = HotelBookingAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())