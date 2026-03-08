# ABOUT: portfoliOS

## Overview

`portfoliOS` is an interactive web portfolio that recreates an iPhone-like operating experience as the primary navigation and storytelling interface.

Instead of a traditional portfolio with sections and scrolling, users interact with app icons, dock apps, widgets, and app screens. Each app represents a functional domain such as portfolio projects, contact, blog, maps, media, settings, or App Store behavior.

The project serves three goals:

- Product presentation: showcase professional work in a memorable, high-polish format.
- Technical demonstration: prove frontend architecture, state management, and UX engineering capabilities.
- Integration depth: connect with real APIs/services (Firebase, Google Calendar, Spotify, News, email reporting) rather than static mock-only content.

## Primary Use Cases

- Recruiters and clients exploring projects and services through an app-based UX.
- Visitors contacting the owner via integrated forms and communication flows.
- Demonstrating engineering quality around architecture, i18n, security, and production hardening.
- Simulating an app ecosystem including installation, launch, and failure handling.

## Product Experience

The experience is designed to feel like a native smartphone shell:

- Home screen with app icons and visual hierarchy.
- Dock with persistent quick-access apps.
- App viewer with app frames and per-app theming behavior.
- Widgets and app library patterns.
- Notification-style interactions.
- Settings app for personalization and system-like preferences.

## Functional Areas

### 1) iOS Shell and Navigation

Core shell components live in `src/components/ios`.

Key capabilities:

- Home screen rendering and icon layout.
- Dock behavior with common apps.
- Status and control surfaces.
- Widget wrappers and edit flows.
- App library and folder-like organization patterns.

This layer provides the operating-system metaphor and orchestrates the app launch model.

### 2) App Runtime

Apps are resolved dynamically through `src/components/apps/AppViewer.tsx` and app metadata in `src/lib/apps.ts`.

Runtime behavior:

- App slug resolves to a specific app component.
- App frame wraps content with consistent shell and controls.
- Crash boundaries isolate app errors from collapsing the whole experience.
- Some apps enforce light/dark visual style to mimic platform defaults.

### 3) Portfolio Content Apps

Content and communication are presented as individual apps:

- About: personal profile and professional narrative.
- Portfolio: project showcases and links.
- Services: service offerings and positioning.
- Blog: editorial/content stream.
- Testimonials: social proof and feedback.
- Contact/Messages/Phone: contact pathways.

These apps convert a classic portfolio into an app-native journey.

### 4) Utility and System-Style Apps

The system includes utility-style experiences:

- Settings: language, appearance, wallpaper, and system preferences.
- Calendar and Clock: date/time interactions.
- Weather and News: external data integrations.
- Notes and Photos: content-oriented utility surfaces.
- Maps, Safari, Camera, TV, Podcasts, Spotify: media and browsing style interactions.

### 5) App Store and Installed Apps

App Store functionality enables install/open behavior for external web apps:

- Installed app records are persisted in local storage.
- Installed apps are exposed as dynamic routes using `installed-<appId>` slug format.
- External apps render in sandboxed iframes via `GenericWebAppContainer`.
- Loading failures trigger resilient fallback UI.

This makes the portfolio feel like an extensible app ecosystem instead of a fixed set of pages.

## Backend and Integrations

API routes live in `src/app/api`.

Main integrations:

- App Store APIs: app data, categories, profile/social flows.
- Google Calendar APIs: event listing and event creation.
- Spotify API: playback/now-playing style data.
- News API: content feed proxy route.
- Weather API route.
- Crash report API: production incident email reporting from client fallback UI.

Server actions include email functionality (`src/app/actions/send-email.ts`) for contact workflows.

## Security and Reliability

### API Security

Shared protections are implemented in `src/lib/api/security.ts`:

- Rate limiting per route key.
- Same-origin checks.
- JSON content-type enforcement.
- Safe body parsing helpers.

Rate limiting strategy:

- Upstash Redis (recommended for production): distributed and persistent.
- In-memory fallback: local development and non-distributed fallback mode.

### Error Isolation and Recovery

- App crash boundaries prevent single-app failures from taking down the shell.
- Generic web app fallback popup gives users recovery options.
- User can submit crash report with one click from failure popup.
- Crash report includes context and a unique `reportId` for incident correlation.

## Crash Reporting Flow

When an installed external app fails, user sees a fallback popup with:

- Home button.
- Close button.
- Report button.

On report:

- Client sends structured payload to `/api/report-app-crash`.
- Payload includes app name, URL, reason code, path, browser context, connectivity, and timestamp.
- Server validates and rate-limits request.
- Server sends incident email via Resend to configured destination.
- API returns `reportId` shown in UI so support and owner can correlate report and email quickly.

## Internationalization and Localization

The project supports Spanish and English with locale JSON files:

- `src/lib/locales/es.json`
- `src/lib/locales/en.json`

Language behavior:

- System language autodetection on first use.
- Auto mode: Spanish for `es*`, English otherwise.
- Manual override in Settings.
- Preference persistence in local storage.

## Onboarding, Consent, and Analytics

Startup flow (`StartupExperience`) is globally mounted in root layout.

Purpose:

- Force first-run legal/consent interaction before full app access.
- Collect terms acceptance and cookie preference choices.
- Gate analytics loading based on explicit consent.

Analytics (`GoogleAnalytics`) only loads when consent and terms requirements are met.

## Theming and Personalization

System-like personalization includes:

- Light/dark/system appearance mode.
- Wallpaper selection.
- Clock format configuration.
- Stored preference state via hooks and providers.

This reinforces the OS simulation and improves user comfort.

## Architecture Snapshot

Top-level layers:

- `src/app`: routes, API handlers, actions, layout.
- `src/components/ios`: shell and system-like UI structures.
- `src/components/apps`: app screens and app runtime helpers.
- `src/components/apps-developed`: app adapters.
- `src/hooks`: domain and global state hooks.
- `src/lib`: static data, app registry, utility helpers, i18n sources.
- `src/firebase`: client/provider integrations for Firebase.

## Why This Project Is Valuable

For product audiences:

- Distinctive brand and presentation format.
- Engaging exploration that increases time-on-site.

For engineering audiences:

- Demonstrates component architecture and state orchestration.
- Demonstrates real-world integration and API hardening.
- Demonstrates error handling and production observability concerns.

For hiring/consulting:

- Shows both visual craft and backend-aware engineering.
- Proves capacity to deliver polished UX with operational thinking.

## Operational Notes

Environment variables define external connectivity and production behavior.

Important examples:

- `RESEND_API_KEY`
- `APP_CRASH_REPORT_TO`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Firebase and Google service credentials

For setup and run instructions, see `README.md`.
