# Security Policy

## Overview
This document outlines the security measures, architectures, and practices implemented in **PortfoliOS** to ensure the integrity, confidentiality, and availability of user data and the platform itself.

## 🛡️ Security Architecture

### 1. Unified Authentication
- **Provider**: Firebase Authentication.
- **Persistence**: `indexedDBLocalPersistence` for cross-tab session synchronization.
- **Anonymous Sessions**: Guest users are initialized with an anonymous session to track non-sensitive data (e.g., App Store downloads).
- **Hardening**: Mandatory login/register for persistent apps like **Notes**.

### 2. Content Security Policy (CSP)
- **Implementation**: Managed via `middleware.ts` and `next.config.js`.
- **Nonce-Based**: Dynamic nonces are generated per request and injected into all script tags.
- **Strictness**: `strict-dynamic` is used to allow trusted scripts to load their dependencies while blocking untrusted inline scripts.
- **Reporting**: Violations are reported to `/api/security/csp-report`.

### 3. API Protection
- **Rate Limiting**: Integrated with Upstash Redis (`@upstash/ratelimit`) on sensitive routes (YouTube Search, Auth).
- **Same-Origin Enforcement**: Utilities in `src/lib/api/security.ts` ensure APIs are only consumable by the PortfoliOS frontend.
- **App Check**: Protected by Firebase App Check with reCAPTCHA v3 to prevent bot abuse.

### 4. Database Security
- **Firestore Rules**: Enforces strict ownership.
  - Users can only `read/write` documents where `ownerId == auth.uid`.
  - Public collections are read-only and restricted.

## 🚀 Secure Development Lifecycle
- **Build Checks**: Continuous integration via `npm run build` which enforces strict TypeScript and ESLint rules.
- **Secret Scanning**: `npm run security:secrets` prevents accidental leak of API keys.
- **Audit**: `npm run security:audit` for dependency vulnerability scanning.

## 📞 Reporting Vulnerabilities
If you discover a security vulnerability, please do NOT open a public issue. Instead, contact the administrator directly at [admin@danielcabrera.es](mailto:admin@danielcabrera.es).

---
*Last Updated: March 2026*
