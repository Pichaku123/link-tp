# LinkTP 🚀

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-cyan.svg)](https://react.dev/)
[![Prisma Version](https://img.shields.io/badge/prisma-6.x-indigo.svg)](https://www.prisma.io/)
[![Redis Cache](https://img.shields.io/badge/redis-7.x-red.svg)](https://redis.io/)
[![Docker Compose](https://img.shields.io/badge/docker--compose-supported-blue.svg)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LinkTP is a feature-rich, high-performance, full-stack URL shortener and real-time analytics platform. Modern web architectures demand low latency for link redirects and high throughput for analytics payload collection. LinkTP solves this by introducing a Redis caching layer for instant redirection and an asynchronous flushing queue to persist URL click metrics to PostgreSQL without blocking user traffic.

---

## ⚡ Key Features

*   **Custom Aliases & Expiration Security:** Shorten links with custom, readable aliases or auto-generated 7-character clean hashes (`nanoid`). Set custom expiration times to expire links automatically.
*   **Asynchronous Click Logging:** Incoming click events are cached instantly inside Redis, incrementing counts natively, and then flushed to the relational database in scheduled batches. This eliminates write lock bottlenecks.
*   **Granular Analytics Dashboards:** Track visits and classify visitors by device platforms (Desktop, Mobile, Tablet), client browser software (Chrome, Edge, Firefox, Safari), and referring domain paths.
*   **Secure Authentication:** Keep dashboards and statistics private using a JWT token-in-cookie verification mechanism.
*   **Dockerized Deployment:** Start the entire production-like topology containing the backend service and Redis using Docker Compose.

---

## 🏗️ Architecture & Technology Stack

LinkTP is structured as a decoupled monorepo containing a frontend client tier and a backend API server tier.

```mermaid
graph TD
    Client[React Client SPA] -->|HTTP / Cookies| Server[Express API Server]
    Server -->|Direct Reads / Writes| Postgres[(PostgreSQL DB via Prisma)]
    Server -->|Read-through Cache & Rate Limiting| Redis[(Redis Caching Database)]
    Server -.->|Async Queue Flush| Postgres
```

### Stack Components

*   **Frontend:** React (Vite) Single Page Application, Axios for asynchronous API communication, React Router v6.
*   **Backend:** Node.js, Express, JavaScript ES Modules, Zod schema validation middleware.
*   **Persistent Storage:** PostgreSQL database, managed seamlessly with Prisma ORM.
*   **Caching & Tracking:** Redis container servicing rate limiting, redirection caches, and active click logs.
*   **Container Infrastructure:** Docker Compose, Alpine Linux base virtual containers.

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
│   │   ├── controllers/    # Route controllers (URL shortened/redirection/auth logic)
│   │   ├── middleware/     # Rate limiter, validation, auth verification
│   │   └── routes/         # Express endpoint definitions
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml      # Docker container management orchestration
```

---

## 🚀 Getting Started

Follow these steps to run the application in your local environment.

### Prerequisites

Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version >= 20.x recommended)
*   [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/)
*   A running PostgreSQL database instance (if installing manually)
*   A running Redis server instance (if installing manually)

### 🐋 Option 1: Development Environment via Docker

The simplest way to run LinkTP is via Docker Compose, which automatically provisions the server and the Redis caching server.

1.  **Configure environment variables:** Create a `.env` file inside the `server/` directory:
    ```env
    PORT=5000
    DATABASE_URL="postgresql://username:password@host:port/database"
    JWT_SECRET="create-a-random-secure-phrase"
    ```
2.  **Spin up the containers:** Run the following command in the project root:
    ```bash
    docker-compose up --build
    ```
3.  **Client setup:** Launch your frontend client locally:
    ```bash
    cd client
    npm install
    npm run dev
    ```

### 🛠️ Option 2: Manual Local Setup

If you prefer to run services natively on your host machine:

#### 1. Database Migrations
Go to the server directory, install dependencies, and run Prisma migrations to build schema structures in your PostgreSQL database:
```bash
cd server
npm install

# Run database schema migration
npx prisma db push
```

#### 2. Start the Backend Server
Start the development server with Hot Module Reloading:
```bash
npm run dev
```
The server will bind to `http://localhost:5000`.

#### 3. Start the Frontend Client
Open a new terminal window at the project root, navigate to `client`, set up packages, and start the Vite dev server:
```bash
cd client
npm install
npm run dev
```
The client will bind to `http://localhost:5173`.

---

## 🔌 API Endpoints Summary

### Authentication Routes (`/auth/*`)
*   `POST /auth/register` — Create a new developer account.
*   `POST /auth/login` — Log in and receive a secure HTTP-Only cookie.
*   `POST /auth/logout` — Clear session cookies.
*   `GET /auth/me` — Check the active profile details.

### Shortener & Redirect Routes (`/*`)
*   `POST /shorten` — Shorten a long URL. Supports custom aliases and expiration parameters.
*   `GET /urls` — List all URLs owned by the authenticated user.
*   `GET /urls/:id/stats` — Get traffic breakdowns for a specific shortened link.
*   `DELETE /urls/:id` — Delete a route code and purge its cache.
*   `GET /:code` — Redirect standard visitors to the target website.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn and build.

1.  Review our development guidelines.
2.  Fork this repository.
3.  Create a descriptive branch (`git checkout -b feature/awesome-feature`).
4.  Commit your modifications properly.
5.  Push files to your branch (`git push origin feature/awesome-feature`).
6.  Open a Pull Request describing your context changes.

## 📄 License

This repository is distributed under the MIT License. Reference the [LICENSE](LICENSE) file for terms and limitations.
