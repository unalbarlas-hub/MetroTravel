from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request, Response, File, UploadFile, Form
from fastapi.responses import JSONResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import bcrypt
import jwt
import httpx
import requests
import asyncio
import resend
import iyzipay
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'hotel-booking-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# Object Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "hotelconnect"
storage_key = None

# Email Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# iyzico Payment Configuration
IYZICO_API_KEY = os.environ.get("IYZICO_API_KEY", "")
IYZICO_SECRET_KEY = os.environ.get("IYZICO_SECRET_KEY", "")
IYZICO_BASE_URL = os.environ.get("IYZICO_BASE_URL", "https://sandbox-api.iyzipay.com")
IYZICO_ENABLED = bool(IYZICO_API_KEY and IYZICO_SECRET_KEY)

def get_iyzico_options():
    """Get iyzico configuration options"""
    return {
        'api_key': IYZICO_API_KEY,
        'secret_key': IYZICO_SECRET_KEY,
        'base_url': IYZICO_BASE_URL
    }

# Create the main app
app = FastAPI(title="Hotel Booking Platform API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== STORAGE FUNCTIONS ==================

def init_storage():
    """Initialize object storage. Call once at startup."""
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set, storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage."""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    """Download file from storage."""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf"
}

# ================== ENUMS ==================

class UserRole(str, Enum):
    CUSTOMER = "customer"
    HOTEL_OWNER = "hotel_owner"
    ADMIN = "admin"
    AGENCY_OWNER = "agency_owner"
    AGENCY_USER = "agency_user"

class PropertyType(str, Enum):
    HOTEL = "hotel"
    BOUTIQUE = "boutique"
    RESORT = "resort"
    APARTMENT = "apartment"
    VILLA = "villa"
    HOSTEL = "hostel"
    GUESTHOUSE = "guesthouse"

class RoomType(str, Enum):
    STANDARD = "standard"
    DELUXE = "deluxe"
    SUITE = "suite"
    FAMILY = "family"
    EXECUTIVE = "executive"
    PENTHOUSE = "penthouse"

class BedType(str, Enum):
    SINGLE = "single"
    DOUBLE = "double"
    QUEEN = "queen"
    KING = "king"
    TWIN = "twin"
    SOFA_BED = "sofa_bed"

class MealPlan(str, Enum):
    ROOM_ONLY = "room_only"
    BREAKFAST = "breakfast"
    HALF_BOARD = "half_board"
    FULL_BOARD = "full_board"
    ALL_INCLUSIVE = "all_inclusive"

class RatePlanType(str, Enum):
    REFUNDABLE = "refundable"
    NON_REFUNDABLE = "non_refundable"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"

class HotelStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class AgencyStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class AgencyUserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    AGENT = "agent"
    FINANCE = "finance"

class CommissionType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"

class Currency(str, Enum):
    TRY = "TRY"
    EUR = "EUR"
    USD = "USD"
    GBP = "GBP"

# Room Amenity Codes
class RoomAmenity(str, Enum):
    WIFI = "wifi"
    TV = "tv"
    AIR_CONDITIONING = "air_conditioning"
    HEATING = "heating"
    MINIBAR = "minibar"
    SAFE_BOX = "safe_box"
    HAIR_DRYER = "hair_dryer"
    IRON = "iron"
    KETTLE = "kettle"
    COFFEE_MACHINE = "coffee_machine"
    BALCONY = "balcony"
    SEA_VIEW = "sea_view"
    CITY_VIEW = "city_view"
    GARDEN_VIEW = "garden_view"
    BATHTUB = "bathtub"
    SHOWER = "shower"
    JACUZZI = "jacuzzi"
    DESK = "desk"
    SOFA = "sofa"
    WARDROBE = "wardrobe"
    BLACKOUT_CURTAINS = "blackout_curtains"
    SOUNDPROOFING = "soundproofing"
    ACCESSIBLE = "accessible"

# Property Amenity Codes
class PropertyAmenity(str, Enum):
    POOL = "pool"
    INDOOR_POOL = "indoor_pool"
    SPA = "spa"
    GYM = "gym"
    PARKING = "parking"
    FREE_PARKING = "free_parking"
    VALET_PARKING = "valet_parking"
    RESTAURANT = "restaurant"
    BAR = "bar"
    ROOM_SERVICE = "room_service"
    CONCIERGE = "concierge"
    LAUNDRY = "laundry"
    BUSINESS_CENTER = "business_center"
    MEETING_ROOMS = "meeting_rooms"
    BEACH_ACCESS = "beach_access"
    KIDS_CLUB = "kids_club"
    PET_FRIENDLY = "pet_friendly"
    AIRPORT_SHUTTLE = "airport_shuttle"
    WIFI = "wifi"
    EV_CHARGING = "ev_charging"

# ================== MODELS ==================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    role: UserRole
    picture: Optional[str] = None
    preferred_language: str = "en"
    preferred_currency: Currency = Currency.TRY
    created_at: datetime
    is_active: bool = True
    agency_id: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_currency: Optional[Currency] = None

# Hotel Models
class GeoLocation(BaseModel):
    lat: float
    lng: float

class Address(BaseModel):
    street: Optional[str] = None
    city: str
    district: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Turkey"
    coordinates: Optional[GeoLocation] = None

class CheckInOutTimes(BaseModel):
    check_in: str = "14:00"
    check_out: str = "11:00"

class TranslatableText(BaseModel):
    en: str
    tr: Optional[str] = None
    de: Optional[str] = None

class CancellationPolicy(BaseModel):
    free_cancellation_days: int = 1
    penalty_percentage: float = 100.0
    no_show_penalty: float = 100.0

class HotelBase(BaseModel):
    name: TranslatableText
    property_type: PropertyType
    star_rating: int = Field(ge=1, le=5)
    address: Address
    description: TranslatableText
    times: CheckInOutTimes = CheckInOutTimes()
    property_amenities: List[PropertyAmenity] = []
    cancellation_policy: CancellationPolicy = CancellationPolicy()
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None

class HotelCreate(HotelBase):
    pass

class Hotel(HotelBase):
    model_config = ConfigDict(extra="ignore")
    hotel_id: str
    owner_id: str
    status: HotelStatus = HotelStatus.PENDING
    photos: List[str] = []
    rating_average: float = 0.0
    rating_count: int = 0
    created_at: datetime
    updated_at: datetime

class HotelUpdate(BaseModel):
    name: Optional[TranslatableText] = None
    property_type: Optional[PropertyType] = None
    star_rating: Optional[int] = None
    address: Optional[Address] = None
    description: Optional[TranslatableText] = None
    times: Optional[CheckInOutTimes] = None
    property_amenities: Optional[List[PropertyAmenity]] = None
    cancellation_policy: Optional[CancellationPolicy] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    photos: Optional[List[str]] = None

# Room Models
class BedConfiguration(BaseModel):
    bed_type: BedType
    count: int = 1

class RoomBase(BaseModel):
    name: TranslatableText
    room_type: RoomType
    beds: List[BedConfiguration]
    max_adults: int = Field(ge=1, le=10)
    max_children: int = Field(ge=0, le=6)
    size_sqm: Optional[float] = None
    is_smoking: bool = False
    amenities: List[RoomAmenity] = []
    description: Optional[TranslatableText] = None

class RoomCreate(RoomBase):
    hotel_id: str

class Room(RoomBase):
    model_config = ConfigDict(extra="ignore")
    room_id: str
    hotel_id: str
    photos: List[str] = []
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class RoomUpdate(BaseModel):
    name: Optional[TranslatableText] = None
    room_type: Optional[RoomType] = None
    beds: Optional[List[BedConfiguration]] = None
    max_adults: Optional[int] = None
    max_children: Optional[int] = None
    size_sqm: Optional[float] = None
    is_smoking: Optional[bool] = None
    amenities: Optional[List[RoomAmenity]] = None
    description: Optional[TranslatableText] = None
    photos: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Rate Plan & Pricing Models
class RatePlan(BaseModel):
    rate_plan_id: str
    room_id: str
    hotel_id: str
    name: TranslatableText
    rate_type: RatePlanType
    meal_plan: MealPlan
    base_price: float
    currency: Currency = Currency.TRY
    is_active: bool = True
    created_at: datetime

class RatePlanCreate(BaseModel):
    room_id: str
    name: TranslatableText
    rate_type: RatePlanType
    meal_plan: MealPlan
    base_price: float
    currency: Currency = Currency.TRY

class DatePricing(BaseModel):
    date: str  # YYYY-MM-DD format
    price: float
    available_units: int

class RoomInventory(BaseModel):
    inventory_id: str
    room_id: str
    hotel_id: str
    rate_plan_id: str
    date: str  # YYYY-MM-DD
    price: float
    available_units: int
    sold_units: int = 0

class InventoryUpdate(BaseModel):
    room_id: str
    rate_plan_id: str
    dates: List[DatePricing]

# Booking Models
class GuestInfo(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    special_requests: Optional[str] = None

class BookingRoom(BaseModel):
    room_id: str
    rate_plan_id: str
    quantity: int = 1
    guest_names: List[str] = []

class BookingCreate(BaseModel):
    hotel_id: str
    check_in: str  # YYYY-MM-DD
    check_out: str  # YYYY-MM-DD
    rooms: List[BookingRoom]
    guest_info: GuestInfo
    adults: int
    children: int = 0
    children_ages: List[int] = []

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    booking_ref: str  # Human readable reference
    user_id: Optional[str] = None
    hotel_id: str
    hotel_name: str
    check_in: str
    check_out: str
    rooms: List[BookingRoom]
    guest_info: GuestInfo
    adults: int
    children: int
    children_ages: List[int] = []
    total_price: float
    currency: Currency
    status: BookingStatus
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: datetime

# Search Models
class HotelSearchParams(BaseModel):
    city: Optional[str] = None
    check_in: str
    check_out: str
    adults: int = 2
    children: int = 0
    children_ages: List[int] = []
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    star_ratings: Optional[List[int]] = None
    property_types: Optional[List[PropertyType]] = None
    amenities: Optional[List[PropertyAmenity]] = None
    sort_by: str = "popularity"  # price, rating, popularity
    page: int = 1
    limit: int = 20

class HotelSearchResult(BaseModel):
    hotel_id: str
    name: str
    property_type: PropertyType
    star_rating: int
    address: Address
    rating_average: float
    rating_count: int
    photo: Optional[str] = None
    min_price: float
    currency: Currency
    property_amenities: List[PropertyAmenity]

# Review Models
class ReviewCreate(BaseModel):
    hotel_id: str
    booking_id: str
    rating: int = Field(ge=1, le=10)
    title: Optional[str] = None
    comment: Optional[str] = None
    categories: Optional[Dict[str, int]] = None  # cleanliness, comfort, location, facilities, staff, value

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    hotel_id: str
    booking_id: str
    user_id: str
    user_name: str
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    categories: Optional[Dict[str, int]] = None
    created_at: datetime
    response: Optional[str] = None  # Hotel owner response
    response_at: Optional[datetime] = None

class ReviewResponse(BaseModel):
    response: str

# ================== AGENCY / B2B MODELS ==================

class AgencyCreate(BaseModel):
    """Create a new agency"""
    name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    city: str
    country: str = "Turkey"
    tax_number: Optional[str] = None
    website: Optional[str] = None

class AgencyUpdate(BaseModel):
    """Update agency details"""
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_number: Optional[str] = None
    website: Optional[str] = None

class Agency(BaseModel):
    model_config = ConfigDict(extra="ignore")
    agency_id: str
    name: str
    contact_person: str
    email: str
    phone: str
    address: Optional[str] = None
    city: str
    country: str = "Turkey"
    tax_number: Optional[str] = None
    website: Optional[str] = None
    status: AgencyStatus = AgencyStatus.PENDING
    credit_limit: float = 0.0
    credit_used: float = 0.0
    commission_rate: float = 10.0  # Percentage
    commission_type: CommissionType = CommissionType.PERCENTAGE
    markup_rate: float = 0.0  # Default markup percentage
    total_bookings: int = 0
    total_revenue: float = 0.0
    created_at: datetime
    approved_at: Optional[datetime] = None

class AgencyUserCreate(BaseModel):
    """Create a sub-user for agency"""
    name: str
    email: EmailStr
    password: str
    role: AgencyUserRole = AgencyUserRole.AGENT
    phone: Optional[str] = None

class AgencyUserUpdate(BaseModel):
    """Update agency sub-user"""
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[AgencyUserRole] = None
    is_active: Optional[bool] = None

class AgencyUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    agency_id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: AgencyUserRole
    is_active: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None

class CreditTransaction(BaseModel):
    """Credit/Debit transaction for agency"""
    transaction_id: str
    agency_id: str
    amount: float
    transaction_type: str  # credit, debit, refund
    description: str
    booking_id: Optional[str] = None
    created_at: datetime
    created_by: str  # admin user_id

class CommissionSettings(BaseModel):
    """Commission and markup settings for an agency"""
    agency_id: str
    commission_rate: float  # Percentage commission Metro Travel earns
    commission_type: CommissionType
    markup_rate: float  # Percentage the agency adds on top
    hotel_specific: Optional[Dict[str, float]] = None  # hotel_id -> commission_rate

class AgencyBookingRequest(BaseModel):
    """Booking request from agency"""
    hotel_id: str
    check_in: str
    check_out: str
    rooms: List[Any]
    guest_info: Any
    adults: int
    children: int = 0
    children_ages: List[int] = []
    use_credit: bool = True  # Whether to use credit limit
    markup_amount: Optional[float] = None  # Custom markup for this booking

# ================== IYZICO PAYMENT MODELS ==================

class PaymentInitRequest(BaseModel):
    """Request to initialize iyzico checkout"""
    booking_id: str

class PaymentInitResponse(BaseModel):
    """Response from iyzico checkout initialization"""
    status: str
    token: Optional[str] = None
    checkout_form_content: Optional[str] = None
    payment_page_url: Optional[str] = None
    message: Optional[str] = None
    booking_id: str
    total_price: float
    currency: str

class PaymentStatusResponse(BaseModel):
    """Payment status response"""
    booking_id: str
    payment_id: Optional[str] = None
    status: str
    amount: float
    currency: str
    card_last_four: Optional[str] = None
    card_type: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

# ================== EMAIL FUNCTIONS ==================

async def send_email(to: str, subject: str, html_content: str) -> bool:
    """Send email using Resend. Returns True if successful."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, email not sent")
        return False
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def get_booking_confirmation_email(booking: dict, hotel_name: str) -> str:
    """Generate booking confirmation email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #003580; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background: #f9f9f9; }}
            .booking-ref {{ font-size: 24px; font-weight: bold; color: #003580; }}
            .details {{ background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HotelConnect</h1>
                <p>Booking Confirmation</p>
            </div>
            <div class="content">
                <p>Dear {booking['guest_info']['first_name']},</p>
                <p>Your booking has been confirmed!</p>
                
                <div class="details">
                    <p><strong>Booking Reference:</strong></p>
                    <p class="booking-ref">{booking['booking_ref']}</p>
                </div>
                
                <div class="details">
                    <p><strong>Hotel:</strong> {hotel_name}</p>
                    <p><strong>Check-in:</strong> {booking['check_in']}</p>
                    <p><strong>Check-out:</strong> {booking['check_out']}</p>
                    <p><strong>Guests:</strong> {booking['adults']} adults{f", {booking['children']} children" if booking.get('children', 0) > 0 else ""}</p>
                    <p><strong>Total:</strong> ₺{booking['total_price']:,.0f}</p>
                </div>
                
                <p>Thank you for booking with HotelConnect!</p>
            </div>
            <div class="footer">
                <p>© 2024 HotelConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_cancellation_email(booking: dict, hotel_name: str) -> str:
    """Generate booking cancellation email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #dc2626; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background: #f9f9f9; }}
            .booking-ref {{ font-size: 24px; font-weight: bold; color: #dc2626; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HotelConnect</h1>
                <p>Booking Cancellation</p>
            </div>
            <div class="content">
                <p>Dear {booking['guest_info']['first_name']},</p>
                <p>Your booking has been cancelled.</p>
                
                <p><strong>Booking Reference:</strong> <span class="booking-ref">{booking['booking_ref']}</span></p>
                <p><strong>Hotel:</strong> {hotel_name}</p>
                <p><strong>Original dates:</strong> {booking['check_in']} - {booking['check_out']}</p>
                
                <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
                <p>© 2024 HotelConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> User:
    # Check cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (from Google OAuth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        # Verify session expiry
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**user)
    
    # Try JWT token
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

async def get_optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_current_user_dict(request: Request) -> dict:
    """Get current user as dictionary for routes that need .get() access."""
    # Check cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (from Google OAuth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        # Verify session expiry
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    
    # Try JWT token
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def require_role(user: User, roles: List[UserRole]):
    if user.role not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role.value,
        "preferred_language": "en",
        "preferred_currency": Currency.TRY.value,
        "is_active": True,
        "created_at": now.isoformat(),
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.role.value)
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role.value,
        "token": token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    token = create_jwt_token(user["user_id"], user["role"])
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRATION_HOURS * 3600,
        path="/"
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "token": token,
        "agency_id": user.get("agency_id")
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent Auth session_id for user session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Find or create user
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc)
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "updated_at": now.isoformat()}}
        )
        role = existing_user.get("role", UserRole.CUSTOMER.value)
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = UserRole.CUSTOMER.value
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "preferred_language": "en",
            "preferred_currency": Currency.TRY.value,
            "is_active": True,
            "created_at": now.isoformat(),
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    expires_at = now + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat()
        }},
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "role": user.role,
        "preferred_language": user.preferred_language,
        "preferred_currency": user.preferred_currency,
        "agency_id": user.agency_id
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, user: User = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

# ================== HOTEL ROUTES ==================

class SimpleHotelRegister(BaseModel):
    """Simple hotel registration model for frontend form"""
    name: str
    name_translations: Optional[dict] = None
    property_type: str
    star_rating: int = Field(ge=1, le=5)
    city: str
    district: Optional[str] = None
    street_address: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Turkey"
    description: Optional[str] = None
    description_translations: Optional[dict] = None
    amenities: List[str] = []
    check_in_time: str = "14:00"
    check_out_time: str = "12:00"
    images: List[str] = []
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None

@api_router.post("/hotels/register")
async def register_hotel_simple(hotel_data: SimpleHotelRegister, user: User = Depends(get_current_user)):
    """Simple hotel registration endpoint for frontend form - upgrades user to hotel_owner"""
    
    hotel_id = f"hotel_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Build name translations
    name_obj = {
        "en": hotel_data.name,
        "tr": hotel_data.name_translations.get("tr", hotel_data.name) if hotel_data.name_translations else hotel_data.name,
        "de": hotel_data.name_translations.get("de", hotel_data.name) if hotel_data.name_translations else hotel_data.name
    }
    
    # Build description translations
    desc_obj = {
        "en": hotel_data.description or "",
        "tr": hotel_data.description_translations.get("tr", hotel_data.description or "") if hotel_data.description_translations else (hotel_data.description or ""),
        "de": hotel_data.description_translations.get("de", hotel_data.description or "") if hotel_data.description_translations else (hotel_data.description or "")
    }
    
    # Build address
    address_obj = {
        "city": hotel_data.city,
        "district": hotel_data.district or "",
        "street_address": hotel_data.street_address or "",
        "postal_code": hotel_data.postal_code or "",
        "country": hotel_data.country
    }
    
    hotel_doc = {
        "hotel_id": hotel_id,
        "owner_id": user.user_id,
        "name": name_obj,
        "property_type": hotel_data.property_type,
        "star_rating": hotel_data.star_rating,
        "address": address_obj,
        "description": desc_obj,
        "times": {
            "check_in": hotel_data.check_in_time,
            "check_out": hotel_data.check_out_time
        },
        "property_amenities": hotel_data.amenities,
        "cancellation_policy": {
            "free_cancellation_days": 1,
            "penalty_percentage": 100.0,
            "no_show_penalty": 100.0
        },
        "contact_email": hotel_data.contact_email or user.email,
        "contact_phone": hotel_data.contact_phone or "",
        "website": hotel_data.website or "",
        "status": HotelStatus.PENDING.value,
        "photos": hotel_data.images,
        "rating_average": 0.0,
        "rating_count": 0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.hotels.insert_one(hotel_doc)
    
    # Upgrade user to hotel_owner if they're a customer
    if user.role == UserRole.CUSTOMER:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"role": "hotel_owner"}}
        )
    
    # Return without _id
    if "_id" in hotel_doc:
        del hotel_doc["_id"]
    
    return {"message": "Tesis başarıyla kaydedildi", "hotel_id": hotel_id, "status": "pending"}

@api_router.post("/hotels")
async def create_hotel(hotel_data: HotelCreate, user: User = Depends(get_current_user)):
    await require_role(user, [UserRole.HOTEL_OWNER, UserRole.ADMIN])
    
    hotel_id = f"hotel_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    hotel_doc = {
        "hotel_id": hotel_id,
        "owner_id": user.user_id,
        "name": hotel_data.name.model_dump(),
        "property_type": hotel_data.property_type.value,
        "star_rating": hotel_data.star_rating,
        "address": hotel_data.address.model_dump(),
        "description": hotel_data.description.model_dump(),
        "times": hotel_data.times.model_dump(),
        "property_amenities": [a.value for a in hotel_data.property_amenities],
        "cancellation_policy": hotel_data.cancellation_policy.model_dump(),
        "contact_email": hotel_data.contact_email,
        "contact_phone": hotel_data.contact_phone,
        "status": HotelStatus.PENDING.value,
        "photos": [],
        "rating_average": 0.0,
        "rating_count": 0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.hotels.insert_one(hotel_doc)
    
    # Return without _id
    if "_id" in hotel_doc:
        del hotel_doc["_id"]
    return hotel_doc

@api_router.get("/hotels")
async def list_hotels(
    city: Optional[str] = None,
    status: Optional[HotelStatus] = None,
    property_type: Optional[PropertyType] = None,
    page: int = 1,
    limit: int = 20
):
    query = {}
    if city:
        query["address.city"] = {"$regex": city, "$options": "i"}
    if status:
        query["status"] = status.value
    else:
        query["status"] = HotelStatus.APPROVED.value
    if property_type:
        query["property_type"] = property_type.value
    
    skip = (page - 1) * limit
    hotels = await db.hotels.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.hotels.count_documents(query)
    
    return {"hotels": hotels, "total": total, "page": page, "limit": limit}

@api_router.get("/hotels/{hotel_id}")
async def get_hotel(hotel_id: str):
    hotel = await db.hotels.find_one({"hotel_id": hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Get rooms for this hotel
    rooms = await db.rooms.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(100)
    hotel["rooms"] = rooms
    
    return hotel

@api_router.put("/hotels/{hotel_id}")
async def update_hotel(hotel_id: str, update_data: HotelUpdate, user: User = Depends(get_current_user)):
    hotel = await db.hotels.find_one({"hotel_id": hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Check ownership or admin
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {}
    for key, value in update_data.model_dump().items():
        if value is not None:
            if hasattr(value, 'model_dump'):
                update_dict[key] = value.model_dump()
            elif isinstance(value, list) and len(value) > 0 and hasattr(value[0], 'value'):
                update_dict[key] = [v.value for v in value]
            else:
                update_dict[key] = value
    
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.hotels.update_one({"hotel_id": hotel_id}, {"$set": update_dict})
    
    updated = await db.hotels.find_one({"hotel_id": hotel_id}, {"_id": 0})
    return updated

@api_router.get("/hotels/owner/my-hotels")
async def get_my_hotels(user: User = Depends(get_current_user)):
    await require_role(user, [UserRole.HOTEL_OWNER, UserRole.ADMIN])
    
    hotels = await db.hotels.find({"owner_id": user.user_id}, {"_id": 0}).to_list(100)
    return {"hotels": hotels}

# ================== ROOM ROUTES ==================

@api_router.post("/rooms")
async def create_room(room_data: RoomCreate, user: User = Depends(get_current_user)):
    # Verify hotel ownership
    hotel = await db.hotels.find_one({"hotel_id": room_data.hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    room_id = f"room_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    room_doc = {
        "room_id": room_id,
        "hotel_id": room_data.hotel_id,
        "name": room_data.name.model_dump(),
        "room_type": room_data.room_type.value,
        "beds": [b.model_dump() for b in room_data.beds],
        "max_adults": room_data.max_adults,
        "max_children": room_data.max_children,
        "size_sqm": room_data.size_sqm,
        "is_smoking": room_data.is_smoking,
        "amenities": [a.value for a in room_data.amenities],
        "description": room_data.description.model_dump() if room_data.description else None,
        "photos": [],
        "is_active": True,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.rooms.insert_one(room_doc)
    if "_id" in room_doc:
        del room_doc["_id"]
    return room_doc

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@api_router.get("/hotels/{hotel_id}/rooms")
async def get_hotel_rooms(hotel_id: str):
    rooms = await db.rooms.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(100)
    return {"rooms": rooms}

@api_router.put("/rooms/{room_id}")
async def update_room(room_id: str, update_data: RoomUpdate, user: User = Depends(get_current_user)):
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    hotel = await db.hotels.find_one({"hotel_id": room["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {}
    for key, value in update_data.model_dump().items():
        if value is not None:
            if hasattr(value, 'model_dump'):
                update_dict[key] = value.model_dump()
            elif isinstance(value, list) and len(value) > 0:
                if hasattr(value[0], 'value'):
                    update_dict[key] = [v.value for v in value]
                elif hasattr(value[0], 'model_dump'):
                    update_dict[key] = [v.model_dump() for v in value]
                else:
                    update_dict[key] = value
            else:
                update_dict[key] = value
    
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.rooms.update_one({"room_id": room_id}, {"$set": update_dict})
    
    updated = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    return updated

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, user: User = Depends(get_current_user)):
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    hotel = await db.hotels.find_one({"hotel_id": room["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.rooms.update_one({"room_id": room_id}, {"$set": {"is_active": False}})
    return {"message": "Room deleted"}

# ================== RATE PLAN ROUTES ==================

@api_router.post("/rate-plans")
async def create_rate_plan(rate_data: RatePlanCreate, user: User = Depends(get_current_user)):
    room = await db.rooms.find_one({"room_id": rate_data.room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    hotel = await db.hotels.find_one({"hotel_id": room["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    rate_plan_id = f"rp_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    rate_doc = {
        "rate_plan_id": rate_plan_id,
        "room_id": rate_data.room_id,
        "hotel_id": room["hotel_id"],
        "name": rate_data.name.model_dump(),
        "rate_type": rate_data.rate_type.value,
        "meal_plan": rate_data.meal_plan.value,
        "base_price": rate_data.base_price,
        "currency": rate_data.currency.value,
        "is_active": True,
        "created_at": now.isoformat()
    }
    
    await db.rate_plans.insert_one(rate_doc)
    if "_id" in rate_doc:
        del rate_doc["_id"]
    return rate_doc

@api_router.get("/rooms/{room_id}/rate-plans")
async def get_room_rate_plans(room_id: str):
    rate_plans = await db.rate_plans.find({"room_id": room_id, "is_active": True}, {"_id": 0}).to_list(100)
    return {"rate_plans": rate_plans}

@api_router.get("/hotels/{hotel_id}/rate-plans")
async def get_hotel_rate_plans(hotel_id: str):
    rate_plans = await db.rate_plans.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(100)
    return {"rate_plans": rate_plans}

# ================== INVENTORY ROUTES ==================

@api_router.post("/inventory")
async def update_inventory(inventory_data: InventoryUpdate, user: User = Depends(get_current_user)):
    room = await db.rooms.find_one({"room_id": inventory_data.room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    hotel = await db.hotels.find_one({"hotel_id": room["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for date_price in inventory_data.dates:
        inventory_id = f"inv_{inventory_data.room_id}_{inventory_data.rate_plan_id}_{date_price.date}"
        
        await db.inventory.update_one(
            {
                "room_id": inventory_data.room_id,
                "rate_plan_id": inventory_data.rate_plan_id,
                "date": date_price.date
            },
            {"$set": {
                "inventory_id": inventory_id,
                "hotel_id": room["hotel_id"],
                "price": date_price.price,
                "available_units": date_price.available_units,
            }},
            upsert=True
        )
    
    return {"message": "Inventory updated", "dates_updated": len(inventory_data.dates)}

@api_router.get("/inventory/{room_id}")
async def get_room_inventory(
    room_id: str,
    rate_plan_id: str,
    start_date: str,
    end_date: str
):
    inventory = await db.inventory.find({
        "room_id": room_id,
        "rate_plan_id": rate_plan_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(365)
    
    return {"inventory": inventory}

@api_router.get("/hotels/{hotel_id}/inventory")
async def get_hotel_inventory(hotel_id: str, start_date: str, end_date: str):
    inventory = await db.inventory.find({
        "hotel_id": hotel_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(10000)
    
    return {"inventory": inventory}

# ================== SEARCH ROUTES ==================

@api_router.post("/search")
async def search_hotels(params: HotelSearchParams):
    """Optimized hotel search using aggregation pipeline"""
    
    # Build match query
    match_query = {"status": HotelStatus.APPROVED.value}
    
    if params.city:
        match_query["address.city"] = {"$regex": params.city, "$options": "i"}
    
    if params.star_ratings:
        match_query["star_rating"] = {"$in": params.star_ratings}
    
    if params.property_types:
        match_query["property_type"] = {"$in": [pt.value for pt in params.property_types]}
    
    if params.amenities:
        match_query["property_amenities"] = {"$all": [a.value for a in params.amenities]}
    
    # Use aggregation pipeline with $lookup to join collections efficiently
    pipeline = [
        {"$match": match_query},
        {"$limit": 200},  # Limit initial hotels for performance
        # Lookup rooms for each hotel
        {"$lookup": {
            "from": "rooms",
            "let": {"hotel_id": "$hotel_id"},
            "pipeline": [
                {"$match": {
                    "$expr": {"$and": [
                        {"$eq": ["$hotel_id", "$$hotel_id"]},
                        {"$eq": ["$is_active", True]},
                        {"$gte": ["$max_adults", params.adults]}
                    ]}
                }},
                {"$limit": 10},
                {"$project": {"_id": 0, "room_id": 1, "max_adults": 1}}
            ],
            "as": "rooms"
        }},
        # Only keep hotels with matching rooms
        {"$match": {"rooms.0": {"$exists": True}}},
        # Lookup rate plans
        {"$lookup": {
            "from": "rate_plans",
            "let": {"room_ids": "$rooms.room_id"},
            "pipeline": [
                {"$match": {
                    "$expr": {"$and": [
                        {"$in": ["$room_id", "$$room_ids"]},
                        {"$eq": ["$is_active", True]}
                    ]}
                }},
                {"$sort": {"base_price": 1}},
                {"$limit": 5},
                {"$project": {"_id": 0, "rate_plan_id": 1, "room_id": 1, "base_price": 1}}
            ],
            "as": "rate_plans"
        }},
        # Project final fields
        {"$project": {
            "_id": 0,
            "hotel_id": 1,
            "name": 1,
            "property_type": 1,
            "star_rating": 1,
            "address": 1,
            "rating_average": {"$ifNull": ["$rating_average", 0]},
            "rating_count": {"$ifNull": ["$rating_count", 0]},
            "photo": {"$arrayElemAt": ["$photos", 0]},
            "property_amenities": {"$ifNull": ["$property_amenities", []]},
            "min_base_price": {"$min": "$rate_plans.base_price"}
        }}
    ]
    
    hotels = await db.hotels.aggregate(pipeline).to_list(200)
    
    # Process results
    results = []
    for hotel in hotels:
        min_price = hotel.get("min_base_price") or 0
        
        # Apply price filters
        if params.min_price and min_price < params.min_price:
            continue
        if params.max_price and min_price > params.max_price:
            continue
        
        results.append({
            "hotel_id": hotel["hotel_id"],
            "name": hotel["name"].get("en", hotel["name"].get("tr", "")) if isinstance(hotel["name"], dict) else hotel["name"],
            "property_type": hotel["property_type"],
            "star_rating": hotel["star_rating"],
            "address": hotel["address"],
            "rating_average": hotel.get("rating_average", 0),
            "rating_count": hotel.get("rating_count", 0),
            "photo": hotel.get("photo"),
            "min_price": min_price,
            "currency": Currency.TRY.value,
            "property_amenities": hotel.get("property_amenities", [])
        })
    
    # Sort results
    if params.sort_by == "price":
        results.sort(key=lambda x: x["min_price"])
    elif params.sort_by == "rating":
        results.sort(key=lambda x: x["rating_average"], reverse=True)
    
    # Paginate
    total = len(results)
    start = (params.page - 1) * params.limit
    end = start + params.limit
    paginated = results[start:end]
    
    return {
        "results": paginated,
        "total": total,
        "page": params.page,
        "limit": params.limit
    }

@api_router.get("/search/availability")
async def check_availability(
    hotel_id: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    children: int = 0
):
    """Get available rooms and prices for a hotel"""
    rooms = await db.rooms.find({"hotel_id": hotel_id, "is_active": True}, {"_id": 0}).to_list(100)
    
    available_rooms = []
    
    for room in rooms:
        if room["max_adults"] < adults:
            continue
        
        rate_plans = await db.rate_plans.find({"room_id": room["room_id"], "is_active": True}, {"_id": 0}).to_list(10)
        
        room_rates = []
        for rp in rate_plans:
            # Get inventory for date range
            inventory = await db.inventory.find({
                "room_id": room["room_id"],
                "rate_plan_id": rp["rate_plan_id"],
                "date": {"$gte": check_in, "$lt": check_out}
            }, {"_id": 0}).to_list(365)
            
            if inventory:
                min_available = min(inv["available_units"] for inv in inventory)
                total_price = sum(inv["price"] for inv in inventory)
            else:
                # Use base price if no inventory
                min_available = 5  # Default availability
                # Calculate number of nights
                from datetime import datetime as dt
                check_in_date = dt.strptime(check_in, "%Y-%m-%d")
                check_out_date = dt.strptime(check_out, "%Y-%m-%d")
                nights = (check_out_date - check_in_date).days
                total_price = rp["base_price"] * nights
            
            if min_available > 0:
                room_rates.append({
                    "rate_plan_id": rp["rate_plan_id"],
                    "name": rp["name"],
                    "rate_type": rp["rate_type"],
                    "meal_plan": rp["meal_plan"],
                    "total_price": total_price,
                    "currency": rp["currency"],
                    "available_units": min_available
                })
        
        if room_rates:
            available_rooms.append({
                **room,
                "rate_plans": room_rates
            })
    
    return {"rooms": available_rooms}

# ================== BOOKING ROUTES ==================

def generate_booking_ref():
    """Generate human-readable booking reference"""
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=8))

@api_router.post("/bookings")
async def create_booking(booking_data: BookingCreate, request: Request):
    user = await get_optional_user(request)
    
    # Validate hotel
    hotel = await db.hotels.find_one({"hotel_id": booking_data.hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    total_price = 0
    currency = Currency.TRY
    
    # Validate rooms and calculate price
    for booking_room in booking_data.rooms:
        room = await db.rooms.find_one({"room_id": booking_room.room_id}, {"_id": 0})
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {booking_room.room_id} not found")
        
        rate_plan = await db.rate_plans.find_one({"rate_plan_id": booking_room.rate_plan_id}, {"_id": 0})
        if not rate_plan:
            raise HTTPException(status_code=404, detail=f"Rate plan {booking_room.rate_plan_id} not found")
        
        # Get inventory pricing
        inventory = await db.inventory.find({
            "room_id": booking_room.room_id,
            "rate_plan_id": booking_room.rate_plan_id,
            "date": {"$gte": booking_data.check_in, "$lt": booking_data.check_out}
        }, {"_id": 0}).to_list(365)
        
        if inventory:
            room_total = sum(inv["price"] for inv in inventory) * booking_room.quantity
        else:
            from datetime import datetime as dt
            check_in_date = dt.strptime(booking_data.check_in, "%Y-%m-%d")
            check_out_date = dt.strptime(booking_data.check_out, "%Y-%m-%d")
            nights = (check_out_date - check_in_date).days
            room_total = rate_plan["base_price"] * nights * booking_room.quantity
        
        total_price += room_total
        currency = Currency(rate_plan["currency"])
        
        # Update inventory (decrease available units)
        for inv in inventory:
            await db.inventory.update_one(
                {"inventory_id": inv["inventory_id"]},
                {"$inc": {"available_units": -booking_room.quantity, "sold_units": booking_room.quantity}}
            )
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_ref = generate_booking_ref()
    now = datetime.now(timezone.utc)
    
    # Determine payment status based on iyzico availability
    if IYZICO_ENABLED:
        # Real payment - start as pending
        initial_status = BookingStatus.PENDING.value
        initial_payment_status = PaymentStatus.PENDING.value
    else:
        # Mock payment - auto confirm
        initial_status = BookingStatus.CONFIRMED.value
        initial_payment_status = PaymentStatus.PAID.value
    
    booking_doc = {
        "booking_id": booking_id,
        "booking_ref": booking_ref,
        "user_id": user.user_id if user else None,
        "hotel_id": booking_data.hotel_id,
        "hotel_name": hotel["name"].get("en", hotel["name"].get("tr", "")),
        "check_in": booking_data.check_in,
        "check_out": booking_data.check_out,
        "rooms": [r.model_dump() for r in booking_data.rooms],
        "guest_info": booking_data.guest_info.model_dump(),
        "adults": booking_data.adults,
        "children": booking_data.children,
        "children_ages": booking_data.children_ages,
        "total_price": total_price,
        "currency": currency.value,
        "status": initial_status,
        "payment_status": initial_payment_status,
        "iyzico_enabled": IYZICO_ENABLED,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    if "_id" in booking_doc:
        del booking_doc["_id"]
    
    # Send confirmation email only if payment is completed (mock mode)
    if not IYZICO_ENABLED:
        hotel_name = hotel["name"].get("en", hotel["name"].get("tr", ""))
        email_html = get_booking_confirmation_email(booking_doc, hotel_name)
        asyncio.create_task(send_email(
            booking_data.guest_info.email,
            f"Booking Confirmed - {booking_ref}",
            email_html
        ))
    
    return booking_doc

@api_router.get("/bookings")
async def get_user_bookings(user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"bookings": bookings}

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, request: Request):
    user = await get_optional_user(request)
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check access (user owns booking, hotel owner, or admin)
    if user:
        if booking.get("user_id") != user.user_id:
            hotel = await db.hotels.find_one({"hotel_id": booking["hotel_id"]}, {"_id": 0})
            if user.role != UserRole.ADMIN and hotel.get("owner_id") != user.user_id:
                raise HTTPException(status_code=403, detail="Not authorized")
    
    return booking

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check ownership
    if booking.get("user_id") != user.user_id and user.role != UserRole.ADMIN:
        hotel = await db.hotels.find_one({"hotel_id": booking["hotel_id"]}, {"_id": 0})
        if hotel.get("owner_id") != user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking["status"] == BookingStatus.CANCELLED.value:
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    # Restore inventory
    for room in booking["rooms"]:
        await db.inventory.update_many(
            {
                "room_id": room["room_id"],
                "rate_plan_id": room["rate_plan_id"],
                "date": {"$gte": booking["check_in"], "$lt": booking["check_out"]}
            },
            {"$inc": {"available_units": room["quantity"], "sold_units": -room["quantity"]}}
        )
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.CANCELLED.value,
            "payment_status": PaymentStatus.REFUNDED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send cancellation email
    email_html = get_cancellation_email(booking, booking["hotel_name"])
    asyncio.create_task(send_email(
        booking["guest_info"]["email"],
        f"Booking Cancelled - {booking['booking_ref']}",
        email_html
    ))
    
    return {"message": "Booking cancelled", "refund_status": "processed"}

# ================== HOTEL OWNER ROUTES ==================

@api_router.get("/extranet/bookings")
async def get_hotel_bookings(
    hotel_id: Optional[str] = None,
    status: Optional[BookingStatus] = None,
    user: User = Depends(get_current_user)
):
    await require_role(user, [UserRole.HOTEL_OWNER, UserRole.ADMIN])
    
    # Get user's hotels
    if user.role == UserRole.ADMIN and hotel_id:
        hotel_ids = [hotel_id]
    else:
        hotels = await db.hotels.find({"owner_id": user.user_id}, {"hotel_id": 1, "_id": 0}).to_list(100)
        hotel_ids = [h["hotel_id"] for h in hotels]
        if hotel_id and hotel_id in hotel_ids:
            hotel_ids = [hotel_id]
    
    query = {"hotel_id": {"$in": hotel_ids}}
    if status:
        query["status"] = status.value
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"bookings": bookings}

@api_router.put("/extranet/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, user: User = Depends(get_current_user)):
    await require_role(user, [UserRole.HOTEL_OWNER, UserRole.ADMIN])
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    hotel = await db.hotels.find_one({"hotel_id": booking["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": BookingStatus.CONFIRMED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Booking confirmed"}

# ================== ADMIN ROUTES ==================

@api_router.get("/admin/hotels")
async def admin_list_hotels(
    status: Optional[HotelStatus] = None,
    page: int = 1,
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    await require_role(user, [UserRole.ADMIN])
    
    query = {}
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    hotels = await db.hotels.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.hotels.count_documents(query)
    
    return {"hotels": hotels, "total": total, "page": page}

@api_router.put("/admin/hotels/{hotel_id}/approve")
async def approve_hotel(hotel_id: str, user: User = Depends(get_current_user)):
    await require_role(user, [UserRole.ADMIN])
    
    result = await db.hotels.update_one(
        {"hotel_id": hotel_id},
        {"$set": {"status": HotelStatus.APPROVED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    return {"message": "Hotel approved"}

@api_router.put("/admin/hotels/{hotel_id}/reject")
async def reject_hotel(hotel_id: str, user: User = Depends(get_current_user)):
    await require_role(user, [UserRole.ADMIN])
    
    result = await db.hotels.update_one(
        {"hotel_id": hotel_id},
        {"$set": {"status": HotelStatus.REJECTED.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    return {"message": "Hotel rejected"}

@api_router.get("/admin/users")
async def admin_list_users(
    role: Optional[UserRole] = None,
    page: int = 1,
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    await require_role(user, [UserRole.ADMIN])
    
    query = {}
    if role:
        query["role"] = role.value
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "page": page}

@api_router.get("/admin/bookings")
async def admin_list_bookings(
    status: Optional[BookingStatus] = None,
    page: int = 1,
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    await require_role(user, [UserRole.ADMIN])
    
    query = {}
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    bookings = await db.bookings.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.bookings.count_documents(query)
    
    return {"bookings": bookings, "total": total, "page": page}

@api_router.get("/admin/stats")
async def admin_stats(user: User = Depends(get_current_user)):
    await require_role(user, [UserRole.ADMIN])
    
    total_hotels = await db.hotels.count_documents({})
    pending_hotels = await db.hotels.count_documents({"status": HotelStatus.PENDING.value})
    approved_hotels = await db.hotels.count_documents({"status": HotelStatus.APPROVED.value})
    
    total_users = await db.users.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"status": BookingStatus.CONFIRMED.value})
    
    # Revenue calculation (mock)
    bookings = await db.bookings.find({"payment_status": PaymentStatus.PAID.value}, {"total_price": 1, "_id": 0}).to_list(10000)
    total_revenue = sum(b.get("total_price", 0) for b in bookings)
    
    return {
        "hotels": {"total": total_hotels, "pending": pending_hotels, "approved": approved_hotels},
        "users": {"total": total_users},
        "bookings": {"total": total_bookings, "confirmed": confirmed_bookings},
        "revenue": {"total": total_revenue, "currency": "TRY"}
    }

# ================== IYZICO PAYMENT ROUTES ==================

@api_router.get("/payment/status")
async def get_payment_system_status():
    """Check if iyzico payment is enabled"""
    return {
        "iyzico_enabled": IYZICO_ENABLED,
        "payment_mode": "live" if IYZICO_ENABLED else "mock",
        "message": "iyzico ödeme sistemi aktif" if IYZICO_ENABLED else "Mock ödeme modu (iyzico API anahtarları gerekli)"
    }

@api_router.post("/payment/initialize", response_model=PaymentInitResponse)
async def initialize_payment(request: PaymentInitRequest):
    """Initialize iyzico checkout form for a booking"""
    
    # Get booking
    booking = await db.bookings.find_one({"booking_id": request.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")
    
    if booking["payment_status"] == PaymentStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Bu rezervasyon zaten ödenmiş")
    
    # If iyzico is not enabled, return mock response
    if not IYZICO_ENABLED:
        return PaymentInitResponse(
            status="mock_mode",
            token=None,
            checkout_form_content=None,
            payment_page_url=None,
            message="iyzico API anahtarları yapılandırılmamış. Mock ödeme modu aktif.",
            booking_id=request.booking_id,
            total_price=booking["total_price"],
            currency=booking["currency"]
        )
    
    # Get hotel info for address
    hotel = await db.hotels.find_one({"hotel_id": booking["hotel_id"]}, {"_id": 0})
    
    guest = booking["guest_info"]
    conversation_id = f"conv_{booking['booking_id']}_{int(datetime.now().timestamp())}"
    
    # Prepare checkout form request
    checkout_request = {
        'locale': 'tr',
        'conversationId': conversation_id,
        'price': str(booking["total_price"]),
        'paidPrice': str(booking["total_price"]),
        'currency': booking["currency"],
        'basketId': f"basket_{booking['booking_id']}",
        'paymentGroup': 'PRODUCT',
        'callbackUrl': f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment/callback?booking_id={booking['booking_id']}",
        'enabledInstallments': [1, 2, 3, 6, 9, 12],
        'buyer': {
            'id': booking.get("user_id") or f"guest_{booking['booking_id']}",
            'name': guest["first_name"],
            'surname': guest["last_name"],
            'email': guest["email"],
            'gsmNumber': guest["phone"].replace(" ", "").replace("-", ""),
            'identityNumber': '11111111111',  # TC Kimlik - required by iyzico
            'registrationAddress': hotel["address"]["street"] if hotel else 'Turkey',
            'city': hotel["address"]["city"] if hotel else 'Istanbul',
            'country': 'Turkey',
            'zipCode': hotel["address"].get("postal_code", "34000") if hotel else '34000'
        },
        'shippingAddress': {
            'contactName': f"{guest['first_name']} {guest['last_name']}",
            'address': hotel["address"]["street"] if hotel else 'Hotel Address',
            'city': hotel["address"]["city"] if hotel else 'Istanbul',
            'country': 'Turkey',
            'zipCode': hotel["address"].get("postal_code", "34000") if hotel else '34000'
        },
        'billingAddress': {
            'contactName': f"{guest['first_name']} {guest['last_name']}",
            'address': hotel["address"]["street"] if hotel else 'Hotel Address',
            'city': hotel["address"]["city"] if hotel else 'Istanbul',
            'country': 'Turkey',
            'zipCode': hotel["address"].get("postal_code", "34000") if hotel else '34000'
        },
        'basketItems': [
            {
                'id': booking['booking_id'],
                'name': f"Otel Rezervasyonu - {booking['hotel_name']}",
                'category1': 'Konaklama',
                'category2': 'Otel',
                'itemType': 'VIRTUAL',
                'price': str(booking["total_price"])
            }
        ]
    }
    
    try:
        checkout_form = iyzipay.CheckoutFormInitialize()
        result = checkout_form.create(checkout_request, get_iyzico_options())
        response_data = json.loads(result.read().decode('utf-8'))
        
        if response_data.get('status') != 'success':
            logger.error(f"iyzico init failed: {response_data}")
            raise HTTPException(
                status_code=400, 
                detail=f"Ödeme başlatılamadı: {response_data.get('errorMessage', 'Bilinmeyen hata')}"
            )
        
        # Store payment session in database
        payment_session = {
            "session_id": f"session_{uuid.uuid4().hex[:12]}",
            "booking_id": booking["booking_id"],
            "conversation_id": conversation_id,
            "token": response_data.get('token'),
            "status": "pending",
            "amount": booking["total_price"],
            "currency": booking["currency"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        }
        await db.payment_sessions.insert_one(payment_session)
        
        return PaymentInitResponse(
            status="success",
            token=response_data.get('token'),
            checkout_form_content=response_data.get('checkoutFormContent'),
            payment_page_url=response_data.get('paymentPageUrl'),
            message="Ödeme formu hazır",
            booking_id=booking["booking_id"],
            total_price=booking["total_price"],
            currency=booking["currency"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"iyzico error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ödeme sistemi hatası: {str(e)}")

@api_router.post("/payment/callback")
async def payment_callback(token: str = Form(...)):
    """Handle callback from iyzico after payment"""
    
    if not IYZICO_ENABLED:
        raise HTTPException(status_code=400, detail="iyzico not configured")
    
    try:
        # Retrieve payment result
        checkout_form = iyzipay.CheckoutFormRetrieve()
        result = checkout_form.retrieve({'token': token}, get_iyzico_options())
        response_data = json.loads(result.read().decode('utf-8'))
        
        # Find payment session
        session = await db.payment_sessions.find_one({"token": token}, {"_id": 0})
        if not session:
            logger.error(f"Payment session not found for token: {token}")
            raise HTTPException(status_code=404, detail="Ödeme oturumu bulunamadı")
        
        booking_id = session["booking_id"]
        now = datetime.now(timezone.utc).isoformat()
        
        # Create payment record
        payment_record = {
            "payment_id": f"pay_{uuid.uuid4().hex[:12]}",
            "booking_id": booking_id,
            "iyzico_payment_id": response_data.get('paymentId'),
            "conversation_id": response_data.get('conversationId'),
            "token": token,
            "amount": float(response_data.get('paidPrice', 0)),
            "currency": response_data.get('currency', 'TRY'),
            "status": response_data.get('paymentStatus', 'FAILURE'),
            "fraud_status": response_data.get('fraudStatus'),
            "card_last_four": response_data.get('lastFourDigits'),
            "card_type": response_data.get('cardAssociation'),
            "card_family": response_data.get('cardFamily'),
            "installment": response_data.get('installment'),
            "raw_response": response_data,
            "created_at": now,
            "completed_at": now if response_data.get('paymentStatus') == 'SUCCESS' else None
        }
        await db.payments.insert_one(payment_record)
        
        # Update payment session
        await db.payment_sessions.update_one(
            {"token": token},
            {"$set": {"status": "completed", "completed_at": now}}
        )
        
        # Update booking status
        if response_data.get('paymentStatus') == 'SUCCESS' and response_data.get('fraudStatus') != -1:
            await db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": {
                    "status": BookingStatus.CONFIRMED.value,
                    "payment_status": PaymentStatus.PAID.value,
                    "updated_at": now
                }}
            )
            
            # Send confirmation email
            booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
            if booking:
                email_html = get_booking_confirmation_email(booking, booking["hotel_name"])
                asyncio.create_task(send_email(
                    booking["guest_info"]["email"],
                    f"Rezervasyon Onaylandı - {booking['booking_ref']}",
                    email_html
                ))
            
            return {"status": "success", "booking_id": booking_id, "message": "Ödeme başarılı"}
        else:
            await db.bookings.update_one(
                {"booking_id": booking_id},
                {"$set": {
                    "payment_status": PaymentStatus.FAILED.value,
                    "updated_at": now
                }}
            )
            return {"status": "failed", "booking_id": booking_id, "message": "Ödeme başarısız"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ödeme doğrulama hatası: {str(e)}")

@api_router.get("/payment/retrieve/{token}")
async def retrieve_payment(token: str):
    """Retrieve payment result by token (for frontend polling)"""
    
    if not IYZICO_ENABLED:
        # Return mock success for testing
        session = await db.payment_sessions.find_one({"token": token}, {"_id": 0})
        if session:
            return {
                "status": "success",
                "booking_id": session["booking_id"],
                "payment_status": "SUCCESS",
                "message": "Mock ödeme - başarılı"
            }
        raise HTTPException(status_code=404, detail="Ödeme oturumu bulunamadı")
    
    try:
        checkout_form = iyzipay.CheckoutFormRetrieve()
        result = checkout_form.retrieve({'token': token}, get_iyzico_options())
        response_data = json.loads(result.read().decode('utf-8'))
        
        return {
            "status": response_data.get('status'),
            "payment_status": response_data.get('paymentStatus'),
            "booking_id": response_data.get('basketId', '').replace('basket_', ''),
            "amount": response_data.get('paidPrice'),
            "currency": response_data.get('currency'),
            "card_last_four": response_data.get('lastFourDigits'),
            "card_type": response_data.get('cardAssociation'),
            "message": response_data.get('errorMessage') if response_data.get('status') != 'success' else 'Ödeme başarılı'
        }
    except Exception as e:
        logger.error(f"Payment retrieve error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ödeme sorgulama hatası: {str(e)}")

@api_router.get("/payment/booking/{booking_id}", response_model=PaymentStatusResponse)
async def get_booking_payment_status(booking_id: str):
    """Get payment status for a booking"""
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")
    
    # Check for payment record
    payment = await db.payments.find_one({"booking_id": booking_id}, {"_id": 0})
    
    return PaymentStatusResponse(
        booking_id=booking_id,
        payment_id=payment.get("payment_id") if payment else None,
        status=booking["payment_status"],
        amount=booking["total_price"],
        currency=booking["currency"],
        card_last_four=payment.get("card_last_four") if payment else None,
        card_type=payment.get("card_type") if payment else None,
        created_at=payment.get("created_at") if payment else None,
        completed_at=payment.get("completed_at") if payment else None
    )

@api_router.post("/payment/mock-complete/{booking_id}")
async def mock_complete_payment(booking_id: str):
    """Complete payment in mock mode (for testing without iyzico)"""
    
    if IYZICO_ENABLED:
        raise HTTPException(status_code=400, detail="Mock ödeme modu sadece iyzico devre dışıyken kullanılabilir")
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")
    
    if booking["payment_status"] == PaymentStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Bu rezervasyon zaten ödenmiş")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update booking
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": BookingStatus.CONFIRMED.value,
            "payment_status": PaymentStatus.PAID.value,
            "updated_at": now
        }}
    )
    
    # Create mock payment record
    payment_record = {
        "payment_id": f"mock_pay_{uuid.uuid4().hex[:12]}",
        "booking_id": booking_id,
        "iyzico_payment_id": None,
        "amount": booking["total_price"],
        "currency": booking["currency"],
        "status": "SUCCESS",
        "card_last_four": "0000",
        "card_type": "MOCK",
        "created_at": now,
        "completed_at": now
    }
    await db.payments.insert_one(payment_record)
    
    # Send confirmation email
    email_html = get_booking_confirmation_email(booking, booking["hotel_name"])
    asyncio.create_task(send_email(
        booking["guest_info"]["email"],
        f"Rezervasyon Onaylandı - {booking['booking_ref']}",
        email_html
    ))
    
    return {"status": "success", "message": "Mock ödeme tamamlandı", "booking_id": booking_id}

# ================== AGENCY / B2B ROUTES ==================

@api_router.post("/agencies")
async def create_agency(agency_data: AgencyCreate, user: dict = Depends(get_current_user_dict)):
    """Create a new agency account"""
    # Check if email already exists
    existing = await db.agencies.find_one({"email": agency_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta ile kayıtlı bir acenta zaten var")
    
    agency_id = f"agency_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    agency_doc = {
        "agency_id": agency_id,
        "name": agency_data.name,
        "contact_person": agency_data.contact_person,
        "email": agency_data.email,
        "phone": agency_data.phone,
        "address": agency_data.address,
        "city": agency_data.city,
        "country": agency_data.country,
        "tax_number": agency_data.tax_number,
        "website": agency_data.website,
        "status": AgencyStatus.PENDING.value,
        "credit_limit": 0.0,
        "credit_used": 0.0,
        "credit_balance": 0.0,
        "commission_rate": 10.0,
        "commission_type": CommissionType.PERCENTAGE.value,
        "markup_rate": 5.0,
        "total_bookings": 0,
        "total_revenue": 0.0,
        "owner_user_id": user.get("user_id"),
        "created_at": now.isoformat(),
        "approved_at": None
    }
    
    await db.agencies.insert_one(agency_doc)
    
    # Update user role to agency_owner
    await db.users.update_one(
        {"user_id": user.get("user_id")},
        {"$set": {"role": "agency_owner", "agency_id": agency_id}}
    )
    
    if "_id" in agency_doc:
        del agency_doc["_id"]
    
    return agency_doc

@api_router.get("/agencies")
async def list_agencies(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(get_current_user_dict)
):
    """List agencies (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    agencies = await db.agencies.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.agencies.count_documents(query)
    
    return {"agencies": agencies, "total": total, "page": page, "limit": limit}

@api_router.get("/agencies/{agency_id}")
async def get_agency(agency_id: str, user: dict = Depends(get_current_user_dict)):
    """Get agency details"""
    agency = await db.agencies.find_one({"agency_id": agency_id}, {"_id": 0})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    # Check access
    if user.get("role") != "admin" and user.get("agency_id") != agency_id:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    return agency

@api_router.put("/agencies/{agency_id}")
async def update_agency(agency_id: str, update_data: AgencyUpdate, user: dict = Depends(get_current_user_dict)):
    """Update agency details"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    # Check access - admin or agency owner
    if user.get("role") != "admin" and agency.get("owner_user_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.agencies.update_one({"agency_id": agency_id}, {"$set": update_dict})
    
    updated = await db.agencies.find_one({"agency_id": agency_id}, {"_id": 0})
    return updated

@api_router.put("/admin/agencies/{agency_id}/approve")
async def approve_agency(agency_id: str, user: dict = Depends(get_current_user_dict)):
    """Approve an agency (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.agencies.update_one(
        {"agency_id": agency_id},
        {"$set": {"status": AgencyStatus.APPROVED.value, "approved_at": now}}
    )
    
    return {"message": "Acenta onaylandı", "agency_id": agency_id}

@api_router.put("/admin/agencies/{agency_id}/credit")
async def update_agency_credit(
    agency_id: str,
    amount: float = Query(..., description="Kredi miktarı"),
    transaction_type: str = Query(..., description="credit veya debit"),
    description: str = Query("Manuel kredi işlemi"),
    user: dict = Depends(get_current_user_dict)
):
    """Update agency credit limit (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if transaction_type == "credit":
        new_limit = agency.get("credit_limit", 0) + amount
        new_balance = agency.get("credit_balance", 0) + amount
    elif transaction_type == "debit":
        new_limit = agency.get("credit_limit", 0) - amount
        new_balance = agency.get("credit_balance", 0) - amount
    else:
        raise HTTPException(status_code=400, detail="Geçersiz işlem tipi")
    
    # Create transaction record
    transaction = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "agency_id": agency_id,
        "amount": amount,
        "transaction_type": transaction_type,
        "description": description,
        "created_at": now,
        "created_by": user.get("user_id")
    }
    await db.credit_transactions.insert_one(transaction)
    
    # Update agency
    await db.agencies.update_one(
        {"agency_id": agency_id},
        {"$set": {"credit_limit": new_limit, "credit_balance": new_balance, "updated_at": now}}
    )
    
    return {"message": "Kredi güncellendi", "new_limit": new_limit, "new_balance": new_balance}

@api_router.put("/admin/agencies/{agency_id}/commission")
async def update_agency_commission(
    agency_id: str,
    commission_rate: float = Query(..., ge=0, le=100),
    markup_rate: float = Query(0, ge=0, le=100),
    user: dict = Depends(get_current_user_dict)
):
    """Update agency commission settings (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    await db.agencies.update_one(
        {"agency_id": agency_id},
        {"$set": {
            "commission_rate": commission_rate,
            "markup_rate": markup_rate,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Komisyon ayarları güncellendi", "commission_rate": commission_rate, "markup_rate": markup_rate}

# Agency Sub-Users
@api_router.post("/agencies/{agency_id}/users")
async def create_agency_user(agency_id: str, user_data: AgencyUserCreate, user: dict = Depends(get_current_user_dict)):
    """Create a sub-user for agency"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    # Check access - admin or agency owner
    if user.get("role") != "admin" and agency.get("owner_user_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kullanımda")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_doc = {
        "user_id": user_id,
        "agency_id": agency_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "password_hash": password_hash,
        "role": "agency_user",
        "agency_role": user_data.role.value,
        "is_active": True,
        "created_at": now.isoformat(),
        "last_login": None
    }
    
    await db.users.insert_one(user_doc)
    
    # Return without password
    del user_doc["password_hash"]
    if "_id" in user_doc:
        del user_doc["_id"]
    
    return user_doc

@api_router.get("/agencies/{agency_id}/users")
async def list_agency_users(agency_id: str, user: dict = Depends(get_current_user_dict)):
    """List all users in an agency"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    # Check access
    if user.get("role") != "admin" and user.get("agency_id") != agency_id:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    users = await db.users.find(
        {"agency_id": agency_id},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    return {"users": users, "total": len(users)}

@api_router.put("/agencies/{agency_id}/users/{user_id}")
async def update_agency_user(
    agency_id: str,
    user_id: str,
    update_data: AgencyUserUpdate,
    user: dict = Depends(get_current_user_dict)
):
    """Update an agency sub-user"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    # Check access
    if user.get("role") != "admin" and agency.get("owner_user_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    target_user = await db.users.find_one({"user_id": user_id, "agency_id": agency_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    update_dict = {}
    if update_data.name is not None:
        update_dict["name"] = update_data.name
    if update_data.phone is not None:
        update_dict["phone"] = update_data.phone
    if update_data.role is not None:
        update_dict["agency_role"] = update_data.role.value
    if update_data.is_active is not None:
        update_dict["is_active"] = update_data.is_active
    
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user_id}, {"$set": update_dict})
    
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.delete("/agencies/{agency_id}/users/{user_id}")
async def delete_agency_user(agency_id: str, user_id: str, user: dict = Depends(get_current_user_dict)):
    """Deactivate an agency sub-user"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    if user.get("role") != "admin" and agency.get("owner_user_id") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    result = await db.users.update_one(
        {"user_id": user_id, "agency_id": agency_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return {"message": "Kullanıcı devre dışı bırakıldı"}

# Agency Bookings
@api_router.post("/agencies/{agency_id}/bookings")
async def create_agency_booking(
    agency_id: str,
    booking_data: AgencyBookingRequest,
    user: dict = Depends(get_current_user_dict)
):
    """Create a booking on behalf of agency"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    # Check access
    if user.get("agency_id") != agency_id and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    # Check agency status
    if agency.get("status") != AgencyStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Acenta henüz onaylanmamış")
    
    # Get hotel
    hotel = await db.hotels.find_one({"hotel_id": booking_data.hotel_id, "status": "approved"})
    if not hotel:
        raise HTTPException(status_code=404, detail="Otel bulunamadı")
    
    # Calculate base price (simplified)
    total_price = 0
    for room in booking_data.rooms:
        rate_plan = await db.rate_plans.find_one({"rate_plan_id": room.get("rate_plan_id")})
        if rate_plan:
            total_price += rate_plan.get("base_price", 0) * room.get("quantity", 1)
    
    # Apply markup
    markup_rate = booking_data.markup_amount if booking_data.markup_amount else agency.get("markup_rate", 0)
    markup_amount = total_price * (markup_rate / 100)
    final_price = total_price + markup_amount
    
    # Commission calculation
    commission_rate = agency.get("commission_rate", 10)
    commission_amount = total_price * (commission_rate / 100)
    
    # Check credit if using credit
    if booking_data.use_credit:
        credit_balance = agency.get("credit_balance", 0)
        if credit_balance < total_price:
            raise HTTPException(status_code=400, detail=f"Yetersiz kredi. Mevcut: ₺{credit_balance:,.2f}, Gerekli: ₺{total_price:,.2f}")
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking_ref = generate_booking_ref()
    now = datetime.now(timezone.utc)
    
    booking_doc = {
        "booking_id": booking_id,
        "booking_ref": booking_ref,
        "agency_id": agency_id,
        "agent_user_id": user.get("user_id"),
        "hotel_id": booking_data.hotel_id,
        "hotel_name": hotel["name"].get("tr", hotel["name"].get("en", "")),
        "check_in": booking_data.check_in,
        "check_out": booking_data.check_out,
        "rooms": [r if isinstance(r, dict) else r.model_dump() for r in booking_data.rooms],
        "guest_info": booking_data.guest_info if isinstance(booking_data.guest_info, dict) else booking_data.guest_info.model_dump(),
        "adults": booking_data.adults,
        "children": booking_data.children,
        "children_ages": booking_data.children_ages,
        "base_price": total_price,
        "markup_rate": markup_rate,
        "markup_amount": markup_amount,
        "total_price": final_price,
        "commission_rate": commission_rate,
        "commission_amount": commission_amount,
        "currency": "TRY",
        "status": BookingStatus.CONFIRMED.value,
        "payment_status": PaymentStatus.PAID.value if booking_data.use_credit else PaymentStatus.PENDING.value,
        "payment_method": "credit" if booking_data.use_credit else "pending",
        "booking_source": "agency",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    
    # Deduct credit if used
    if booking_data.use_credit:
        new_balance = agency.get("credit_balance", 0) - total_price
        new_used = agency.get("credit_used", 0) + total_price
        await db.agencies.update_one(
            {"agency_id": agency_id},
            {
                "$set": {"credit_balance": new_balance, "credit_used": new_used},
                "$inc": {"total_bookings": 1, "total_revenue": final_price}
            }
        )
        
        # Record transaction
        transaction = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "agency_id": agency_id,
            "amount": total_price,
            "transaction_type": "debit",
            "description": f"Rezervasyon: {booking_ref}",
            "booking_id": booking_id,
            "created_at": now.isoformat(),
            "created_by": user.get("user_id")
        }
        await db.credit_transactions.insert_one(transaction)
    
    if "_id" in booking_doc:
        del booking_doc["_id"]
    
    return booking_doc

@api_router.get("/agencies/{agency_id}/bookings")
async def list_agency_bookings(
    agency_id: str,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(get_current_user_dict)
):
    """List bookings for an agency"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    if user.get("agency_id") != agency_id and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    query = {"agency_id": agency_id}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.bookings.count_documents(query)
    
    return {"bookings": bookings, "total": total, "page": page, "limit": limit}

@api_router.get("/agencies/{agency_id}/transactions")
async def list_agency_transactions(
    agency_id: str,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(get_current_user_dict)
):
    """List credit transactions for an agency"""
    agency = await db.agencies.find_one({"agency_id": agency_id})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    if user.get("agency_id") != agency_id and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    skip = (page - 1) * limit
    transactions = await db.credit_transactions.find(
        {"agency_id": agency_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.credit_transactions.count_documents({"agency_id": agency_id})
    
    return {"transactions": transactions, "total": total, "page": page, "limit": limit}

@api_router.get("/agencies/{agency_id}/dashboard")
async def get_agency_dashboard(agency_id: str, user: dict = Depends(get_current_user_dict)):
    """Get agency dashboard data"""
    agency = await db.agencies.find_one({"agency_id": agency_id}, {"_id": 0})
    if not agency:
        raise HTTPException(status_code=404, detail="Acenta bulunamadı")
    
    if user.get("agency_id") != agency_id and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    # Get booking stats
    total_bookings = await db.bookings.count_documents({"agency_id": agency_id})
    confirmed_bookings = await db.bookings.count_documents({"agency_id": agency_id, "status": "confirmed"})
    cancelled_bookings = await db.bookings.count_documents({"agency_id": agency_id, "status": "cancelled"})
    
    # Get revenue
    pipeline = [
        {"$match": {"agency_id": agency_id, "status": {"$in": ["confirmed", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}, "commission": {"$sum": "$commission_amount"}}}
    ]
    revenue_result = await db.bookings.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    total_commission = revenue_result[0]["commission"] if revenue_result else 0
    
    # Get recent bookings
    recent_bookings = await db.bookings.find(
        {"agency_id": agency_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get user count
    user_count = await db.users.count_documents({"agency_id": agency_id, "is_active": True})
    
    return {
        "agency": agency,
        "stats": {
            "total_bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "credit_limit": agency.get("credit_limit", 0),
            "credit_balance": agency.get("credit_balance", 0),
            "credit_used": agency.get("credit_used", 0),
            "user_count": user_count
        },
        "recent_bookings": recent_bookings
    }

# ================== UTILITY ROUTES ==================

@api_router.get("/cities")
async def get_cities():
    """Get list of available cities"""
    cities = [
        {"code": "IST", "name": {"en": "Istanbul", "tr": "İstanbul", "de": "Istanbul"}},
        {"code": "AYT", "name": {"en": "Antalya", "tr": "Antalya", "de": "Antalya"}},
        {"code": "BJV", "name": {"en": "Bodrum", "tr": "Bodrum", "de": "Bodrum"}},
        {"code": "DLM", "name": {"en": "Dalaman", "tr": "Dalaman", "de": "Dalaman"}},
        {"code": "IZM", "name": {"en": "Izmir", "tr": "İzmir", "de": "Izmir"}},
        {"code": "ANK", "name": {"en": "Ankara", "tr": "Ankara", "de": "Ankara"}},
        {"code": "FET", "name": {"en": "Fethiye", "tr": "Fethiye", "de": "Fethiye"}},
        {"code": "CAP", "name": {"en": "Cappadocia", "tr": "Kapadokya", "de": "Kappadokien"}},
        {"code": "MUG", "name": {"en": "Marmaris", "tr": "Marmaris", "de": "Marmaris"}},
        {"code": "CES", "name": {"en": "Cesme", "tr": "Çeşme", "de": "Çeşme"}},
    ]
    return {"cities": cities}

@api_router.get("/amenities")
async def get_amenities():
    """Get list of all amenities with translations"""
    room_amenities = [
        {"code": a.value, "name": {"en": a.value.replace("_", " ").title(), "tr": a.value.replace("_", " ").title()}}
        for a in RoomAmenity
    ]
    property_amenities = [
        {"code": a.value, "name": {"en": a.value.replace("_", " ").title(), "tr": a.value.replace("_", " ").title()}}
        for a in PropertyAmenity
    ]
    return {"room_amenities": room_amenities, "property_amenities": property_amenities}

@api_router.get("/")
async def root():
    return {"message": "Hotel Booking Platform API", "version": "1.0.0"}

# ================== IMAGE UPLOAD ROUTES ==================

@api_router.post("/upload/hotel/{hotel_id}")
async def upload_hotel_image(
    hotel_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload hotel photo"""
    # Verify hotel ownership
    hotel = await db.hotels.find_one({"hotel_id": hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate file type
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: jpg, jpeg, png, gif, webp")
    
    # Upload to storage
    path = f"{APP_NAME}/hotels/{hotel_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, "application/octet-stream")
    
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    # Store reference in files collection
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    await db.files.insert_one({
        "file_id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "entity_type": "hotel",
        "entity_id": hotel_id,
        "uploaded_by": user.user_id,
        "is_deleted": False,
        "created_at": now.isoformat()
    })
    
    # Add to hotel photos array
    await db.hotels.update_one(
        {"hotel_id": hotel_id},
        {"$push": {"photos": result["path"]}}
    )
    
    return {"file_id": file_id, "path": result["path"], "message": "Photo uploaded successfully"}

@api_router.post("/upload/room/{room_id}")
async def upload_room_image(
    room_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload room photo"""
    # Verify room ownership
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    hotel = await db.hotels.find_one({"hotel_id": room["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel["owner_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate file type
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Upload to storage
    path = f"{APP_NAME}/rooms/{room_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, "application/octet-stream")
    
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    # Store reference
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    await db.files.insert_one({
        "file_id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "entity_type": "room",
        "entity_id": room_id,
        "uploaded_by": user.user_id,
        "is_deleted": False,
        "created_at": now.isoformat()
    })
    
    # Add to room photos array
    await db.rooms.update_one(
        {"room_id": room_id},
        {"$push": {"photos": result["path"]}}
    )
    
    return {"file_id": file_id, "path": result["path"], "message": "Photo uploaded successfully"}

@api_router.get("/files/{path:path}")
async def get_file(path: str, auth: str = Query(None)):
    """Serve file from storage. Supports query param auth for img src tags."""
    # Try to get file record
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=record.get("content_type", content_type) if record else content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, user: User = Depends(get_current_user)):
    """Soft delete a file"""
    file_record = await db.files.find_one({"file_id": file_id, "is_deleted": False}, {"_id": 0})
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check ownership
    if user.role != UserRole.ADMIN and file_record["uploaded_by"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Soft delete
    await db.files.update_one({"file_id": file_id}, {"$set": {"is_deleted": True}})
    
    # Remove from entity photos array
    if file_record["entity_type"] == "hotel":
        await db.hotels.update_one(
            {"hotel_id": file_record["entity_id"]},
            {"$pull": {"photos": file_record["storage_path"]}}
        )
    elif file_record["entity_type"] == "room":
        await db.rooms.update_one(
            {"room_id": file_record["entity_id"]},
            {"$pull": {"photos": file_record["storage_path"]}}
        )
    
    return {"message": "File deleted"}

# ================== REVIEW ROUTES ==================

@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, user: User = Depends(get_current_user)):
    """Create a review for a completed booking"""
    # Verify booking exists and belongs to user
    booking = await db.bookings.find_one({"booking_id": review_data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.get("user_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to review this booking")
    
    # Check if checkout date has passed
    checkout_date = datetime.strptime(booking["check_out"], "%Y-%m-%d")
    if checkout_date > datetime.now():
        raise HTTPException(status_code=400, detail="Can only review after checkout")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({"booking_id": review_data.booking_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Booking already reviewed")
    
    review_id = f"review_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    review_doc = {
        "review_id": review_id,
        "hotel_id": review_data.hotel_id,
        "booking_id": review_data.booking_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "rating": review_data.rating,
        "title": review_data.title,
        "comment": review_data.comment,
        "categories": review_data.categories,
        "created_at": now.isoformat(),
        "response": None,
        "response_at": None
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update hotel rating
    await update_hotel_rating(review_data.hotel_id)
    
    if "_id" in review_doc:
        del review_doc["_id"]
    return review_doc

async def update_hotel_rating(hotel_id: str):
    """Recalculate and update hotel average rating"""
    pipeline = [
        {"$match": {"hotel_id": hotel_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    
    if result:
        await db.hotels.update_one(
            {"hotel_id": hotel_id},
            {"$set": {
                "rating_average": round(result[0]["avg"], 1),
                "rating_count": result[0]["count"]
            }}
        )

@api_router.get("/reviews/hotel/{hotel_id}")
async def get_hotel_reviews(hotel_id: str, page: int = 1, limit: int = 10):
    """Get reviews for a hotel"""
    skip = (page - 1) * limit
    reviews = await db.reviews.find({"hotel_id": hotel_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.reviews.count_documents({"hotel_id": hotel_id})
    
    return {"reviews": reviews, "total": total, "page": page}

@api_router.get("/reviews/booking/{booking_id}")
async def get_booking_review(booking_id: str):
    """Get review for a specific booking"""
    review = await db.reviews.find_one({"booking_id": booking_id}, {"_id": 0})
    return {"review": review}

@api_router.post("/reviews/{review_id}/respond")
async def respond_to_review(review_id: str, response_data: ReviewResponse, user: User = Depends(get_current_user)):
    """Hotel owner responds to a review"""
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify hotel ownership
    hotel = await db.hotels.find_one({"hotel_id": review["hotel_id"]}, {"_id": 0})
    if user.role != UserRole.ADMIN and hotel.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.reviews.update_one(
        {"review_id": review_id},
        {"$set": {
            "response": response_data.response,
            "response_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Response added"}

@api_router.get("/reviews/pending")
async def get_pending_reviews(user: User = Depends(get_current_user)):
    """Get bookings that can be reviewed (completed, not yet reviewed)"""
    # Get user's completed bookings
    bookings = await db.bookings.find({
        "user_id": user.user_id,
        "status": {"$in": [BookingStatus.CONFIRMED.value, BookingStatus.COMPLETED.value]}
    }, {"_id": 0}).to_list(100)
    
    pending = []
    now = datetime.now()
    
    for booking in bookings:
        checkout_date = datetime.strptime(booking["check_out"], "%Y-%m-%d")
        if checkout_date < now:
            # Check if already reviewed
            existing = await db.reviews.find_one({"booking_id": booking["booking_id"]}, {"_id": 0})
            if not existing:
                pending.append(booking)
    
    return {"bookings": pending}

# Include router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
