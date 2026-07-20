# ComoMás Portfolio + Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish ComoMás as a startup project in the Portfolio app and ship a production Blog post with cover + screenshot gallery, delivered as two branches/PRs.

**Architecture:** Portfolio projects remain static JSON + i18n. Images live on Cloudflare R2 under `cdn.danielcabrera.es/img/`. Blog posts stay in Firestore `blog`; the Blog UI gains optional `coverImage` + `images[]`. CDN upload once; PR 1 wires Portfolio; PR 2 wires Blog UI + Admin seed to prod.

**Tech Stack:** Next.js, Firestore Admin SDK, Cloudflare R2 (`@aws-sdk/client-s3`), Vitest, Playwright (landing capture), pnpm

## Global Constraints

- Delivery: **2 branches / 2 PRs** — `feat/comomas-project` and `feat/comomas-blog`
- Spec: `docs/superpowers/specs/2026-07-21-comomas-portfolio-blog-design.md`
- `mainImage` / blog `coverImage` **must** be the OG asset (`ComoMas_Project_Image.webp`)
- Reuse CDN `/img/ComoMas_*` URLs across Portfolio and Blog (no duplicate blog-prefixed assets)
- Blog body remains **plain text** (paragraphs via `\n\n`); no markdown/HTML
- Client cannot write Firestore `blog` — seed only via Admin SDK
- Do not commit `.env`, secrets, or `tmp/` assets
- User-provided screenshots path base: `C:\Users\K3IN0X\.cursor\projects\c-Users-K3IN0X-Documents-workspace-Portfolios-portfoliOS\assets\`

---

## File structure

| Path | Responsibility |
|------|----------------|
| `src/lib/r2.ts` | Add `uploadBufferToR2Key(buffer, key, contentType)` for fixed `/img/` keys |
| `scripts/upload-comomas-assets.mjs` | Download OG, capture landing, upload all assets to R2 |
| `scripts/seed-comomas-blog.mjs` | Idempotent Firestore upsert `blog/comomas-launch` |
| `src/lib/projects.json` | ComoMás project entry |
| `src/lib/locales/en.json` / `es.json` | Project copy keys |
| `src/lib/blog.ts` | `splitBlogParagraphs(content: string): string[]` |
| `src/components/apps/Blog.tsx` | Render cover, paragraphs, gallery |
| `docs/backend.json` | Document optional BlogPost fields |
| `tests/blog/paragraphs.test.ts` | Unit tests for paragraph splitter |

---

## Phase 0 — Shared CDN upload (before / with PR 1)

### Task 0: R2 fixed-key upload helper + asset upload script

**Files:**
- Modify: `src/lib/r2.ts`
- Create: `scripts/upload-comomas-assets.mjs`
- Create: `tmp/comomas/` (gitignored local only — do not commit)

**Interfaces:**
- Produces: `uploadBufferToR2Key(file: Buffer, key: string, contentType: string): Promise<string>`
- Produces CDN URLs (exact):
  - `https://cdn.danielcabrera.es/img/ComoMas_Project_Image.webp`
  - `https://cdn.danielcabrera.es/img/ComoMas_Gallery_Landing.png`
  - `https://cdn.danielcabrera.es/img/ComoMas_Gallery_Planificador.png`
  - `https://cdn.danielcabrera.es/img/ComoMas_Gallery_Compra.png`
  - `https://cdn.danielcabrera.es/img/ComoMas_Gallery_Ajustes.png`
  - `https://cdn.danielcabrera.es/img/ComoMas_Gallery_Nutricion.png`
  - `https://cdn.danielcabrera.es/img/ComoMas_Gallery_Premium.png`

- [ ] **Step 1: Extend `src/lib/r2.ts`**

Keep existing `uploadToR2`. Add:

```ts
export async function uploadBufferToR2Key(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("R2 configuration is missing");
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return `https://${R2_PUBLIC_DOMAIN}/${key}`;
}
```

- [ ] **Step 2: Ensure `tmp/` is gitignored**

If `.gitignore` lacks `tmp/`, add `tmp/`.

- [ ] **Step 3: Create `scripts/upload-comomas-assets.mjs`**

Script responsibilities (Node ESM, load `.env.local` via `dotenv` if available, else require env already set):

1. Create `tmp/comomas/`.
2. Download `https://comomas.com/og-image.png` → `tmp/comomas/og.png`.
3. Convert OG to webp (use `sharp` if in deps; else upload PNG as webp-named only if conversion unavailable — prefer installing/using sharp one-shot via `npx sharp-cli` or add temporary convert with PowerShell/.NET). Preferred: use `sharp` already or `npx --yes sharp-cli` / inline:

```js
import sharp from "sharp";
await sharp("tmp/comomas/og.png").webp({ quality: 85 }).toFile("tmp/comomas/ComoMas_Project_Image.webp");
```

If `sharp` is not a dependency, run conversion via:

```bash
npx --yes sharp-cli -i tmp/comomas/og.png -o tmp/comomas/ComoMas_Project_Image.webp
```

4. Capture landing with Playwright MCP or CLI → `tmp/comomas/ComoMas_Gallery_Landing.png` (desktop viewport ~1440x900, full hero).
5. Copy user screenshots into `tmp/comomas/` with target names:

| Source filename contains | Dest |
|--------------------------|------|
| `iPhone-Planificador` | `ComoMas_Gallery_Planificador.png` |
| `iPhone-Compra` | `ComoMas_Gallery_Compra.png` |
| `iPhone-Ajustes` | `ComoMas_Gallery_Ajustes.png` |
| `iPhone-Nutricion` | `ComoMas_Gallery_Nutricion.png` |
| `iPhone-Premium` | `ComoMas_Gallery_Premium.png` |

6. Upload each file with `PutObject` to keys `img/<filename>` using env `R2_*` (inline S3 client in the script is OK to avoid TS compile of `src/lib/r2.ts` for a one-off; or use `tsx` to import the helper).

7. Print each public URL and verify HTTP 200 with `fetch`.

- [ ] **Step 4: Run upload script**

```bash
node --env-file=.env.local scripts/upload-comomas-assets.mjs
```

Expected: seven URLs printed; each `curl -I` / `Invoke-WebRequest` returns 200.

- [ ] **Step 5: Commit only the R2 helper (not tmp assets) on `feat/comomas-project` after branch creation in Task 1**

Do not commit binary assets under `tmp/`. The upload script may be committed in PR 1 if useful for re-runs.

---

## Phase 1 — PR `feat/comomas-project`

### Task 1: Branch + project JSON + i18n

**Files:**
- Create branch: `feat/comomas-project` from `main`
- Modify: `src/lib/projects.json` (insert after `businfy` or next to other startups)
- Modify: `src/lib/locales/en.json` under `projects`
- Modify: `src/lib/locales/es.json` under `projects`
- Optionally include: `src/lib/r2.ts`, `scripts/upload-comomas-assets.mjs`, `.gitignore` tmp entry

**Interfaces:**
- Consumes: CDN URLs from Task 0
- Produces: i18n keys `projects.comomas.title|descriptionShort|descriptionLong`

- [ ] **Step 1: Create branch**

```bash
git checkout main
git pull
git checkout -b feat/comomas-project
```

- [ ] **Step 2: Add locale entries**

`en.json` → `projects.comomas`:

```json
"comomas": {
  "title": "ComoMás (Startup)",
  "descriptionShort": "Weekly meal menus adapted to your budget, allergies, and kitchen. Shopping list with real supermarket prices. Coming soon to the App Store and Google Play.",
  "descriptionLong": "ComoMás plans breakfast, lunch, and dinner for the whole week based on budget, preferences, and kitchen equipment. It includes personalization (allergens, cuisine style), a multi-supermarket shopping list with real prices, nutrition/macros tracking, and a Premium plan. Landing at comomas.com; store launch imminent."
}
```

`es.json` → `projects.comomas`:

```json
"comomas": {
  "title": "ComoMás (Startup)",
  "descriptionShort": "App de menús semanales adaptados a presupuesto, alergias y cocina. Lista de la compra con precios reales de supermercados. Próximamente en App Store y Google Play.",
  "descriptionLong": "ComoMás planifica desayuno, comida y cena de toda la semana según presupuesto, preferencias y equipamiento. Incluye personalización (alérgenos, tipo de cocina), lista de compra multi-supermercado con precios reales, seguimiento nutricional/macros y plan Premium. Landing en comomas.com; lanzamiento inminente en stores."
}
```

- [ ] **Step 3: Add `projects.json` entry**

Insert object (exact fields from spec) with gallery as `{ imageUrl, imageHint }` objects — never bare strings.

- [ ] **Step 4: Manual verify locally**

```bash
pnpm dev
```

Open Portfolio app → filter startup → open ComoMás → confirm OG main image + 6 gallery images + links.

- [ ] **Step 5: Commit**

```bash
git add src/lib/projects.json src/lib/locales/en.json src/lib/locales/es.json src/lib/r2.ts scripts/upload-comomas-assets.mjs .gitignore
git commit -m "$(cat <<'EOF'
Add ComoMás startup project to the Portfolio app.

Publish CDN-backed OG and app screenshots so the launch product is visible before store release.
EOF
)"
```

(On Windows PowerShell, use an equivalent here-string for the commit message.)

- [ ] **Step 6: Push and open PR 1**

```bash
git push -u origin HEAD
gh pr create --title "Add ComoMás to Portfolio" --body "$(cat <<'EOF'
## Summary
- Add ComoMás as a startup project in Portfolio (`projects.json` + EN/ES copy)
- Wire CDN images (OG as main, landing + 5 iPhone screens in gallery)
- Add R2 fixed-key upload helper / asset script for `/img/ComoMas_*`

## Test plan
- [ ] Portfolio → startup filter shows ComoMás
- [ ] Detail view: OG main image + 6 gallery images load from cdn.danielcabrera.es
- [ ] Live link → https://www.comomas.com
- [ ] GitHub link → https://github.com/danikeinox/comomas
EOF
)"
```

---

## Phase 2 — PR `feat/comomas-blog`

### Task 2: `splitBlogParagraphs` + unit tests

**Files:**
- Create: `src/lib/blog.ts`
- Create: `tests/blog/paragraphs.test.ts`

**Interfaces:**
- Produces: `export function splitBlogParagraphs(content: string): string[]`

- [ ] **Step 1: Create branch from main**

```bash
git checkout main
git pull
git checkout -b feat/comomas-blog
```

(If PR 1 not merged yet, branch from `main` anyway; Blog PR must not edit `projects.json`.)

- [ ] **Step 2: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { splitBlogParagraphs } from "@/lib/blog";

describe("splitBlogParagraphs", () => {
  it("splits on blank lines", () => {
    expect(splitBlogParagraphs("Uno.\n\nDos.")).toEqual(["Uno.", "Dos."]);
  });

  it("trims and drops empty segments", () => {
    expect(splitBlogParagraphs("\n\nHola\n\n\nMundo\n")).toEqual(["Hola", "Mundo"]);
  });

  it("keeps single newlines inside a paragraph as spaces collapsed? NO — keep inner newlines as single paragraph string trimmed only at ends", () => {
    expect(splitBlogParagraphs("Linea A\nLinea B\n\nSiguiente")).toEqual([
      "Linea A\nLinea B",
      "Siguiente",
    ]);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
pnpm test:run tests/blog/paragraphs.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 4: Implement `src/lib/blog.ts`**

```ts
export function splitBlogParagraphs(content: string): string[] {
  if (!content) return [];
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm test:run tests/blog/paragraphs.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/blog.ts tests/blog/paragraphs.test.ts
git commit -m "feat(blog): add paragraph splitter for plain-text posts"
```

### Task 3: Blog UI — cover + paragraphs + gallery

**Files:**
- Modify: `src/components/apps/Blog.tsx`
- Modify: `docs/backend.json` (`BlogPost` properties)

**Interfaces:**
- Consumes: `splitBlogParagraphs` from `@/lib/blog`
- Consumes post fields: `coverImage?: string`, `images?: string[]`

- [ ] **Step 1: Update `docs/backend.json` BlogPost**

Add optional properties:

```json
"coverImage": {
  "type": "string",
  "description": "Optional CDN URL for the post cover image."
},
"images": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Optional gallery of CDN image URLs."
}
```

- [ ] **Step 2: Update `Blog.tsx` rendering**

Inside each post card:

1. If `post.coverImage`, render:

```tsx
<div className="mb-4 overflow-hidden rounded-lg">
  <Image
    src={post.coverImage}
    alt=""
    width={1200}
    height={630}
    className="w-full h-auto object-cover"
  />
</div>
```

(`alt` can be `post.title`.)

2. Replace single `<p>{post.content}</p>` with:

```tsx
<div className="mt-2 space-y-3">
  {splitBlogParagraphs(post.content).map((paragraph, i) => (
    <p key={i} className="text-[#8A8A8E] dark:text-[#8E8E93] text-base leading-relaxed">
      {paragraph}
    </p>
  ))}
</div>
```

3. If `Array.isArray(post.images) && post.images.length > 0`:

```tsx
<div className="mt-4 flex gap-3 overflow-x-auto pb-2">
  {post.images.map((src: string) => (
    <Image
      key={src}
      src={src}
      alt=""
      width={195}
      height={422}
      className="h-64 w-auto rounded-lg border border-neutral-200 dark:border-[#38383A] object-cover shrink-0"
    />
  ))}
</div>
```

Import `Image` from `next/image` and `splitBlogParagraphs` from `@/lib/blog`.

Keep author / title / date order: author → cover → title → paragraphs → gallery → date (or author → title → cover → paragraphs → gallery → date). Preferred visual order: **author, title, cover, paragraphs, gallery, date**.

- [ ] **Step 3: Smoke check**

```bash
pnpm dev
```

Temporarily seed a local Firestore doc or mock — if local Firebase points at prod, skip until Task 4. At minimum ensure TypeScript builds:

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/apps/Blog.tsx docs/backend.json
git commit -m "feat(blog): render optional cover image and screenshot gallery"
```

### Task 4: Seed script + publish production post

**Files:**
- Create: `scripts/seed-comomas-blog.mjs`

**Interfaces:**
- Upserts Firestore doc id `comomas-launch` in collection `blog`
- Fields exactly as spec (Spanish content, cover + 6 images)

- [ ] **Step 1: Write `scripts/seed-comomas-blog.mjs`**

Use `firebase-admin` with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` from `.env.local`.

```js
// Pseudocode structure — implement fully in the script file
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const content = [
  "ComoMás es mi nueva app para planificar el menú semanal sin quebraderos de cabeza: desayuno, comida y cena adaptados a tu presupuesto, alergias y forma de cocinar.",
  "El problema es familiar: acabar pidiendo lo mismo, saltarse el presupuesto o improvisar a última hora. ComoMás genera un plan semanal y te acompaña hasta la compra.",
  "Puedes personalizar alérgenos, tipo de cocina y equipamiento; ver la lista de la compra con precios reales de supermercados (Mercadona, Lidl, Aldi…); controlar macros y calorías; y desbloquear extras con ComoMás Premium.",
  "Stack: TypeScript, Expo / React Native, Express, PostgreSQL + Drizzle, Zod, RevenueCat y EAS para el camino a App Store y Google Play.",
  "La landing ya está en https://www.comomas.com y el lanzamiento en stores es inminente. También está publicada como startup en la app Portfolio de danielcabrera.es.",
].join("\n\n");

await db.collection("blog").doc("comomas-launch").set(
  {
    title: "Lanzando ComoMás: menús semanales a tu presupuesto",
    author: "Daniel Cabrera",
    content,
    coverImage: "https://cdn.danielcabrera.es/img/ComoMas_Project_Image.webp",
    images: [
      "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Landing.png",
      "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Planificador.png",
      "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Compra.png",
      "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Ajustes.png",
      "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Nutricion.png",
      "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Premium.png",
    ],
    createdAt: Timestamp.now(),
  },
  { merge: true }
);
```

Note: on re-run with `merge: true`, either preserve original `createdAt` (read-then-write) or always refresh — prefer **set createdAt only if missing** for true idempotency.

- [ ] **Step 2: Commit script**

```bash
git add scripts/seed-comomas-blog.mjs
git commit -m "chore(blog): add idempotent seed script for ComoMás launch post"
```

- [ ] **Step 3: Push and open PR 2**

```bash
git push -u origin HEAD
gh pr create --title "Blog: cover/gallery UI + ComoMás launch post" --body "$(cat <<'EOF'
## Summary
- Extend Blog UI with optional coverImage + images gallery
- Add paragraph splitter + tests
- Add Admin seed script for production post `blog/comomas-launch`

## Test plan
- [ ] `pnpm test:run tests/blog/paragraphs.test.ts` passes
- [ ] Old text-only posts still render
- [ ] After merge + seed: `/app/blog` shows ComoMás post with cover + screenshots
- [ ] Images load from cdn.danielcabrera.es
EOF
)"
```

- [ ] **Step 4: After PR 2 merge (and CDN assets live), run seed against production**

```bash
node --env-file=.env.local scripts/seed-comomas-blog.mjs
```

Expected: log `Upserted blog/comomas-launch`. Verify at production `/app/blog`.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Portfolio entry + startup tags + stack + links | Task 1 |
| OG as mainImage | Task 0 + 1 |
| Gallery landing + 5 iPhone | Task 0 + 1 |
| EN/ES copy | Task 1 |
| Blog coverImage + images schema | Task 3 |
| Blog UI render | Task 3 |
| Firestore prod post | Task 4 |
| 2 PRs | Task 1 + Task 2–4 |
| Reuse CDN URLs | Task 0 / 4 |

## Placeholder scan

No TBD / “implement later” left in tasks above.
