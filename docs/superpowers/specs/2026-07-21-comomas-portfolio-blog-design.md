# ComoMás — Portfolio project + Blog post

**Date:** 2026-07-21  
**Status:** Approved (approach A)  
**Delivery:** 2 branches / 2 PRs

## Goal

Publish **ComoMás** in the Portfolio app as a startup project (with CDN images), and ship a production Blog post with the same story and screenshots. Delivery is split into two independent PRs.

## Out of scope

- Blog admin dashboard
- Markdown / HTML body rendering
- SEO case-study page (`/proyectos/comomas`)
- App Store listing inside this portfolio’s App Store app
- Expanding gallery after store launch (future follow-up)

---

## PR 1 — `feat/comomas-project`

### Purpose

Add ComoMás to the static Portfolio catalog so it appears in the Projects app with startup filters, stack, links, and images.

### Data changes

| File | Change |
|------|--------|
| `src/lib/projects.json` | New project entry `comomas` (prefer near other startups) |
| `src/lib/locales/en.json` | `projects.comomas.{title,descriptionShort,descriptionLong}` |
| `src/lib/locales/es.json` | Same keys in Spanish |

### Project entry

```json
{
  "id": "comomas",
  "titleKey": "projects.comomas.title",
  "descriptionShortKey": "projects.comomas.descriptionShort",
  "descriptionLongKey": "projects.comomas.descriptionLong",
  "filterTags": ["personalProject", "startupAttempt", "inDevelopment"],
  "tags": [
    "TypeScript",
    "Expo",
    "React Native",
    "Node.js",
    "Express",
    "PostgreSQL",
    "Drizzle",
    "Zod",
    "RevenueCat",
    "EAS"
  ],
  "mainImage": {
    "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Project_Image.webp",
    "imageHint": "comomas weekly meal planning app og"
  },
  "gallery": [
    { "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Landing.png", "imageHint": "comomas landing page" },
    { "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Planificador.png", "imageHint": "weekly meal planner" },
    { "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Compra.png", "imageHint": "smart grocery list" },
    { "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Ajustes.png", "imageHint": "personalization allergens cuisine" },
    { "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Nutricion.png", "imageHint": "weekly macros nutrition" },
    { "imageUrl": "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Premium.png", "imageHint": "premium subscription screen" }
  ],
  "githubUrl": "https://github.com/danikeinox/comomas",
  "liveUrl": "https://www.comomas.com"
}
```

### Copy

**Title (EN/ES):** `ComoMás (Startup)`

**EN short:** Weekly meal menus adapted to your budget, allergies, and kitchen. Shopping list with real supermarket prices. Coming soon to the App Store and Google Play.

**EN long:** ComoMás plans breakfast, lunch, and dinner for the whole week based on budget, preferences, and kitchen equipment. It includes personalization (allergens, cuisine style), a multi-supermarket shopping list with real prices, nutrition/macros tracking, and a Premium plan. Landing at comomas.com; store launch imminent.

**ES short:** App de menús semanales adaptados a presupuesto, alergias y cocina. Lista de la compra con precios reales de supermercados. Próximamente en App Store y Google Play.

**ES long:** ComoMás planifica desayuno, comida y cena de toda la semana según presupuesto, preferencias y equipamiento. Incluye personalización (alérgenos, tipo de cocina), lista de compra multi-supermercado con precios reales, seguimiento nutricional/macros y plan Premium. Landing en comomas.com; lanzamiento inminente en stores.

### CDN assets (PR 1)

Upload to `cdn.danielcabrera.es` under `/img/` via R2 (`uploadToR2` pattern adapted to `img/` keys, or direct S3 PutObject):

| Local source | CDN key |
|--------------|---------|
| `https://comomas.com/og-image.png` (convert → webp) | `img/ComoMas_Project_Image.webp` |
| Playwright capture of landing hero | `img/ComoMas_Gallery_Landing.png` |
| User: Planificador screenshot | `img/ComoMas_Gallery_Planificador.png` |
| User: Compra screenshot | `img/ComoMas_Gallery_Compra.png` |
| User: Ajustes screenshot | `img/ComoMas_Gallery_Ajustes.png` |
| User: Nutrición screenshot | `img/ComoMas_Gallery_Nutricion.png` |
| User: Premium screenshot | `img/ComoMas_Gallery_Premium.png` |

`mainImage` **must** be the OG asset.

### Success criteria (PR 1)

- Project visible in Portfolio app with startup filter.
- Main image is OG; gallery shows landing + 5 app screens.
- Live + GitHub links work.
- No blog/Firestore changes in this PR.

---

## PR 2 — `feat/comomas-blog`

### Purpose

Support cover + image gallery on blog posts, then publish a production post about ComoMás with screenshots.

### Schema (`docs/backend.json` → `BlogPost`)

Existing required fields unchanged. Add optional:

| Field | Type | Notes |
|-------|------|--------|
| `coverImage` | `string` (URL) | Optional |
| `images` | `string[]` (URLs) | Optional; empty/missing = no gallery |

Legacy posts without these fields keep current text-only rendering.

### UI (`src/components/apps/Blog.tsx`)

1. If `coverImage`: render above title (full-width, rounded, Next `Image` or CDN `<img>`).
2. Split `content` on blank lines into paragraphs (`whitespace` / `\n\n`).
3. If `images?.length`: render gallery below content (responsive grid or horizontal scroll of phone screenshots).
4. Keep author, title, date behavior unchanged.

### CDN assets (PR 2)

Reuse the same visual assets; may use identical `/img/ComoMas_*` URLs already uploaded in PR 1 (preferred — no duplicate upload), or blog-prefixed keys if isolation is desired. **Preferred:** reuse PR 1 CDN URLs.

### Firestore document (production)

Collection: `blog`  
Write via Firebase Admin SDK (client writes are denied by rules).

```ts
{
  title: "Lanzando ComoMás: menús semanales a tu presupuesto",
  author: "Daniel Cabrera",
  createdAt: /* server Timestamp */,
  coverImage: "https://cdn.danielcabrera.es/img/ComoMas_Project_Image.webp",
  images: [
    "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Landing.png",
    "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Planificador.png",
    "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Compra.png",
    "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Ajustes.png",
    "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Nutricion.png",
    "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Premium.png"
  ],
  content: /* multi-paragraph plain text in Spanish — see below */
}
```

### Post content (ES)

Plain text, paragraphs separated by blank lines. Cover:

1. Intro: what ComoMás is and why it exists (weekly menus without the planning headache).
2. Problem: budget + allergies + “what do we eat?” friction.
3. Features: planner, personalization, real-price shopping list, nutrition/macros, Premium.
4. Stack (short): Expo/RN + Express + PostgreSQL/Drizzle + RevenueCat/EAS.
5. Status: landing live at comomas.com; App Store / Play Store soon; link to Portfolio project.

Exact wording can be polished during implementation; substance must match this outline.

### Implementation notes

- Seed/publish script: one-off Node script using existing `firebase-admin` + env (`FIREBASE_*`), not a public API route.
- Script may live under `scripts/` and should be safe to re-run (idempotent upsert by fixed doc id e.g. `comomas-launch`) or documented as one-shot.
- CSP / `next.config.js` already allow `cdn.danielcabrera.es` for images.

### Success criteria (PR 2)

- Blog UI renders cover + gallery for posts that have them.
- Old posts still render correctly.
- Production `/app/blog` shows the ComoMás post with images after deploy + Firestore write.
- No changes to `projects.json` in this PR (unless a tiny shared constant is justified — prefer none).

---

## Dependencies between PRs

```
PR 1 (CDN img + Portfolio entry) ──► merge/deploy
         │
         └── CDN URLs ready ──► PR 2 (Blog UI + Firestore post)
```

PR 2 can be developed in parallel using the planned CDN URLs, but Firestore publish should wait until images exist on the CDN (after PR 1 upload or a shared upload step before both PRs).

**Recommended sequence:** upload CDN assets once → open PR 1 → open PR 2 → merge PR 1 → merge PR 2 → run Firestore seed against prod.

## Verification

1. Local: Portfolio detail opens ComoMás; carousel shows all gallery objects.
2. Local: Blog mock/dev with sample doc shows cover + paragraphs + images.
3. Prod: `https://cdn.danielcabrera.es/img/ComoMas_*` return 200.
4. Prod: `/app/blog` lists the new post with images.
5. Prod: Portfolio filter “startup” includes ComoMás.
