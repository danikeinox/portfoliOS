# portfoliOS

`portfoliOS` is an interactive portfolio that reproduces the iPhone user experience in the browser while exposing real professional content, integrations, and product logic.

The application is built with Next.js App Router and is designed as a complete UI shell: home screen, app launcher, dock, widgets, notifications, app frames, in-app navigation, onboarding, consent management, analytics, and backend API integrations.

## What The Project Solves

- Presents portfolio content in a differentiated and memorable format.
- Demonstrates frontend architecture and UX engineering through a fully simulated mobile OS interface.
- Integrates real services (Firebase, Google Calendar, Spotify, News API, email reporting) to move beyond static demo behavior.
- Includes production-focused concerns: API hardening, validation, rate limiting, crash reporting, and test coverage.

## Core Capabilities

- iOS-like shell with home screen, app icons, dock, status bar, control center, widgets, and app library.
- Dynamic app rendering through an app registry (`src/lib/apps.ts`) and route-based app viewer.
- Built-in apps for portfolio content, communication, media, productivity, and utility experiences.
- App Store simulation with install/open flows and support for installed external web apps.
- Startup consent flow (terms + cookies) and gated analytics loading.
- Internationalization (Spanish/English), system-language autodetection, and persistent language preferences.
- Theme and personalization support (wallpaper, light/dark/system appearance, clock format).
- API layer with shared security utilities (same-origin checks, JSON validation, rate limiting).
- Crash-report pipeline for installed web apps, including one-click user reporting by email.

## Technology Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Radix UI
- Firebase (Auth + Firestore + Admin)
- React Query
- DnD Kit, React Spring, @use-gesture
- Zod validation
- Resend email API
- Upstash Redis rate limiting

## Application Modules

### UI Shell

- `src/components/ios`
  - Home screen, dock, app library, status bar.
  - Notification center and control center.
  - Widget interactions and edit/customization surfaces.

### Apps Layer

- `src/components/apps`
  - Functional app implementations (About, Portfolio, Safari, Settings, Calendar, News, etc.).
  - Crash boundaries and generic web app container for installed external apps.
- `src/components/apps-developed`
  - Wrappers/adapters used by `AppViewer` for route-level composition.
- `src/components/apps/AppViewer.tsx`
  - App resolver and dynamic loader by slug.

### Platform State

- `src/hooks`
  - i18n, theme, wallpaper, notifications, home screen state, system state, Google Calendar integration.

### Backend/API

- `src/app/api`
  - `appstore/*`: app store data and social/profile operations.
  - `create-event`: Google Calendar event creation.
  - `get-events`: Calendar event fetching.
  - `spotify`: now playing/activity integration.
  - `news`: server-side news feed proxy.
  - `weather`: weather provider route.
  - `report-app-crash`: production incident reporting by email.
- `src/lib/api/security.ts`
  - Shared API controls: rate limiting, same-origin guard, JSON request enforcement, body parsing helper.

## App Catalog

Defined in `src/lib/apps.ts` and rendered dynamically.

### Home Screen Apps

- About
- Portfolio
- YouTube
- Services
- Testimonials
- Contact
- Blog
- FaceTime
- Calendar
- Clock
- Weather
- Notes
- Photos
- Camera
- GitHub
- LinkedIn
- Settings
- Maps
- TV
- Podcasts
- App Store
- News

### Dock Apps

- Phone
- Safari
- Messages
- Spotify

### Installed External Apps

- Persisted in local storage via `src/lib/installed-apps.ts`.
- Resolved as `installed-<appId>` routes (e.g. `/app/installed-abc123`).
- Rendered inside sandboxed iframe through `GenericWebAppContainer`.

## Startup, Consent, and Analytics

- Global startup experience is applied in `src/app/layout.tsx`.
- Users must pass onboarding consent steps before entering the app shell.
- Consent is persisted and reused across sessions.
- Google Analytics loads only when consent allows analytics and terms are accepted.

## Internationalization

- Locale files: `src/lib/locales/es.json`, `src/lib/locales/en.json`.
- i18n provider: `src/hooks/use-i18n.tsx`.
- Supports:
  - System language autodetection (`es*` => Spanish, otherwise English).
  - Manual override from Settings.
  - Cached locale and locale mode (`auto/manual`).

## Crash Reporting Flow

- If an installed external app fails to load, user sees a fallback popup.
- Popup includes `Enviar informe de error` button.
- Client sends structured incident payload to `/api/report-app-crash`.
- Server validates payload, rate-limits requests, and sends alert email via Resend.
- Response includes a `reportId` used to correlate UI reports with incoming emails.

## Security Model

- API route protections include:
  - Same-origin enforcement where applicable.
  - Strict JSON content-type checks.
  - Request schema validation.
  - Rate limiting (Upstash-backed with in-memory fallback).
- Secret leakage prevention:
  - Environment variables only (`.env*` files).
  - `npm run security:secrets` scanner.

## Tests

- Vitest setup is included.
- Backend-oriented tests cover API helpers and critical route behavior.

Run tests:

```bash
npm run test:run
```

Coverage:

```bash
npm run test:coverage
```

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

Copy `.env.example` into `.env.local` and set values.

```bash
cp .env.example .env.local
```

### 3) Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.example` as the source of truth.

### Site

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Firebase (Client)

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### External Services

- `NEWS_API_KEY`
- `RESEND_API_KEY`
- `APP_CRASH_REPORT_TO` (optional crash report destination email)
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

### Rate Limiting (Recommended in Production)

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

If Upstash vars are missing, APIs fall back to in-memory rate limit behavior.

## Scripts

- `npm run dev`: start development server.
- `npm run build`: create production build.
- `npm run start`: run production server.
- `npm run lint`: run lint checks.
- `npm run test`: watch tests.
- `npm run test:run`: run tests once.
- `npm run test:coverage`: run tests with coverage.
- `npm run security:secrets`: scan for potential exposed secrets.

## Deployment Notes

- Any Next.js-compatible hosting works.
- Configure all required env vars in your hosting platform.
- For distributed production, configure Upstash for consistent rate limits.
- Ensure Resend sender/domain configuration is valid for outbound alerts.

## Additional Documentation

- See `ABOUT.md` for a product-level deep explanation of goals, architecture, app behavior, and feature inventory.

## License

Private project. All rights reserved unless explicitly stated otherwise.
