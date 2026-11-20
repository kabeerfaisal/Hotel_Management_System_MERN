# LuxuryStay Hospitality — Hotel Management System

An industry-grade, full-stack **MERN** hotel management platform for reservations, rooms,
guests, billing, and staff operations.

> **Status:** Foundation scaffold. The repository structure, tooling, and core stack are in
> place; product modules are built incrementally with small, reviewable commits.

---

## Tech Stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| **Client** | React 19 (Vite), Tailwind CSS v4, modern Hooks-only functional components   |
| **Server** | Node.js, Express 5, Mongoose (MongoDB)                                     |
| **Auth**   | JWT access tokens, bcrypt password hashing                                 |
| **Tooling**| Vite, Nodemon, Oxlint, Git (Conventional Commits)                          |

### Deliberate choices

- **Vite, not Create React App.** CRA is unmaintained; Vite provides instant HMR and a lean build.
- **Tailwind CSS v4** via the first-party `@tailwindcss/vite` plugin — no PostCSS config boilerplate.
- **Hooks only.** No legacy class components anywhere in `client/`.
- **Strict server modularity.** Routes, controllers, models, and middleware never share a file.

---

## Repository Layout

```text
Hotel_Management_System_MERN/
├── client/                     # React front end (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Images, icons, fonts
│   │   ├── components/         # ProtectedRoute + shared UI primitives
│   │   ├── config/             # Constants (API base URL, storage keys)
│   │   ├── context/            # AuthContext + useAuth hook
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route-level views (Home, Login, Register)
│   │   ├── routes/             # AppRoutes — the single route table
│   │   ├── services/           # Axios instance + feature API modules
│   │   ├── App.jsx
│   │   ├── index.css           # Tailwind entry + design tokens
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/            # Request handlers (added with each feature)
│   ├── middleware/             # Auth, validation, error handling
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── server.js               # Express app + process entry point
│   ├── .env.example            # Committed template
│   └── package.json
│
├── .gitignore
└── README.md
```

### Architectural rules

1. **One responsibility per file.** A route file wires URLs to controller functions only.
2. **Controllers own orchestration.** They validate input, call models, and shape responses.
3. **Models own schema + data rules.** Validation, indexes, and instance methods live here.
4. **Middleware is cross-cutting.** Authentication, authorization, error handling, rate limits.
5. **No secrets in code.** Every credential comes from `process.env`.

---

## Getting Started

### Prerequisites

- Node.js **20+**
- npm **10+**
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

### 1. Clone & install

```bash
git clone <repository-url>
cd Hotel_Management_System_MERN

# Client
cd client
npm install

# Server
cd ../server
npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Then edit `server/.env` with your own values. **Never commit `.env`.**

| Variable         | Required | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `NODE_ENV`       | yes      | `development` \| `production`                     |
| `PORT`           | no       | API port (default `5000`)                         |
| `MONGO_URI`      | yes      | MongoDB connection string                         |
| `JWT_SECRET`     | yes      | Long random string used to sign access tokens     |
| `JWT_EXPIRES_IN` | no       | Token lifetime, e.g. `7d`                         |

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run in development

```bash
# Terminal 1 — API on http://localhost:5000
cd server
npm run dev

# Terminal 2 — client on http://localhost:3000
cd client
npm run dev
```

The Vite dev server proxies API requests so the browser talks to one origin.

---

## Available Scripts

### `client/`

| Script            | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR   |
| `npm run build`   | Production build into `dist/`    |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | Run Oxlint                       |

### `server/`

| Script        | Purpose                               |
| ------------- | ------------------------------------- |
| `npm run dev` | Start Nodemon with hot reload         |
| `npm start`   | Start with plain Node (production)    |

---

## Security Baseline

- All secrets live in `server/.env`; only `server/.env.example` is committed.
- `.env`, `.env.*`, and `node_modules/` are ignored at the **repository root** so nested
  packages cannot accidentally commit them.
- Passwords are hashed with bcrypt; plaintext passwords are never stored or logged.
- JWTs are signed with a server-only secret and validated by auth middleware.
- CORS is restricted to the configured client origin in production.

If a secret is ever committed, rotate it immediately — removing the commit is not enough.

---

## Git Workflow

This project uses **Conventional Commits**:

```text
feat:     a new feature
fix:      a bug fix
chore:    tooling, dependencies, configuration
docs:     documentation only
refactor: code change that neither fixes a bug nor adds a feature
test:     adding or correcting tests
perf:     performance improvement
style:    formatting only
```

Examples:

```text
feat(rooms): add availability search endpoint
fix(auth): reject expired refresh tokens
chore: add tailwind config
```

Each functional milestone lands as its own small commit so history stays bisectable and
reviewable.

---

## Roadmap

- [x] Repository foundation, tooling, and documentation
- [x] Express modular scaffold with MongoDB connection
- [x] Tailwind theme and client app shell
- [ ] Authentication & role-based access (guest, staff, admin)
- [ ] Room inventory & availability management
- [ ] Reservations and booking lifecycle
- [ ] Guest profiles and check-in / check-out
- [ ] Billing, invoices, and payments
- [ ] Admin dashboard and reporting

---

## License

Proprietary — © LuxuryStay Hospitality. All rights reserved.
