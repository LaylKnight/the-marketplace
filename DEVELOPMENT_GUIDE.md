# Development Guide

Architectural overview, design decisions, and implementation notes for developers working on this Marketplace codebase.

---

## 1. Visual Foundation & Design System

- **Primary Accent:** Facebook Blue (`#1877F2`, hover `#166FE5`) defined in `src/app/globals.css`.
- **Surfaces & Borders:** `#F0F2F5` page background, `#FFFFFF` cards, `#CED0D4` borders, `#E4E6EB` secondary controls, `#1C1E21` primary text, `#65676B` muted text.
- **Typography:** `Geist` loaded via stylesheet link in `src/app/layout.tsx` (so offline/sandboxed `next build` passes without requiring build-time font downloads) and configured in `tailwind.config.ts`.
- **Loading & Placeholder Utilities (`src/app/globals.css`):**
  - `.fb-shimmer`: Animated linear-gradient sweep (`@keyframes fb-shimmer`) used across grid, list, image, and detail skeletons.
  - `.marketplace-placeholder-pattern`: Diagonal crosshatch pattern displayed when a listing has no photo or fails image loading.

---

## 2. Layout Architecture & Routing Strategy

Built with **Next.js 15 App Router** and TypeScript:

| Route | File | Rendering | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Static / Client | Main Marketplace homepage (`MarketplaceBrowser`) |
| `/category/[slug]` | `src/app/category/[slug]/page.tsx` | Dynamic (`await params`) | Category-filtered view for any of the 19 categories |
| `/category/electronics` | `src/app/category/electronics/page.tsx` | Static | Dedicated Electronics category example route |
| `/create` | `src/app/create/page.tsx` | Static / Client | Listing type selector |
| `/create/item` | `src/app/create/item/page.tsx` | Static / Client (`Suspense`) | Create, batch-create (`?mode=multiple`), or edit (`?edit=[id]`) form |
| `/item/[id]` | `src/app/item/[id]/page.tsx` | Dynamic (`useParams`) | Listing detail, edit/delete actions, and Message Seller |
| `/profile` | `src/app/profile/page.tsx` | Static / Client | Greg Wientjes Seller Profile + active listings |
| `/api/send-email` | `src/app/api/send-email/route.ts` | Node.js API Route | SMTP email delivery with weekly cap & cooldown |

> [!NOTE]
> `src/app/create/item/page.tsx` wraps its `useSearchParams()` consumer inside `<React.Suspense>` so Next.js 15 static prerendering succeeds cleanly during `npm run build`.

---

## 3. Data Layer (`src/lib/marketplace-store.ts`)

All Marketplace CRUD, image handling, notification management, and email dispatching are centralized in `src/lib/marketplace-store.ts`:

- **Dual-Mode Persistence:**
  - When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present (`isSupabaseConfigured === true`), all queries target Supabase.
  - When unconfigured, the store falls back seamlessly to `localStorage` (`marketplace_listings_v1`, `marketplace_messages_v1`, `marketplace_notifications_v1`) pre-seeded with sample listings.
- **Listing Operations:**
  - `fetchListings({ category, search })`
  - `fetchListingById(id)`
  - `createListing(input)` — validates/re-encodes the photo, uploads to `listing-images`, inserts into `listings`, and saves `seller_email` in `localStorage` for notification filtering.
  - `updateListing(id, input)` — updates `listings` fields, uploads replacement image if provided, and calls `removeStorageImageByUrl` to delete superseded images from `listing-images`.
  - `deleteListing(id, imageUrl)` — deletes the `listings` row (cascading `messages` & `notifications`) and removes the image file from Supabase Storage via `extractStoragePathFromPublicUrl`.
- **Messaging & Notifications:**
  - `sendMessageToSeller(input)` — inserts into `messages`, inserts into `notifications`, triggers `/api/send-email`, and dispatches `NOTIFICATIONS_UPDATED_EVENT` (`marketplace:notifications-updated`) for instant UI updates in the current tab.
  - `fetchNotifications(sellerEmail)`, `markNotificationRead(id)`, `markAllNotificationsRead(sellerEmail)`.

---

## 4. Security & Image Pipeline (`src/lib/security.ts`)

- **Text Sanitization (`sanitizeTextInput`):** Strips ASCII control characters and Unicode bidi/zero-width spoofing characters while keeping standard punctuation and emojis.
- **URL Safety (`isSafeImageUrl`):** Permits only `https://`, `http://localhost`, and raster Data URLs (`png`, `jpeg`, `webp`, `gif`), blocking `javascript:` and `svg+xml` payloads.
- **Magic-Byte Image Validation (`validateImageFile`):** Inspects the first 12 file bytes against PNG, JPEG, GIF, and WEBP signatures (max size: 5 MB).
- **Canvas Re-Encoding (`reencodeSafeImageBlob`):** Re-encodes static raster images onto an HTML5 `<canvas>` as WebP (`maxWidth = 1200`, `quality = 0.85`) before upload to strip EXIF metadata and reduce file sizes.

---

## 5. Email Architecture (`src/app/api/send-email/route.ts`)

To support real email delivery on Vercel and locally without requiring external npm dependencies or a paid email domain:

- **Zero-Dependency SMTP Client:** Uses Node.js built-in `node:tls` (implicit TLS on port `465`) and `node:net` + `STARTTLS` (port `587`), encoding subjects via RFC 2047 UTF-8 Base64 and bodies as Base64 HTML.
- **Header & HTML Safety:** Strips `\r\n` from email headers (`sanitizeHeader`), escapes HTML entities in user content (`escapeHtml`), and validates `listingUrl` protocol (`https?://`).
- **Rate Limiting (`checkRateLimit`):**
  - `WEEKLY_EMAIL_CAP = 20`: Caps total emails sent over any rolling 7-day window.
  - `COOLDOWN_SECONDS = 60`: Prevents repeated emails for the same `(listing_id, buyer_email)` within 60 seconds.
- **Optional Supabase Edge Function:** `supabase/functions/send-message-email/index.ts` provides an equivalent Resend implementation; `tsconfig.json` excludes `supabase/functions` from Next.js typechecking.

---

## 6. Build & Verification Notes

- Windows symlink/realpath compatibility is handled via `fix-realpath.cjs` in the `package.json` scripts (`dev`, `build`, `start`, `lint`).
- Run a full production build check anytime with:
  ```bash
  npm run build
  ```
- Note: Legacy Wall components remain under `src/components/wall/*` and `src/lib/posts-store.ts` for reference and are excluded from the active Marketplace routes.
