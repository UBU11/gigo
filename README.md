# Campus Core (`gigo`)

[![CI/CD](https://github.com/UBU11/gigo/actions/workflows/mirror-to-gitlab.yml/badge.svg)](https://github.com/UBU11/gigo/actions)
[![Runtime: Bun](https://img.shields.io/badge/Runtime-Bun%201.2+-f472b6.svg)](https://bun.sh)
[![Framework: Hono](https://img.shields.io/badge/Framework-Hono-E36002.svg)](https://hono.dev)
[![Frontend: React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb.svg)](https://react.dev)
[![Database: PostgreSQL 17](https://img.shields.io/badge/Database-PostgreSQL%2017-336791.svg)](https://www.postgresql.org)
[![Cache: DragonflyDB](https://img.shields.io/badge/Cache-DragonflyDB-00D084.svg)](https://www.dragonflydb.io)
[![Tooling: Turborepo](https://img.shields.io/badge/Monorepo-Turborepo%20%2B%20pnpm-EF4444.svg)](https://turbo.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A type-safe, low-overhead campus community and utility platform built for university ecosystems. Engineered with a modular monolith architecture, strict Zero-Trust identity separation, and cryptographically verified event passes.

---

## 🌟 Core Features

- **🎓 Institutional Authentication:** Powered by [Better Auth](https://www.better-auth.com/) with Google OAuth restricted to approved university email domains (`@college.ac.in`).
- **🛡️ Dual-Identity Separation (Zero-Trust):**
  - **Public Profile:** Verified real identity used exclusively for campus utility, event ticketing, and peer collaboration.
  - **Pseudonymous Profile:** Generated avatar seeds and handles for anonymous campus forum discussions. The database strictly isolates pseudonyms from real-world student identities.
- **🎟️ Cryptographic Pass Engine:** Asymmetric **Ed25519** digital signatures generated with the Web Crypto API (`crypto.subtle`). Passes can be verified offline by gate scanners using the public key.
- **⚡ In-Memory Performance:** [DragonflyDB](https://www.dragonflydb.io) provides ultra-fast in-memory caching, ticket deduplication locks, sliding-window rate limiting, and pub/sub messaging.
- **📱 Offline-First PWA:** React 19 Progressive Web App served via Vite, designed for instant loading and offline ticket display.

---

## 🏗️ Architecture & Monorepo Layout

This repository is managed with **Turborepo** and **pnpm workspaces**. Applications consume internal workspace packages; workspace packages never depend on applications.

```text
campus-core/
├── apps/
│   ├── api/                    # Bun + Hono modular backend service
│   │   ├── src/lib/            # Better Auth, DragonflyDB client, DB connection
│   │   ├── src/middleware/     # Session guard, rate-limiting, error sanitization
│   │   ├── src/modules/        # Domain routes (auth, tickets, feed, collab)
│   │   └── src/ws/             # WebSockets keepalive & heartbeat sweeper
│   ├── web/                    # React 19 + Vite PWA frontend
│   │   ├── src/components/     # Modular UI components & layout
│   │   ├── src/lib/            # Better Auth client & typed API client
│   │   └── src/routes/         # Home, Tickets, Feed, and Collab views
│   └── caddy/                  # Reverse proxy configuration with WebSocket support
│
├── packages/
│   ├── contracts/              # Shared Zod validation schemas and DTO types
│   ├── crypto/                 # Asymmetric Ed25519 ticket signing & verification
│   ├── db/                     # PostgreSQL 17 + Drizzle ORM schemas & migrations
│   └── tsconfig/               # Strict shared TypeScript configurations
│
├── .github/workflows/          # CI/CD mirror workflows
├── .gitlab-ci.yml              # GitLab CI/CD verification pipeline
├── docker-compose.yml          # Container stack (Postgres, DragonflyDB, API, Caddy)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | [Bun 1.2+](https://bun.sh) | High-performance JavaScript/TypeScript server runtime |
| **API Framework** | [Hono](https://hono.dev) | Web standard API routing with `@hono/zod-validator` |
| **Frontend** | [React 19](https://react.dev) + [Vite](https://vite.dev) | Fast SPA with `vite-plugin-pwa` for mobile access |
| **Database** | [PostgreSQL 17](https://www.postgresql.org) | Primary transactional storage managed via [Drizzle ORM](https://orm.drizzle.team) |
| **Cache / Locks** | [DragonflyDB](https://www.dragonflydb.io) | Multi-threaded in-memory store (RESP-compatible) for locks, cache, and rate limits |
| **Auth** | [Better Auth](https://www.better-auth.com) | Session management and institutional domain-restricted OAuth |
| **Cryptography** | [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | Asymmetric Ed25519 digital signatures (`crypto.subtle`) |
| **Linter / Formatter** | [Biome](https://biomejs.dev) | Blazing fast formatting and linting with strict rules |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed locally:
- [Bun](https://bun.sh) (`>= 1.2.0`)
- [Node.js](https://nodejs.org) (`>= 20.0.0`) & [pnpm](https://pnpm.io) (`>= 11.0.0`)
- [Docker](https://www.docker.com) & Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/UBU11/gigo.git
cd gigo
```

### 2. Environment Configuration

Copy the environment template and customize values:

```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=3000
NODE_ENV=development
CAMPUS_EMAIL_DOMAIN=college.ac.in
DATABASE_URL=postgresql://campus:campus_secret@localhost:5432/campus_db
DRAGONFLY_URL=redis://localhost:6379
BETTER_AUTH_SECRET=your_super_secret_key_at_least_32_chars
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### 3. Start Backing Services (Docker)

Start PostgreSQL and DragonflyDB in background containers:

```bash
docker compose up -d postgres dragonfly
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run Development Servers

Start all applications and packages concurrently with live reload:

```bash
pnpm dev
```

- **Frontend (Vite PWA):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Hono):** [http://localhost:3000](http://localhost:3000)
- **API Health Endpoint:** [http://localhost:3000/health](http://localhost:3000/health)

---

## 🧪 Quality & Verification Pipeline

Before committing changes, execute the verification suite:

```bash
# 1. Typecheck all apps and packages strictly
pnpm turbo run typecheck

# 2. Run unit and contract tests (Bun test)
pnpm turbo run test

# 3. Format and lint checks with Biome
pnpm turbo run lint

# 4. Build all projects
pnpm turbo run build
```

---

## 🤝 Contributing

We welcome contributions from students, engineers, and open-source enthusiasts!

### Contribution Workflow

1. **Find or Open an Issue:**
   Check out our [GitHub Issues](https://github.com/UBU11/gigo/issues) to see ongoing work. Check the **[Master Architectural Drift Roadmap (#18)](https://github.com/UBU11/gigo/issues/18)** for high-priority features.
2. **Create a Topic Branch:**
   ```bash
   git checkout -b feat/ticket-qr-scanner
   ```
3. **Follow Coding Standards:**
   - **No `any` Types:** Use `unknown` and parse using `@campus/contracts` (Zod).
   - **Schema-First:** Every client-server payload must have a contract schema.
   - **Modularity:** Keep files small, focused, and single-purpose. Use guard clauses to prevent deep nesting.
   - **Clean Comments:** Comment the *why* behind non-obvious logic, not syntax.
4. **Run Tests & Linters:**
   Ensure `pnpm turbo run typecheck` and `pnpm turbo run test` pass with 0 errors.
5. **Atomic Conventional Commits:**
   Format commit messages following [Conventional Commits](https://www.conventionalcommits.org/):
   ```text
   feat(tickets): integrate ed25519 signing into ticket issuance
   fix(auth): normalize user email before persisting
   docs: update api endpoint references
   ```
6. **Open a Pull Request:**
   Submit a PR against the `master` branch referencing the related issue number.

---

## 🔒 Security & Bug Reports

If you discover a security vulnerability, please open an issue with the `security` label or contact the repository maintainers. Do not submit active exploit payloads.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
