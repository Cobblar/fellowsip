# Project: Fellowsip

A platform for real-time collaborative tastings (wine, whisky, etc.) with AI-generated summaries.

## Tech Stack

- **Frontend (Landing):** Astro (Static)
- **Frontend (App):** React + Vite (Single Page App)
- **Backend:** Node.js (Fastify) + Socket.io (Real-time chat)
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Lucia Auth (Google/Facebook OAuth only)
- **AI:** Gemini 1.5 Flash (via Google Gen AI SDK)
- **Infrastructure:** Docker Compose (local dev and cloud-ready)

## Architecture & Style Rules

- **Monorepo Structure:** - `/packages/landing` (Astro)
  - `/packages/app` (React/Vite)
  - `/packages/server` (Fastify/Drizzle)
- **Data Flow:** Chat messages stored in Postgres -> Session ends -> Server sends logs to Gemini -> Summary stored in `tasting_summaries` table.
- **Naming:** Use PascalCase for components, camelCase for variables/functions.
- **AI Rule:** Use System Instructions to force Gemini to return structured JSON summaries.
