# Fellowsip

A platform for real-time collaborative tastings (wine, whisky, etc.) with AI-generated summaries.

## Tech Stack

- **Frontend (Landing):** Astro (Static)
- **Frontend (App):** React + Vite (Single Page App)
- **Backend:** Node.js (Fastify) + Socket.io (Real-time chat)
- **Database:** PostgreSQL 16 with Drizzle ORM
- **Cache:** Redis 7
- **Auth:** Lucia Auth (Google/Facebook OAuth)
- **AI:** Gemini 1.5 Flash (via Google Gen AI SDK)
- **Infrastructure:** Docker Compose

## Project Structure

```
fellowsip/
├── packages/
│   ├── landing/       # Astro landing page
│   ├── app/          # React/Vite web application
│   └── server/       # Fastify backend server
├── docker-compose.yml
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose
- npm 10.x or higher

## Quick Start

### 1. Clone and Setup

```bash
# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

### 2. Start Docker Services

```bash
# Start all services (PostgreSQL, Redis, pgAdmin, Redis Commander)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Stop services and remove volumes (clean slate)
npm run docker:clean
```

### 3. Access Development Tools

- **pgAdmin** (PostgreSQL): http://localhost:5050
  - Email: `admin@fellowsip.local`
  - Password: `admin`

- **Redis Commander**: http://localhost:8081

### 4. Connect pgAdmin to PostgreSQL (First Time)

1. Open pgAdmin at http://localhost:5050
2. Right-click "Servers" → "Register" → "Server"
3. In "General" tab: Name = "Fellowsip Local"
4. In "Connection" tab:
   - Host: `postgres` (or `localhost` if connecting from host machine)
   - Port: `5432`
   - Database: `fellowsip`
   - Username: `fellowsip`
   - Password: `fellowsip_dev`
5. Click "Save"

## Development Workflow

```bash
# Start Docker services first
npm run docker:up

# Then start your development servers
# (These commands will be added as packages are set up)
npm run dev
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache and session store |
| pgAdmin | 5050 | PostgreSQL web interface |
| Redis Commander | 8081 | Redis web interface |

## Environment Variables

Copy `.env.example` to `.env` and configure:

- **Database**: PostgreSQL connection settings
- **Redis**: Redis connection settings
- **Auth**: Google and Facebook OAuth credentials
- **AI**: Gemini API key
- **Ports**: Service port configurations

## Architecture

- **Monorepo**: npm workspaces manage multiple packages
- **Real-time**: Socket.io handles collaborative tasting sessions
- **AI Summaries**: Chat messages → Postgres → Session ends → Gemini generates summary
- **OAuth Only**: Google/Facebook authentication via Lucia Auth

## Available Scripts

```bash
npm run dev              # Start development servers
npm run build            # Build all packages
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs
npm run docker:restart   # Restart Docker services
npm run docker:clean     # Stop and remove all volumes
npm run db:migrate       # Run database migrations
```

## Database Migrations

This project uses Drizzle ORM for database schema management. See [MIGRATIONS.md](./MIGRATIONS.md) for details on:
- How to make schema changes
- How migrations work
- Troubleshooting migration issues

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).


## Next Steps

1. Set up the landing page (Astro) in `packages/landing/`
2. Set up the web app (React + Vite) in `packages/app/`
3. Set up the backend server (Fastify) in `packages/server/`
4. Configure Drizzle ORM and database migrations
5. Implement Lucia Auth with OAuth providers
6. Set up Socket.io for real-time features
7. Integrate Gemini AI for summary generation

## License

MIT
