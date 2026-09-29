# LinkTP 

[![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-398200?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

LinkTP is a feature-rich, high-performance, full-stack URL shortener and real-time analytics platform. Modern web architectures demand low latency for link redirects and high throughput for analytics payload collection. LinkTP solves this by introducing a Redis caching layer for instant redirection and an asynchronous flushing queue to persist URL click metrics to PostgreSQL without blocking user traffic.

**Live Demo:** [https://link-tp.vercel.app/](https://link-tp.vercel.app/)  
**API:** [https://link-tp.onrender.com/](https://link-tp.onrender.com/)

---

## Key Features

* **Custom Aliases & Expiration:** Shorten links with custom, readable aliases or auto-generated short hashes (`nanoid`). Set expiration timestamps to retire links automatically.
* **Asynchronous Click Logging:** Incoming click events are recorded instantly in Redis via atomic `INCR`, then flushed to PostgreSQL in scheduled 60-second batches, thus avoiding write-lock contention on every redirect.
* **Cache-Aside Redirects:** Short-code lookups are served from Redis on cache hits (sub-5ms), falling back to PostgreSQL on misses, with dynamic TTLs matching each URL's expiry.
* **Referrer & Device Analytics:** Each click captures referrer and device/browser data, surfaced on a per-link analytics dashboard.
* **Secure Authentication:** JWT stored in an HTTP-only cookie, verified on protected routes.
* **Distributed Rate Limiting:** Custom Redis-based middleware (`INCR` + `EXPIRE`) limits link creation to 10/minute per IP.
* **Dockerized Local Dev:** Spin up the API and Redis together via Docker Compose — Postgres is Neon (managed), not containerized.

---

## 📸 Screenshots

| Home | Shortening | Analytics 
|---|---|---|
| ![Home](./client/public/homeSS.png) |![Shorten](./client/public/shortenSS.png) | ![Analytics](./client/public/analyticsSS.png) |

---

## Architecture & Technology Stack

LinkTP is structured as a decoupled monorepo containing a frontend client tier and a backend API server tier.

```mermaid
graph TD
    Client[React Client SPA] -->|HTTP / Cookies| Server[Express API Server]
    Server -->|Direct Reads / Writes| Postgres[(PostgreSQL DB via Prisma)]
    Server -->|Read-through Cache & Rate Limiting| Redis[(Redis Caching Database)]
    Server -.->|Async Batch Flush| Postgres
```

### Stack Components

* **Frontend:** React (Vite) SPA, Axios, React Router v6.
* **Backend:** Node.js, Express, JavaScript ES Modules, Zod schema validation middleware.
* **Persistent Storage:** PostgreSQL (Neon), managed via Prisma ORM.
* **Caching & Tracking:** Redis for redirecting cache, rate limiting and pending-click buffer.
* **Infra:** Docker Compose (API + Redis, local dev only), Render (API), Vercel (client) · Upstash (Redis, prod).

---

## API Endpoints

### Authentication (`/auth/*`)
* `POST /auth/register` — Create a new account.
* `POST /auth/login` — Log in, receive an HTTP-only session cookie.
* `POST /auth/logout` — Clear the session cookie.
* `GET /auth/me` — Return the active user's profile.

### Shortener & Redirect (`/*`)
* `POST /shorten` — Shorten a URL. Supports custom aliases and expiration.
* `GET /urls` — List all URLs owned by the authenticated user.
* `GET /urls/:id/stats` — Get traffic stats for a specific short link.
* `DELETE /urls/:id` — Delete a short link and evict its cache entry.
* `GET /:code` — Redirect to the target URL (cache-aside lookup).

---

## 📁 Repository Structure

```text
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI parts (Navbar, UrlForm, etc.)
│   │   ├── context/        # React Authentication state providers
│   │   └── pages/          # View modules (Home, Analytics, Auth)
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend application
│   ├── prisma/             # Schema definitions and database migrations
│   ├── src/
│   │   ├── controllers/    # Route controllers (URL shorten/redirect/auth logic)
│   │   ├── middleware/     # Rate limiter, validation, auth verification
│   │   └── routes/         # Express endpoint definitions
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml      # API + Redis on Local Dev
```

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (>= 20.x)
* [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) (optional, for containerized dev)
* A PostgreSQL connection string (this project uses [Neon](https://neon.tech/))
* A Redis instance (local via Docker, or [Upstash](https://upstash.com/) for production)

### 🐋 Option 1: Docker (API + Redis)

1. **Configure environment variables** — create `server/.env`:
    ```env
    PORT=5000
    DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
    REDIS_URL="redis://redis:6379"
    JWT_SECRET="create-a-random-secure-phrase"
    ```
2. **Start the containers:**
    ```bash
    docker compose up --build
    ```
3. **Start the client:**
    ```bash
    cd client
    npm install
    npm run dev
    ```

### Option 2: Manual Local Setup

```bash
cd server
npm install
npx prisma migrate dev   # applies schema migrations
npm run dev               # http://localhost:5000
```

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```
