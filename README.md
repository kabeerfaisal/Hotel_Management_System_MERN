# LuxuryStay — Hotel Management System

A full-stack **MERN** hotel management platform built by **Abdul Kabeer & his Team** for LuxuryStay
Hospitality. It pairs a five-star guest concierge experience with a role-aware staff console
for reservations, rooms, billing, service requests, feedback, and hotel settings.

---

## Overview

LuxuryStay is split into two experiences behind one authentication layer:

- **Guest Concierge** — visitors can browse suites and experiences before signing in. Registered
  guests can reserve rooms with live availability previews, track upcoming stays, cancel eligible
  reservations, download printable PKR invoices, request concierge services, and leave feedback.
- **Staff Portal** — admins, managers, receptionists, and housekeeping staff get a dedicated
  console for the reservation book, room inventory, guest service queues, feedback moderation,
  user administration, and hotel configuration.

Public editorial pages (`/experiences`, `/our-story`, `/support`) use deep-link anchors and
scroll-triggered motion while keeping staff workflows untouched.

### Key highlights

- **Role-based access** — `guest`, `admin`, `manager`, `receptionist`, and `housekeeping` roles
  with guarded routes and API authorization.
- **PKR billing & printable invoices** — nightly room charges, billable services, tax, and grand
  totals in Pakistani Rupees, with a print-ready invoice layout.
- **Automated room status sync** — check-in marks a room occupied, check-out moves it to cleaning,
  completing a housekeeping request returns it to available, and cancellation releases booking dates.
- **Guest self-service** — `/my-reservations` with All / Upcoming / Completed / Cancelled filters and
  self-cancel for pending or confirmed bookings.
- **Live availability preview** — the booking dialog lists blocked date ranges before a guest submits.
- **Dark / light theme** — persisted appearance preference across guest and staff areas.
- **GSAP animations** — hero fades, staggered scroll reveals, and subtle hover lifts, scoped and
  cleaned up with `gsap.context()` so route changes stay smooth.
- **Accessible forms** — labelled inputs, keyboard-friendly dialogs, and show/hide password toggles.

---

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Database   | MongoDB with Mongoose                               |
| Backend    | Node.js, Express.js                                 |
| Frontend   | React 19, React Router                              |
| Styling    | Tailwind CSS v4                                     |
| Animation  | GSAP + ScrollTrigger                                |
| Email      | Brevo Transactional API + Nodemailer SMTP fallback  |
| Auth       | JWT access tokens, bcrypt password hashing          |
| Build/Tool | Vite, Nodemon, Oxlint                               |

---

## Project Structure

```text
Hotel_Management_System_MERN/
├── client/                         # React front end (Vite)
│   ├── src/
│   │   ├── components/             # Auth, booking, guest, layout, and room UI
│   │   ├── config/                 # Developer credit and shared constants
│   │   ├── context/                # Auth and theme providers
│   │   ├── hooks/                  # GSAP animation hooks
│   │   ├── pages/                  # Home, Rooms, Bookings, MyReservations, Support, …
│   │   ├── routes/                 # Route table and role guards
│   │   ├── services/               # Axios client and feature API modules
│   │   ├── App.jsx
│   │   └── index.css               # Tailwind entry + design tokens
│   └── vite.config.js              # Dev server and API proxy
│
├── server/                         # Express REST API
│   ├── config/db.js                # MongoDB connection
│   ├── controllers/                # Auth, bookings, rooms, users, services, feedback
│   ├── middleware/                 # JWT protect + role authorize
│   ├── models/                     # Mongoose schemas and indexes
│   ├── routes/                     # Express routers
│   ├── seedRooms.js                # Signature room seeding
│   ├── server.js                   # App and process entry point
│   └── .env.example                # Environment template
│
├── .gitignore
└── README.md
```

---

## Quick Local Setup

### Prerequisites

- Node.js **20+** and npm **10+**
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Configure the API environment

```bash
cd server
cp .env.example .env
```

Set the following values in `server/.env`:

| Variable         | Required | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `MONGO_URI`      | yes      | MongoDB connection string                        |
| `PORT`           | no       | API port (default `5000`)                        |
| `JWT_SECRET`     | yes      | Long random string used to sign access tokens    |
| `JWT_EXPIRES_IN` | no       | Token lifetime, for example `7d`                 |
| `SMTP_HOST`      | no       | SMTP host (default `smtp.gmail.com`)             |
| `SMTP_PORT`      | no       | SMTP port (default `587`)                        |
| `SMTP_USER`      | yes*     | SMTP username / sender account                   |
| `SMTP_PASS`      | yes*     | SMTP password or Gmail App Password              |
| `SMTP_FROM`      | no       | From header (default `LuxuryStay Hospitality <noreply@luxurystay.com>`) |
| `BREVO_API_KEY`  | no       | Brevo Transactional Email API key (preferred)    |

\* Required for password-reset and booking-confirmation emails when `BREVO_API_KEY` is not set.
When `BREVO_API_KEY` is present, mail is sent through the Brevo API using `SMTP_FROM` as the
sender; otherwise the API falls back to Nodemailer over SMTP. For Gmail, enable 2-Step
Verification and create an **App Password** — regular account passwords are rejected by SMTP.

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Seed the room collection

```bash
cd server
npm run seed:rooms
```

Seeding is idempotent: rooms are matched by room number, so re-running never overwrites staff edits.

### 4. Start both apps

```bash
# Terminal 1 — API on http://localhost:5000
cd server
npm run dev

# Terminal 2 — client on http://localhost:3000
cd client
npm run dev
```

The Vite dev server proxies `/api` requests to the Express server, so the browser uses one origin.

### First admin account

Public registration creates **guest** accounts only. To access the staff portal, promote a user to
`admin` in MongoDB (for example with MongoDB Compass), then sign in at `/login`. Admins can create
and manage the remaining staff accounts from the Users page.

> Password-reset codes and booking invoices are delivered through the Brevo API when
> `BREVO_API_KEY` is set, and through Nodemailer/SMTP otherwise. Delivery attempts log a clear
> `[Email]` line in the server console. If no provider is configured, bookings still succeed and
> return `emailSent: false`; reset delivery failures are logged without revealing account existence.

---

## Core API Endpoints

All protected routes expect `Authorization: Bearer <token>`. Roles are enforced in middleware.

| Method   | Endpoint                                 | Access                         | Purpose                              |
| -------- | ---------------------------------------- | ------------------------------ | ------------------------------------ |
| `GET`    | `/api`                                   | Public                         | Health check                         |
| `POST`   | `/api/auth/register`                     | Public                         | Create a guest account               |
| `POST`   | `/api/auth/login`                        | Public                         | Sign in and receive a JWT            |
| `POST`   | `/api/auth/forgot-password`              | Public                         | Request a 6-digit reset code         |
| `POST`   | `/api/auth/reset-password`               | Public                         | Set a new password with the code     |
| `GET`    | `/api/auth/me`                           | Authenticated                  | Current user profile                 |
| `GET`    | `/api/rooms`                             | Public                         | Browse the suite collection          |
| `GET`    | `/api/rooms/:id`                         | Authenticated                  | Room details                         |
| `POST`   | `/api/rooms`                             | Admin, manager                 | Create a room                        |
| `PUT`    | `/api/rooms/:id`                         | Admin, manager                 | Update a room                        |
| `DELETE` | `/api/rooms/:id`                         | Admin, manager                 | Delete a room                        |
| `POST`   | `/api/bookings`                          | Authenticated                  | Reserve a room                       |
| `GET`    | `/api/bookings/me`                       | Authenticated                  | Own reservations                     |
| `GET`    | `/api/bookings`                          | Staff                          | Full reservation book                |
| `GET`    | `/api/bookings/room/:roomId/booked-dates`| Public                         | Blocked date ranges for a room       |
| `GET`    | `/api/bookings/:id/invoice`              | Owner guest or staff           | Invoice with charges, tax, total     |
| `PATCH`  | `/api/bookings/:id/cancel`               | Owner guest or staff           | Cancel a pending/confirmed booking   |
| `PUT`    | `/api/bookings/:id/status`               | Staff                          | Update booking lifecycle status      |
| `GET`    | `/api/dashboard`                         | Staff                          | Occupancy, revenue, and alerts       |
| `GET`    | `/api/users`                             | Admin                          | List users                           |
| `POST`   | `/api/users`                             | Admin                          | Create a staff or guest account      |
| `PUT`    | `/api/users/:id`                         | Admin                          | Update a user                        |
| `PATCH`  | `/api/users/:id/status`                  | Admin                          | Activate or deactivate a user        |
| `GET`    | `/api/service-requests`                  | Authenticated                  | Own requests, or all for staff       |
| `POST`   | `/api/service-requests`                  | Authenticated                  | Request a concierge service          |
| `PATCH`  | `/api/service-requests/:id`              | Staff                          | Update status, priority, or charge   |
| `GET`    | `/api/feedback`                          | Authenticated                  | Own feedback, or all for staff       |
| `POST`   | `/api/feedback`                          | Authenticated                  | Submit a review                      |
| `GET`    | `/api/settings`                          | Authenticated                  | Hotel configuration                  |
| `PUT`    | `/api/settings`                          | Admin                          | Update hotel configuration           |

---

## Available Scripts

### `client/`

| Script            | Purpose                        |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start Vite with HMR            |
| `npm run build`   | Production build into `dist/`  |
| `npm run preview` | Preview the production build   |
| `npm run lint`    | Run Oxlint                     |

### `server/`

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start Nodemon with hot reload    |
| `npm start`         | Start with plain Node            |
| `npm run seed:rooms`| Seed the signature room catalog  |

---

## Security Notes

- Secrets live only in `server/.env`; `.env`, `node_modules/`, and `dist/` are git-ignored.
- Passwords are hashed with bcrypt and never returned by the API.
- JWTs are signed with a server-only secret and validated on every protected request.
- Role checks are applied server-side in addition to client-side route guards.

---

## Author

**Kabeer Faisal** — LuxuryStay Hospitality

© 2026 LuxuryStay Hospitality. All rights reserved.
