# Campus Core (`gigo`)

[![CI/CD](https://github.com/UBU11/gigo/actions/workflows/mirror-to-gitlab.yml/badge.svg)](https://github.com/UBU11/gigo/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Campus Core is a modular monolith platform designed for academic campus utilities, event ticketing, and pseudonymous community discussions.

---

## System Overview

- **Authentication:** Better Auth with Google OAuth restricted to authorized institutional email domains (`@college.ac.in`).
- **Dual-Identity Separation:** Strict schema-level boundary separating public profiles (ticketing, peer collaboration) from pseudonymous forum profiles (discussion feed).
- **Cryptographic Ticketing:** Asymmetric Ed25519 digital signatures (`crypto.subtle`) allowing gate staff to verify event passes offline.
- **In-Memory Store:** DragonflyDB handles caching, distributed locks for ticket claim deduplication, rate limiting, and pub/sub.
- **Frontend PWA:** React 19 single-page application built with Vite and `vite-plugin-pwa` for offline pass presentation.

---

## Architecture & Monorepo Structure

The repository uses Turborepo and pnpm workspaces. Application layers consume shared packages; shared packages never depend on applications.

```text
campus-core/
├── apps/
│   ├── api/                    # Bun + Hono modular backend service
│   │   ├── src/lib/            # Better Auth, DragonflyDB client, DB connection
│   │   ├── src/middleware/     # Session guard, rate-limiting, error handling
│   │   ├── src/modules/        # Domain modules (auth, tickets, feed, collab)
│   │   └── src/ws/             # WebSocket handlers and heartbeat sweeper
│   ├── web/                    # React 19 + Vite PWA frontend
│   │   ├── src/components/     # UI components
│   │   ├── src/lib/            # Better Auth client and typed API client
│   │   └── src/routes/         # Route views (Home, Tickets, Feed, Collab)
│   └── caddy/                  # Reverse proxy configuration
│
├── packages/
│   ├── contracts/              # Shared Zod validation schemas and DTOs
│   ├── crypto/                 # Ed25519 asymmetric ticket signing and verification
│   ├── db/                     # PostgreSQL 17 + Drizzle ORM schemas and migrations
│   └── tsconfig/               # Shared TypeScript configurations
│
├── .github/workflows/          # CI mirror workflows
├── .gitlab-ci.yml              # GitLab CI/CD verification pipeline
├── docker-compose.yml          # Container configuration (PostgreSQL, DragonflyDB, API, Caddy)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Bun 1.2+ | JavaScript and TypeScript runtime |
| **HTTP Framework** | Hono | Routing with `@hono/zod-validator` integration |
| **Frontend** | React 19, Vite | Single-page application with service worker caching |
| **Database** | PostgreSQL 17 | Primary relational store using Drizzle ORM |
| **In-Memory Cache** | DragonflyDB | Multi-threaded RESP cache, locking, and rate limiting |
| **Auth** | Better Auth | Session handling and domain-restricted OAuth |
| **Cryptography** | Web Crypto API | Asymmetric Ed25519 signing (`crypto.subtle`) |
| **Code Quality** | Biome | Formatter and linter |

---

## Local Development Setup

### Prerequisites

- Bun `>= 1.2.0`
- Node.js `>= 20.0.0` and pnpm `>= 11.0.0`
- Docker and Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/UBU11/gigo.git
cd gigo
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Review and update `.env` with appropriate local values:

```env
PORT=3000
NODE_ENV=development
CAMPUS_EMAIL_DOMAIN=college.ac.in
DATABASE_URL=postgresql://campus:campus_secret@localhost:5432/campus_db
DRAGONFLY_URL=redis://localhost:6379
BETTER_AUTH_SECRET=changethis_supersecret_key_at_least_32_characters_long
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### 3. Start Infrastructure Services

Start PostgreSQL and DragonflyDB containers:

```bash
docker compose up -d postgres dragonfly
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run Development Servers

```bash
pnpm dev
```

- Web Application: `http://localhost:5173`
- API Backend: `http://localhost:3000`
- Health Check: `http://localhost:3000/health`

---

## Verification Pipeline

Run all verification checks prior to committing:

```bash
# Typecheck all workspaces
pnpm turbo run typecheck

# Run test suites (bun test)
pnpm turbo run test

# Lint and formatting checks
pnpm turbo run lint

# Build all applications and packages
pnpm turbo run build
```

---

## Contributing

1. Review open issues on the [GitHub Issue Tracker](https://github.com/UBU11/gigo/issues). Major implementation milestones are tracked in [Issue #18](https://github.com/UBU11/gigo/issues/18).
2. Create a feature branch:
   ```bash
   git checkout -b feat/ticket-validation
   ```
3. Adhere to code standards:
   - Enforce strict typing. Do not use `any`; validate untrusted input with `@campus/contracts`.
   - Maintain modular boundaries (keep functions and files single-purpose).
   - Comment only non-obvious technical decisions or algorithms.
4. Verify tests and typechecks pass with zero errors:
   ```bash
   pnpm turbo run typecheck
   pnpm turbo run test
   ```
5. Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:
   ```text
   feat(tickets): sign payload with ed25519 private key
   fix(auth): sanitize casing in user email
   chore(deps): update drizzle-orm
   ```
6. Open a pull request against `master` referencing the relevant issue number.

---

## Security

Security vulnerabilities should be reported directly via GitHub Issues using the `security` label. Do not include weaponized exploits or executable payload scripts.

---

## License

This project is licensed under the [MIT License](LICENSE).
