# portfoliOS

iOS-inspired interactive portfolio built with Next.js, TypeScript and Tailwind CSS.

The project emulates a native iPhone experience (home screen, app launcher, system widgets, app views, Safari-like browser, settings, notifications, etc.) while presenting real professional content: projects, services, blog, testimonials and contact.

## Highlights

- iOS-like UI/UX shell with app navigation and dynamic app rendering.
- Modular app architecture (`src/components/apps`, `src/components/apps-developed`, `src/components/ios`).
- Built-in integrations:
	- Google Calendar events/scheduling
	- Spotify now-playing/activity
	- News API feed
	- Firebase (Auth + Firestore)
- Production hardening:
	- Security headers + CSP in `next.config.js`
	- Input validation/sanitization on server actions and API routes
	- Secret scan script to prevent hardcoded credential leaks
- SEO/PWA baseline (metadata, robots, sitemap, manifest, open graph image).

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Radix UI primitives
- Firebase (Auth + Firestore)
- React Query
- DnD Kit, React Spring, Gesture

## Project Structure

- `src/app`: Next.js routes, API handlers, actions, metadata endpoints.
- `src/components/apps`: portfolio app screens (About, Portfolio, Safari, Settings, etc.).
- `src/components/apps-developed`: wrappers/adapters for app screens.
- `src/components/ios`: iOS shell components (home screen, dock, control center, notifications, widgets).
- `src/hooks`: cross-app state and feature hooks.
- `src/lib`: app registry, translations, portfolio data, helpers.
- `src/firebase`: Firebase provider and realtime hooks.
- `scripts/security`: repository secret scanning utilities.

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env.local` and fill required values.

```bash
cp .env.example .env.local
```

### 3) Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.example` as source of truth. Main groups:

- **Firebase (client)**
	- `NEXT_PUBLIC_FIREBASE_API_KEY`
	- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
	- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
	- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
	- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
	- `NEXT_PUBLIC_FIREBASE_APP_ID`
- **Site**
	- `NEXT_PUBLIC_SITE_URL`
- **External APIs**
	- `NEWS_API_KEY`
	- `RESEND_API_KEY`
	- `SPOTIFY_CLIENT_ID`
	- `SPOTIFY_CLIENT_SECRET`
	- `SPOTIFY_REFRESH_TOKEN`
	- `GOOGLE_CALENDAR_ID`
	- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
	- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

## Scripts

- `npm run dev` – start local dev server.
- `npm run build` – production build.
- `npm run start` – run production server.
- `npm run lint` – lint checks.
- `npm run security:secrets` – scan source/config files for potential hardcoded secrets.

## Security Workflow

- Keep credentials only in `.env*` files (already gitignored).
- Run before pushing:

```bash
npm run security:secrets
```

- If any secret is exposed, rotate it immediately in the provider dashboard.

## Build & Deploy

```bash
npm run build
npm run start
```

Deploy targets can include Firebase App Hosting or any Next.js-compatible platform.

## License

Private project / all rights reserved unless explicitly stated otherwise.
