from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request, Response
from fastapi.responses import JSONResponse
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

# Create the main app
app = FastAPI(title="Hotel Booking Platform API", version="1.0.0")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== ENUMS ==================

class UserRole(str, Enum):
    CUSTOMER = "customer"
    HOTEL_OWNER = "hotel_owner"
    ADMIN = "admin"

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
        "token": token
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
        "preferred_currency": user.preferred_currency
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
    query = {"status": HotelStatus.APPROVED.value}
    
    if params.city:
        query["address.city"] = {"$regex": params.city, "$options": "i"}
    
    if params.star_ratings:
        query["star_rating"] = {"$in": params.star_ratings}
    
    if params.property_types:
        query["property_type"] = {"$in": [pt.value for pt in params.property_types]}
    
    if params.amenities:
        query["property_amenities"] = {"$all": [a.value for a in params.amenities]}
    
    # Get hotels
    hotels = await db.hotels.find(query, {"_id": 0}).to_list(1000)
    
    results = []
    for hotel in hotels:
        # Get minimum price for the date range
        rooms = await db.rooms.find({"hotel_id": hotel["hotel_id"], "is_active": True}, {"_id": 0}).to_list(100)
        
        min_price = float('inf')
        has_availability = False
        
        for room in rooms:
            # Check if room fits guests
            if room["max_adults"] < params.adults:
                continue
            
            # Get rate plans
            rate_plans = await db.rate_plans.find({"room_id": room["room_id"], "is_active": True}, {"_id": 0}).to_list(10)
            
            for rp in rate_plans:
                # Check inventory for all nights
                inventory = await db.inventory.find({
                    "room_id": room["room_id"],
                    "rate_plan_id": rp["rate_plan_id"],
                    "date": {"$gte": params.check_in, "$lt": params.check_out},
                    "available_units": {"$gt": 0}
                }, {"_id": 0}).to_list(365)
                
                if len(inventory) > 0:
                    has_availability = True
                    total_price = sum(inv["price"] for inv in inventory)
                    if total_price < min_price:
                        min_price = total_price
                elif not inventory:
                    # No inventory set - use base price
                    has_availability = True
                    if rp["base_price"] < min_price:
                        min_price = rp["base_price"]
        
        if min_price == float('inf'):
            min_price = 0
        
        # Apply price filters
        if params.min_price and min_price < params.min_price:
            continue
        if params.max_price and min_price > params.max_price:
            continue
        
        results.append({
            "hotel_id": hotel["hotel_id"],
            "name": hotel["name"].get("en", hotel["name"].get("tr", "")),
            "property_type": hotel["property_type"],
            "star_rating": hotel["star_rating"],
            "address": hotel["address"],
            "rating_average": hotel.get("rating_average", 0),
            "rating_count": hotel.get("rating_count", 0),
            "photo": hotel["photos"][0] if hotel.get("photos") else None,
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
    start = (params.page - 1) * params.limit
    end = start + params.limit
    paginated = results[start:end]
    
    return {
        "results": paginated,
        "total": len(results),
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
        "status": BookingStatus.CONFIRMED.value,  # Mock payment - auto confirm
        "payment_status": PaymentStatus.PAID.value,  # Mock payment
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    if "_id" in booking_doc:
        del booking_doc["_id"]
    
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
