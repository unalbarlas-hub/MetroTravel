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
- [ ] B2B Agency Panel with commission management
- [ ] Advanced pricing rules (seasonal, weekday/weekend)
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
3. Build B2B agency panel with commission management
4. Implement password reset flow
5. Add map view for search results

## Test Reports
- `/app/test_reports/iteration_3.json` - Latest test (100% pass rate)
- Backend: 22/22 tests passed
- Frontend: All branding and functionality tests passed
