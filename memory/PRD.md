# HotelConnect - Hotel Booking Platform PRD

## Original Problem Statement
Build a scalable, production-ready Hotel Booking & Travel Platform similar to Booking.com / Expedia / Agoda, tailored for the Turkey market and designed to be white-label and clonable.

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

### Technical Stack
- Backend: FastAPI + MongoDB
- Frontend: React + Tailwind CSS + Shadcn UI
- Auth: JWT + Emergent Google OAuth
- Storage: Emergent Object Storage
- Email: Resend (ready, needs API key)
- Payment: MOCKED (modular for iyzico)

---

## Prioritized Backlog

### P0 - Critical (Required for Production)
- [ ] Configure Resend API key for email sending
- [ ] Real payment integration (iyzico for Turkey)
- [ ] Password reset flow

### P1 - High Priority (Phase 3)
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

## Next Tasks
1. Get Resend API key and enable email notifications
2. Add iyzico payment integration for Turkey market
3. Build B2B agency panel
