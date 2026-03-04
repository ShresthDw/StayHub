# StayHub

StayHub is a full-stack property booking and management platform where guests can discover and book stays, and hosts can manage listings, bookings, and earnings.

## Highlights

- Property discovery with city-based browsing and map-assisted location features
- Secure authentication with JWT and protected routes
- End-to-end booking flow with Razorpay order creation and payment verification
- Host dashboard for managing listings, bookings, and earnings
- Wishlist support for guests
- Performance-focused backend setup with pagination, compression, and rate limiting

## Tech Stack

### Frontend
- React 18 + Vite
- Redux Toolkit + RTK Query
- React Router
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- Razorpay SDK
- CORS, compression, cookie-parser, express-rate-limit

## Project Structure

```text
stayhub24/
  backend/
    config/
    features/
      address/
      auth/
      bookings/
      rooms/
    middleware/
    models/
    utils/
    server.js
  frontend/
    src/
      api/
      components/
      features/
      pages/
      services/
      store/
      utils/
```

## Core Modules

- Auth: register, login, profile, role upgrade to owner, logout, wishlist
- Rooms: list, city aggregation, room details, owner room CRUD
- Bookings: create payment order, verify payment, guest bookings, host earnings, host booked-list
- Address: reverse geocoding endpoint for location support

## API Overview

Base URL (local):
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

Main route groups:
- GET /api/config
- /api/auth/*
- /api/rooms/*
- /api/bookings/*
- /api/address/*

## Authentication Notes

Protected APIs support:
- Cookie-based JWT authentication via authToken
- Header fallback using x-user-id (useful for testing flows)

## Environment Variables

Create backend/.env with values similar to:

```env
PORT=5000
MONGO_URI=your_atlas_or_remote_mongodb_uri
MONGO_FALLBACK_URI=mongodb://127.0.0.1:27017/stayhub24
JWT_SECRET=your_jwt_secret
GEOAPIFY_API_KEY=your_geoapify_public_key
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## Local Setup

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd stayhub24

cd backend
npm install

cd ../frontend
npm install
```

### 2) Start backend

```bash
cd backend
npm start
```

### 3) Start frontend

```bash
cd frontend
npm run dev
```

Open the app at http://localhost:5173.

## Available Scripts

### Backend
- npm start: starts Express server

### Frontend
- npm run dev: starts Vite dev server
- npm run build: creates production build
- npm run preview: previews production build locally

## Quality and Performance

The project includes additional scripts and documents for testing and optimization, such as pagination/performance tests and implementation reports under:

- mdfiles/
- backend/performance-test.js
- backend/test-pagination.js
- backend/test-search.js
- test-infinite-scroll.js
- test-section-infinite-scroll.js

## Deployment Notes

- Configure production-ready CORS policy
- Use secure cookie settings for auth in production
- Keep all secrets in environment variables
- Use Razorpay live keys only in production environment
- Add MongoDB Atlas IP/network access rules (or use managed private networking)

## Roadmap Ideas

- Real-time notifications and chat
- Advanced filtering and recommendations
- Admin analytics panel
- Booking calendar sync enhancements
- CI/CD and containerized deployment

## License

This repository currently uses the backend package license field set to ISC.
You can replace this section with your preferred project license.
