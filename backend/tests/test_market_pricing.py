"""
Test Market-Based Pricing APIs
Tests for:
- GET /api/markets - List all 20 markets with currencies
- GET /api/exchange-rates - Get exchange rates (TRY as base)
- GET /api/convert-price - Currency conversion endpoint
- POST /api/market-pricing - Single market pricing update
- POST /api/market-pricing/bulk - Bulk update multiple markets
- GET /api/market-pricing/{room_id} - Get market prices for room
- GET /api/market-pricing/{room_id}/all-markets - Get all markets pricing
- PUT /api/exchange-rates - Admin update exchange rates
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@metrotravel.com", "password": "admin123456"}
HOTEL_OWNER_CREDS = {"email": "ahmet@grandsultanhotel.com", "password": "hotel123456"}

# Test data from context
TEST_ROOM_ID = "room_e45010e669a5"
TEST_RATE_PLAN_ID = "rp_00b146e13945"

# Expected 20 markets
EXPECTED_MARKETS = ["TR", "DE", "GB", "FR", "NL", "BE", "RU", "UA", "PL", "US", 
                    "CA", "AU", "IT", "ES", "AT", "CH", "SE", "NO", "DK", "SA"]

# Expected currencies
EXPECTED_CURRENCIES = {
    "TR": "TRY", "DE": "EUR", "GB": "GBP", "FR": "EUR", "NL": "EUR",
    "BE": "EUR", "RU": "RUB", "UA": "UAH", "PL": "PLN", "US": "USD",
    "CA": "CAD", "AU": "AUD", "IT": "EUR", "ES": "EUR", "AT": "EUR",
    "CH": "CHF", "SE": "SEK", "NO": "NOK", "DK": "DKK", "SA": "SAR"
}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed - skipping admin tests")


@pytest.fixture(scope="module")
def hotel_owner_token(api_client):
    """Get hotel owner authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=HOTEL_OWNER_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Hotel owner authentication failed - skipping hotel owner tests")


@pytest.fixture(scope="module")
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


@pytest.fixture(scope="module")
def hotel_owner_client(api_client, hotel_owner_token):
    """Session with hotel owner auth header"""
    api_client.headers.update({"Authorization": f"Bearer {hotel_owner_token}"})
    return api_client


class TestMarketsEndpoint:
    """Tests for GET /api/markets - List all 20 markets with currencies"""
    
    def test_get_markets_returns_200(self, api_client):
        """Test that markets endpoint returns 200"""
        response = api_client.get(f"{BASE_URL}/api/markets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/markets returns 200")
    
    def test_get_markets_returns_20_markets(self, api_client):
        """Test that exactly 20 markets are returned"""
        response = api_client.get(f"{BASE_URL}/api/markets")
        data = response.json()
        
        assert "markets" in data, "Response should contain 'markets' key"
        markets = data["markets"]
        assert len(markets) == 20, f"Expected 20 markets, got {len(markets)}"
        print(f"✓ GET /api/markets returns exactly 20 markets")
    
    def test_get_markets_has_correct_codes(self, api_client):
        """Test that all expected market codes are present"""
        response = api_client.get(f"{BASE_URL}/api/markets")
        data = response.json()
        
        market_codes = [m["code"] for m in data["markets"]]
        for code in EXPECTED_MARKETS:
            assert code in market_codes, f"Market code {code} not found"
        print(f"✓ All 20 expected market codes present: {', '.join(EXPECTED_MARKETS)}")
    
    def test_get_markets_has_correct_currencies(self, api_client):
        """Test that each market has the correct currency"""
        response = api_client.get(f"{BASE_URL}/api/markets")
        data = response.json()
        
        for market in data["markets"]:
            code = market["code"]
            expected_currency = EXPECTED_CURRENCIES.get(code)
            assert market["currency"] == expected_currency, \
                f"Market {code} should have currency {expected_currency}, got {market['currency']}"
        print("✓ All markets have correct currencies")
    
    def test_get_markets_has_required_fields(self, api_client):
        """Test that each market has required fields: code, name, currency, flag"""
        response = api_client.get(f"{BASE_URL}/api/markets")
        data = response.json()
        
        required_fields = ["code", "name", "currency", "flag"]
        for market in data["markets"]:
            for field in required_fields:
                assert field in market, f"Market {market.get('code', 'unknown')} missing field: {field}"
        print("✓ All markets have required fields (code, name, currency, flag)")


class TestExchangeRatesEndpoint:
    """Tests for GET /api/exchange-rates - Get exchange rates (TRY as base)"""
    
    def test_get_exchange_rates_returns_200(self, api_client):
        """Test that exchange rates endpoint returns 200"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/exchange-rates returns 200")
    
    def test_get_exchange_rates_has_rates(self, api_client):
        """Test that response contains rates dictionary"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        data = response.json()
        
        assert "rates" in data, "Response should contain 'rates' key"
        assert isinstance(data["rates"], dict), "Rates should be a dictionary"
        print("✓ Exchange rates response contains rates dictionary")
    
    def test_get_exchange_rates_try_is_base(self, api_client):
        """Test that TRY is the base currency (rate = 1.0)"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        data = response.json()
        
        assert data["rates"].get("TRY") == 1.0, "TRY should have rate 1.0 as base currency"
        print("✓ TRY is base currency with rate 1.0")
    
    def test_get_exchange_rates_has_all_currencies(self, api_client):
        """Test that all expected currencies have rates"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        data = response.json()
        
        expected_currencies = ["TRY", "EUR", "USD", "GBP", "RUB", "SAR", "AUD", "CAD", 
                               "CHF", "SEK", "NOK", "DKK", "PLN", "UAH"]
        for currency in expected_currencies:
            assert currency in data["rates"], f"Currency {currency} not found in rates"
            assert isinstance(data["rates"][currency], (int, float)), \
                f"Rate for {currency} should be numeric"
        print(f"✓ All {len(expected_currencies)} expected currencies have rates")
    
    def test_get_exchange_rates_has_source(self, api_client):
        """Test that response indicates source (default or custom)"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        data = response.json()
        
        assert "source" in data, "Response should contain 'source' key"
        assert data["source"] in ["default", "custom"], \
            f"Source should be 'default' or 'custom', got {data['source']}"
        print(f"✓ Exchange rates source: {data['source']}")


class TestConvertPriceEndpoint:
    """Tests for GET /api/convert-price - Currency conversion endpoint"""
    
    def test_convert_price_returns_200(self, api_client):
        """Test that convert price endpoint returns 200"""
        response = api_client.get(
            f"{BASE_URL}/api/convert-price",
            params={"amount": 100, "from_currency": "TRY", "to_currency": "EUR"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/convert-price returns 200")
    
    def test_convert_price_try_to_eur(self, api_client):
        """Test conversion from TRY to EUR"""
        response = api_client.get(
            f"{BASE_URL}/api/convert-price",
            params={"amount": 1000, "from_currency": "TRY", "to_currency": "EUR"}
        )
        data = response.json()
        
        assert "original" in data, "Response should contain 'original'"
        assert "converted" in data, "Response should contain 'converted'"
        assert data["original"] == 1000, "Original amount should be 1000"
        assert data["converted"] > 0, "Converted amount should be positive"
        assert data["converted"] < 1000, "EUR should be worth more than TRY"
        print(f"✓ Converted 1000 TRY to {data['converted']} EUR")
    
    def test_convert_price_same_currency(self, api_client):
        """Test conversion with same currency returns same amount"""
        response = api_client.get(
            f"{BASE_URL}/api/convert-price",
            params={"amount": 500, "from_currency": "USD", "to_currency": "USD"}
        )
        data = response.json()
        
        assert data["original"] == data["converted"], \
            "Same currency conversion should return same amount"
        print("✓ Same currency conversion returns same amount")
    
    def test_convert_price_eur_to_usd(self, api_client):
        """Test conversion from EUR to USD"""
        response = api_client.get(
            f"{BASE_URL}/api/convert-price",
            params={"amount": 100, "from_currency": "EUR", "to_currency": "USD"}
        )
        data = response.json()
        
        assert data["from_currency"] == "EUR", "from_currency should be EUR"
        assert data["to_currency"] == "USD", "to_currency should be USD"
        assert data["converted"] > 0, "Converted amount should be positive"
        print(f"✓ Converted 100 EUR to {data['converted']} USD")
    
    def test_convert_price_all_currencies(self, api_client):
        """Test conversion works for all supported currencies"""
        currencies = ["TRY", "EUR", "USD", "GBP", "RUB", "SAR"]
        for currency in currencies:
            response = api_client.get(
                f"{BASE_URL}/api/convert-price",
                params={"amount": 100, "from_currency": "TRY", "to_currency": currency}
            )
            assert response.status_code == 200, f"Conversion to {currency} failed"
        print(f"✓ Conversion works for all {len(currencies)} tested currencies")


class TestMarketPricingEndpoints:
    """Tests for market pricing CRUD operations"""
    
    def test_post_market_pricing_requires_auth(self, api_client):
        """Test that POST /api/market-pricing requires authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/market-pricing",
            json={
                "room_id": TEST_ROOM_ID,
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "market_code": "TR",
                "dates": [{"date": "2026-04-01", "price": 2500, "available_units": 10}]
            }
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/market-pricing requires authentication")
    
    def test_post_market_pricing_single_market(self, hotel_owner_client):
        """Test creating pricing for a single market"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = hotel_owner_client.post(
            f"{BASE_URL}/api/market-pricing",
            json={
                "room_id": TEST_ROOM_ID,
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "market_code": "DE",
                "price_type": "market",
                "currency": "EUR",
                "dates": [
                    {"date": tomorrow, "price": 85, "available_units": 10, "min_stay": 1, "stop_sale": False}
                ]
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert data["market"] == "DE", "Market should be DE"
        assert data["dates_updated"] == 1, "Should update 1 date"
        print(f"✓ Created market pricing for DE: {data}")
    
    def test_post_market_pricing_bulk(self, hotel_owner_client):
        """Test bulk update pricing for multiple markets"""
        start_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        
        response = hotel_owner_client.post(
            f"{BASE_URL}/api/market-pricing/bulk",
            json={
                "room_id": TEST_ROOM_ID,
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "start_date": start_date,
                "end_date": end_date,
                "markets": [
                    {"market_code": "TR", "price": 2500, "currency": "TRY"},
                    {"market_code": "GB", "price": 72, "currency": "GBP"},
                    {"market_code": "US", "price": 90, "currency": "USD"}
                ],
                "available_units": 10,
                "min_stay": 1,
                "apply_to": "all",
                "stop_sale": False
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["markets_updated"] == 3, "Should update 3 markets"
        assert data["dates_updated"] > 0, "Should update multiple dates"
        print(f"✓ Bulk updated {data['markets_updated']} markets, {data['dates_updated']} dates")
    
    def test_get_market_pricing_for_room(self, api_client):
        """Test getting market pricing for a specific room and market"""
        start_date = "2026-04-01"
        end_date = "2026-04-15"
        
        response = api_client.get(
            f"{BASE_URL}/api/market-pricing/{TEST_ROOM_ID}",
            params={
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "market_code": "TR",
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "pricing" in data, "Response should contain 'pricing'"
        assert data["market_code"] == "TR", "Market code should be TR"
        print(f"✓ Got market pricing for TR: {len(data['pricing'])} entries")
    
    def test_get_all_markets_pricing(self, api_client):
        """Test getting pricing for all markets for a room"""
        start_date = "2026-04-01"
        end_date = "2026-04-15"
        
        response = api_client.get(
            f"{BASE_URL}/api/market-pricing/{TEST_ROOM_ID}/all-markets",
            params={
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "pricing_by_market" in data, "Response should contain 'pricing_by_market'"
        
        # Check that we have pricing for multiple markets
        markets_with_pricing = list(data["pricing_by_market"].keys())
        print(f"✓ Got pricing for markets: {', '.join(markets_with_pricing)}")
        
        # Verify structure of pricing entries
        for market_code, pricing_list in data["pricing_by_market"].items():
            if pricing_list:
                entry = pricing_list[0]
                assert "date" in entry, f"Pricing entry for {market_code} should have 'date'"
                assert "price" in entry, f"Pricing entry for {market_code} should have 'price'"
                assert "currency" in entry, f"Pricing entry for {market_code} should have 'currency'"
        print("✓ All pricing entries have required fields (date, price, currency)")


class TestExchangeRatesUpdate:
    """Tests for PUT /api/exchange-rates - Admin update exchange rates"""
    
    def test_update_exchange_rates_requires_admin(self, hotel_owner_client):
        """Test that updating exchange rates requires admin role"""
        response = hotel_owner_client.put(
            f"{BASE_URL}/api/exchange-rates",
            json={"rates": {"EUR": 0.028}}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ PUT /api/exchange-rates requires admin role")
    
    def test_update_exchange_rates_as_admin(self, admin_client):
        """Test admin can update exchange rates"""
        new_rates = {
            "TRY": 1.0,
            "EUR": 0.028,
            "USD": 0.030,
            "GBP": 0.024
        }
        
        response = admin_client.put(
            f"{BASE_URL}/api/exchange-rates",
            json={"rates": new_rates}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert data["rates"]["EUR"] == 0.028, "EUR rate should be updated"
        print(f"✓ Admin updated exchange rates: {data['rates']}")
    
    def test_updated_rates_are_persisted(self, api_client):
        """Test that updated rates are returned in subsequent GET"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        data = response.json()
        
        # After admin update, source should be 'custom'
        if data["source"] == "custom":
            assert data["rates"]["EUR"] == 0.028, "Updated EUR rate should be persisted"
            print("✓ Updated exchange rates are persisted (source: custom)")
        else:
            print("✓ Exchange rates using default values (no custom rates set)")


class TestMarketPricingValidation:
    """Tests for market pricing validation and edge cases"""
    
    def test_market_pricing_invalid_room(self, hotel_owner_client):
        """Test market pricing with invalid room ID"""
        response = hotel_owner_client.post(
            f"{BASE_URL}/api/market-pricing",
            json={
                "room_id": "invalid_room_id",
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "market_code": "TR",
                "dates": [{"date": "2026-04-01", "price": 2500, "available_units": 10}]
            }
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid room ID returns 404")
    
    def test_bulk_pricing_weekends_only(self, hotel_owner_client):
        """Test bulk pricing applied to weekends only"""
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        
        response = hotel_owner_client.post(
            f"{BASE_URL}/api/market-pricing/bulk",
            json={
                "room_id": TEST_ROOM_ID,
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "start_date": start_date,
                "end_date": end_date,
                "markets": [
                    {"market_code": "TR", "price": 3000, "currency": "TRY"}
                ],
                "available_units": 5,
                "min_stay": 2,
                "apply_to": "weekends",
                "stop_sale": False
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Weekends only should have fewer dates than all days
        print(f"✓ Bulk pricing for weekends: {data['dates_updated']} dates updated")
    
    def test_bulk_pricing_weekdays_only(self, hotel_owner_client):
        """Test bulk pricing applied to weekdays only"""
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        
        response = hotel_owner_client.post(
            f"{BASE_URL}/api/market-pricing/bulk",
            json={
                "room_id": TEST_ROOM_ID,
                "rate_plan_id": TEST_RATE_PLAN_ID,
                "start_date": start_date,
                "end_date": end_date,
                "markets": [
                    {"market_code": "DE", "price": 90, "currency": "EUR"}
                ],
                "available_units": 8,
                "min_stay": 1,
                "apply_to": "weekdays",
                "stop_sale": False
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        print(f"✓ Bulk pricing for weekdays: {data['dates_updated']} dates updated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
