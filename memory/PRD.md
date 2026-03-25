# Metro Travel - Hotel Booking Platform PRD

## Original Problem Statement
Build a scalable, production-ready Hotel Booking & Travel Platform similar to Booking.com / Expedia / Agoda, tailored for the Turkey market and designed to be white-label and clonable.

## Branding
- **Name**: Metro Travel
- **Logo**: Orange "M" on dark navy background
- **Color Scheme**: 
  - Primary: Dark Navy (metro-navy: hsl(220, 70%, 12%))
  - Accent: Metro Orange (metro-orange: hsl(24, 95%, 53%))
- **Languages**: Turkish (TR), English (EN), German (DE)

## User Personas
1. **Travelers (B2C Customers)**: Domestic and international tourists looking for hotels in Turkey
2. **Hotel Owners**: Property managers who want to list and manage their hotels
3. **Platform Administrators**: Super admins who approve hotels, manage users, and monitor bookings

## Core Requirements (Static)
- Hotel Extranet Panel for hotel owners
- B2C Customer Platform with full booking flow
- Admin Panel for platform management
- JWT + Google OAuth authentication
- Mock payment system (modular for future real payment integration)
- Multi-language support (EN, TR, DE)
- ENUM-based structured data for amenities, room types, etc.

---

## What's Been Implemented

### MVP (March 2026)
- ✅ Complete authentication system (JWT + Emergent Google OAuth)
- ✅ User management with roles (customer, hotel_owner, admin)
- ✅ Hotel CRUD with approval workflow
- ✅ Room management with bed configurations
- ✅ Rate plans (refundable/non-refundable, meal plans)
- ✅ Inventory management (date-based pricing & availability)
- ✅ Search with filters (city, price, stars, amenities)
- ✅ Booking creation with mock payment
- ✅ Admin endpoints for hotel approval, user management
- ✅ ENUM-based structured data throughout
- ✅ Multi-language i18n (EN, TR, DE)

### Phase 2 (March 2026)
- ✅ **Image Upload**: Object Storage integration for hotel and room photos
- ✅ **Email System**: Resend integration ready (booking confirmation, cancellation emails)
- ✅ **Review System**: Complete review/rating system with:
  - Overall rating (1-10)
  - Category ratings (cleanliness, comfort, location, facilities, staff, value)
  - Hotel owner responses
  - Reviews displayed on hotel detail page
  - Write review dialog for past bookings

### Phase 3 (March 24, 2026)
- ✅ **Metro Travel Rebranding**: Complete UI overhaul
  - New brand name: "Metro Travel" (formerly HotelConnect)
  - New color scheme: Dark navy + Metro orange
  - Updated logo: Orange "M" with white text
  - All pages updated for brand consistency
- ✅ **N+1 Query Performance Fix**: Optimized hotel search with MongoDB aggregation pipeline
- ✅ **Turkish Localization**: Full Turkish language support verified
- ✅ **Deployment Ready**: All deployment blockers resolved
- ✅ **iyzico Payment Integration**: Complete payment gateway integration
  - Checkout form initialization API
  - Payment callback handling
  - Payment status retrieval
  - Mock mode for testing (works without API keys)
  - PaymentPage.jsx for payment UI
  - Automatic booking confirmation on successful payment

### Phase 4 (March 25, 2026)
- ✅ **Seed Data & Testing**: Comprehensive test data created
  - 2 Approved Hotels: Grand Sultan Hotel (Istanbul, 5-star), Bodrum Bay Resort (Bodrum, 4-star)
  - 5 Room Types with various bed configurations
  - 7 Rate Plans (Room Only, Breakfast, All Inclusive, Non-refundable)
  - April 2025 inventory for all rooms
  - Test users: Admin, 2 Hotel Owners, 2 Customers
  - 1 Test booking (Elif Demir - ₺5,800)
- ✅ **Full Frontend Testing**: All panels verified
  - B2C: Homepage, Search, Hotel Detail, Booking flow
  - Extranet: Dashboard, Property, Rooms, Pricing, Reservations
  - Admin: Dashboard, Hotels, Users, Bookings
- ✅ **Enhanced Edit Property Page**: Comprehensive property management
  - 5 Organized Tabs: General, Translations, Amenities, Policies, Photos
  - Full Turkish localization (TR/EN/DE)
  - 27 Property Amenities with categories and icons
  - Cancellation policy options
  - Children, Pet, Smoking policies
  - Early check-in / Late check-out options
  - Additional info: Total rooms, Year built, Last renovation
  - Location with coordinates (latitude/longitude)
- ✅ **Enhanced Room Management**: 16 Room Types
  - Standard, Superior, Deluxe, Premium
  - Junior Suite, Suite, Executive Suite, Presidential Suite
  - Family Room, Connecting Rooms, Duplex
  - Studio, Apartment, Villa, Bungalow, Penthouse
  - 25+ Room Amenities (Wi-Fi, Klima, Deniz Manzarası, Jakuzi, etc.)
  - Connecting room support
- ✅ **Advanced Pricing System with 20 Markets**
  - Monthly calendar view for pricing
  - **20 Market/Country Pricing:**
    🇹🇷 Turkey, 🇩🇪 Germany, 🇬🇧 UK, 🇫🇷 France, 🇳🇱 Netherlands
    🇧🇪 Belgium, 🇷🇺 Russia, 🇺🇦 Ukraine, 🇵🇱 Poland, 🇺🇸 USA
    🇨🇦 Canada, 🇦🇺 Australia, 🇮🇹 Italy, 🇪🇸 Spain, 🇦🇹 Austria
    🇨🇭 Switzerland, 🇸🇪 Sweden, 🇳🇴 Norway, 🇩🇰 Denmark, 🇸🇦 Saudi Arabia
  - Local TR, Corporate, Dynamic Package pricing
  - Bulk update with weekday/weekend filters
  - Stop sale, min stay options
- ✅ **B2B Agency Panel** (COMPLETED - March 25, 2026)
  - **Agency Registration**: Travel agencies can apply to join B2B platform
  - **Admin Agency Management** (/admin/agencies):
    - List all agencies with status filtering
    - Approve/reject agency applications
    - Credit limit management (add/deduct credit)
    - Commission rate and markup settings
  - **Agency Dashboard** (/agency):
    - Welcome message with agency status
    - Credit stats (limit, available, used)
    - Booking stats (total, confirmed, revenue)
    - Commission info display
    - Quick action cards
    - Recent bookings list
  - **Agency User Management** (/agency/users):
    - Add sub-users with roles (Admin, Agent, Finance)
    - Edit user details and role
    - Deactivate/activate users
  - **Agency Bookings** (/agency/bookings):
    - View all agency bookings
    - Search by reference, hotel, guest
    - Filter by status (confirmed, pending, cancelled)
    - Commission tracking per booking
  - **Agency Transactions** (/agency/transactions):
    - Credit balance cards
    - Full transaction history
    - Credit/debit tracking with descriptions
  - **Agency Settings** (/agency/settings):
    - Company info management
    - Financial tab (view commission/credit info)
  - **Test Agency**: ABC Turizm (elif@gmail.com), ₺50,000 credit, 10% commission

- ✅ **Premium Registration Pages** (COMPLETED - March 25, 2026)
  - **Agency Registration** (/agency/register):
    - Split-screen premium design
    - Left pane: Hero with Turkish B2B benefits, stats (2,500+ Otel, 500+ Acenta, ₺50M+)
    - Right pane: 3-step form (Firma → İletişim → Konum)
    - Trust badges (SSL, TÜRSAB, 24 Saat Onay)
    - Mobile responsive design
  - **Hotel Registration** (/extranet/register):
    - Split-screen premium design
    - Left pane: Hero with metrics (+50% Doluluk, 100+ Ülke, %0 Kayıt)
    - Right pane: 4-step form (Temel → Konum → Özellikler → Fotoğraflar)
    - 20 Turkish cities, 8 property types, 12 amenity options
    - Photo upload with drag & drop
    - Multi-language support (TR/EN)

### Technical Stack
- Backend: FastAPI + MongoDB
- Frontend: React + Tailwind CSS + Shadcn UI
- Auth: JWT + Emergent Google OAuth
- Storage: Emergent Object Storage
- Email: Resend (ready, needs API key)
- Payment: **iyzico** (integrated, needs API keys for production)

---

## Prioritized Backlog

### P0 - Critical (Required for Production)
- [ ] Configure Resend API key for email sending
- [x] ~~Real payment integration (iyzico for Turkey)~~ **DONE - March 24, 2026**
- [ ] Configure iyzico API keys (IYZICO_API_KEY, IYZICO_SECRET_KEY)
- [ ] Password reset flow

### P1 - High Priority (Phase 4)
- [x] ~~B2B Agency Panel with commission management~~ **DONE - March 25, 2026**
- [ ] Backend support for Market-based pricing (20 markets UI exists, backend schema update needed)
- [ ] Cancellation workflow with refund processing
- [ ] Search by map location

### P2 - Medium Priority
- [ ] Promotion/coupon system
- [ ] Saved hotels (wishlist)
- [ ] Multiple currency support
- [ ] Property analytics dashboard

### P3 - Future Enhancements
- [ ] External OTA integrations
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] Chat support system

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@metrotravel.com | admin123456 |
| Hotel Owner 1 | ahmet@grandsultanhotel.com | hotel123456 |
| Hotel Owner 2 | mehmet@bodrumresort.com | hotel123456 |
| Customer 1 | can@outlook.com | customer123 |
| Agency Owner | elif@gmail.com | customer123 |

---

## B2B Agency Panel

### Features
- Agency registration and approval workflow
- Credit system (admin-managed credit limits)
- Commission and markup rates
- Sub-user management with roles (Admin, Agent, Finance)
- Agency-specific bookings and transactions

### Agency API Endpoints
- `POST /api/agencies` - Register new agency
- `GET /api/agencies` - List agencies (admin only)
- `GET /api/agencies/{id}` - Get agency details
- `PUT /api/agencies/{id}` - Update agency
- `PUT /api/admin/agencies/{id}/approve` - Approve agency
- `PUT /api/admin/agencies/{id}/credit` - Manage credit
- `PUT /api/admin/agencies/{id}/commission` - Set commission
- `POST /api/agencies/{id}/users` - Add sub-user
- `GET /api/agencies/{id}/users` - List sub-users
- `PUT /api/agencies/{id}/users/{user_id}` - Update sub-user
- `DELETE /api/agencies/{id}/users/{user_id}` - Deactivate sub-user
- `GET /api/agencies/{id}/bookings` - List agency bookings
- `POST /api/agencies/{id}/bookings` - Create booking
- `GET /api/agencies/{id}/transactions` - Credit transactions
- `GET /api/agencies/{id}/dashboard` - Dashboard data

### Test Agency
- **Name**: ABC Turizm
- **Owner**: Elif Demir (elif@gmail.com)
- **Status**: Approved
- **Credit**: ₺50,000
- **Commission**: 10%
- **Markup**: 5%

---

## iyzico Payment Integration

### Environment Variables Required
```
IYZICO_API_KEY=sandbox-xxx (or live key)
IYZICO_SECRET_KEY=sandbox-xxx (or live key)
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com (or https://api.iyzipay.com for production)
```

### API Endpoints
- `GET /api/payment/status` - Check if iyzico is enabled
- `POST /api/payment/initialize` - Initialize checkout form
- `POST /api/payment/callback` - Handle payment callback
- `GET /api/payment/retrieve/{token}` - Get payment result
- `GET /api/payment/booking/{booking_id}` - Get payment status for booking
- `POST /api/payment/mock-complete/{booking_id}` - Complete payment in mock mode

### Test Cards (Sandbox)
- Success: `5528790000000008` (Halkbank Master Card)
- Failure: `4111111111111129` (Insufficient funds)
- Any expiry date and CVV

---

## Next Tasks
1. Configure iyzico API keys for production
2. Get Resend API key and enable email notifications
3. Backend schema update for 20-market pricing (frontend UI exists)
4. Implement password reset flow
5. Add map view for search results

## Test Reports
- `/app/test_reports/iteration_6.json` - Premium Registration Pages (100% pass rate)
- `/app/test_reports/iteration_5.json` - B2B Agency Panel (100% pass rate)
- `/app/test_reports/iteration_4.json` - Extranet Pricing
- `/app/test_reports/iteration_3.json` - Brand & Core features
- Backend: 23/23 Agency tests passed
- Frontend: All panels fully functional
