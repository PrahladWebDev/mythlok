# ॥ MythLok — Voices of Ancient Bharat

A full-stack community platform for discovering, reading, and contributing Indian folklore — ghost stories, mythological creatures, tribal legends, sacred places, and more from every state of India.

---

## ✦ Features

### For Readers
- Browse 500+ stories from 28 states
- Search by name, state, category, creature
- Interactive India Map (Leaflet) — click any state
- Bookmark stories into custom collections
- Rate stories (1–5 stars)
- Comment and discuss with the community
- Reading history & progress tracking
- Achievement system (10 unlockable badges)

### For Contributors
- Multi-step story submission form
- Draft saving
- Cover image upload (Cloudinary)
- Track approval status
- Admin notes on changes requested

### For Admins
- Analytics dashboard
- Story review workflow (approve/reject/request changes)
- User management (block/unblock, role assignment)
- Broadcast notifications
- Featured story control

---

## 🛠 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, React Router 6, Redux Toolkit |
| Map         | React-Leaflet + Leaflet.js        |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB Atlas + Mongoose          |
| Auth        | JWT (bcryptjs + jsonwebtoken)     |
| Images      | Cloudinary + Multer               |
| State Mgmt  | Redux Toolkit                     |
| Toasts      | react-hot-toast                   |
| Security    | Helmet, CORS, Rate Limiting       |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd mythlok
npm run install:all
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Fill in MONGODB_URI, JWT_SECRET, CLOUDINARY_* values

# Frontend
cp frontend/.env.example frontend/.env
# REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Seed the Database
```bash
npm run seed
```
This creates:
- 3 users (admin, contributor, regular user)
- 8 categories
- 5 richly-written stories
- 10 achievements

**Seed credentials:**
| Role        | Email                  | Password  |
|-------------|------------------------|-----------|
| Admin       | admin@mythlok.com      | Admin@123 |
| Contributor | arjun@mythlok.com      | User@123  |
| User        | priya@mythlok.com      | User@123  |

### 4. Run Development
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 📁 Project Structure

```
mythlok/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js      # Cloudinary + Multer setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── storyController.js
│   │   ├── commentController.js
│   │   ├── interactionController.js  # Bookmarks, Ratings, Notifications
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js            # JWT protect, role guards
│   ├── models/
│   │   ├── User.js
│   │   ├── Story.js
│   │   ├── Category.js
│   │   ├── Comment.js
│   │   └── index.js           # Rating, Bookmark, ReadingHistory, Notification, Achievement, Report
│   ├── routes/                # All Express routers
│   ├── utils/
│   │   └── seeder.js          # Database seeder
│   └── server.js              # Entry point
│
└── frontend/
    └── src/
        ├── assets/data/
        │   └── states.js       # 28 Indian states with lat/lng
        ├── components/
        │   ├── common/
        │   │   └── AuthModal   # Login/Register modal
        │   ├── layout/
        │   │   ├── Navbar      # Sticky nav with profile dropdown
        │   │   └── Footer
        │   └── story/
        │       └── StoryCard   # Reusable story card
        ├── pages/
        │   ├── Home            # Hero, trending, states, categories
        │   ├── Explore         # Search + filter + pagination
        │   ├── MapPage         # Interactive Leaflet India map
        │   ├── StoryDetail     # Full story with rating/comments
        │   ├── Contribute      # 4-step submission form
        │   ├── Profile         # Bookmarks, history, achievements
        │   ├── AdminDashboard  # Analytics, review, user mgmt
        │   ├── Leaderboard     # Readers, contributors, stories
        │   └── StatePage       # Per-state story listing
        ├── store/
        │   ├── index.js
        │   └── slices/
        │       ├── authSlice.js
        │       ├── storySlice.js
        │       └── uiSlice.js
        ├── utils/
        │   └── api.js          # Axios instance with JWT interceptors
        ├── App.jsx             # Routes + auth guards
        └── index.css           # Global design system
```

---

## 🎨 Design System

| Token          | Value                                    |
|----------------|------------------------------------------|
| Background     | `#0D0A1A` — Night Ink                   |
| Primary        | `#B78C3E` — Ancient Gold                |
| Accent         | `#8B1A1A` — Crimson                     |
| Text           | `#F0EAD6` — Ash White                   |
| Font Display   | Cinzel (headings)                        |
| Font Body      | Lora (story text)                        |
| Font UI        | Inter (labels, buttons, nav)             |

---

## 🔌 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Current user |
| PUT  | /api/auth/profile | Update profile |
| POST | /api/auth/become-contributor | Upgrade role |

### Stories
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/stories | List (with filters) |
| GET    | /api/stories/trending | Trending this week |
| GET    | /api/stories/featured | Featured stories |
| GET    | /api/stories/:slug | Single story |
| POST   | /api/stories | Create (contributor+) |
| PUT    | /api/stories/:id | Update |
| DELETE | /api/stories/:id | Delete |
| PATCH  | /api/stories/:id/review | Admin review |

### Community
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | /api/comments/:storyId | Comments |
| POST  | /api/bookmarks/:storyId | Toggle bookmark |
| POST  | /api/ratings/:storyId | Rate story |
| GET   | /api/notifications | Notifications |
| PATCH | /api/notifications/read | Mark read |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/admin/analytics | Platform analytics |
| GET    | /api/admin/users | User list |
| PATCH  | /api/admin/users/:id/role | Change role |
| PATCH  | /api/admin/users/:id/block | Block/unblock |
| POST   | /api/admin/broadcast | Mass notification |

---

## 📦 MongoDB Collections

```
users             — accounts, roles, stats, achievements
stories           — content, status, ratings, geo location  
categories        — 8 folklore types
comments          — nested replies, likes
ratings           — 1–5 star, one per user per story
bookmarks         — user collections
reading_history   — progress tracking
notifications     — in-app alerts
achievements      — unlockable badges
reports           — content moderation flags
```

---

## 🚢 Deployment

### Backend (Railway / Render)
1. Set environment variables from `.env.example`
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL=https://your-api-url.com/api`
2. Build command: `npm run build`
3. Output directory: `build`

---

## 🏆 Resume Value

This project demonstrates:
- **Full-stack architecture** — REST API + React SPA
- **JWT authentication** with role-based access (4 roles)
- **MongoDB data modeling** — 10+ collections, aggregations
- **Interactive SVG/Leaflet map** with real geospatial data
- **Cloud image storage** (Cloudinary)
- **Admin CMS** with content moderation workflow
- **Redux Toolkit** state management
- **Real-world features**: bookmarks, ratings, comments, achievements, notifications, leaderboard

---

*"Stories are the threads that weave civilization." — Ancient Indian Proverb*
