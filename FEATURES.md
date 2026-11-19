# Features Documentation

A complete reference of every user-facing feature and workflow in the Marketplace application.

---

## 1. Header Navigation (`src/components/layout/header.tsx`)

- **Marketplace Branding:** Facebook-style circular `f` icon + **Marketplace** title linking back to `/`.
- **Storage Mode Indicator:** Automatically displays **Supabase** when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured, or **Local Mode** when running on `localStorage`.
- **Realtime Notification Bell:**
  - Displays a red unread badge counter (`1`–`9+`).
  - Opens a Facebook-style dropdown listing incoming buyer message notices:
    > *"Someone sent you a message, check your email to start a conversation."*
  - Includes an optional **Filter by seller email** input for demo testing and a **Mark all read** action.
  - Updates immediately without page refresh via **Supabase Realtime** (`postgres_changes` on `notifications`) and same-tab `marketplace:notifications-updated` / `storage` events.
  - Clicking a notification marks it as read and navigates straight to `/item/[id]`.
- **Profile Button:** Displays Greg Wientjes' avatar (`/greg-profile.png`) to the right of the notification bell and links to `/profile`.

---

## 2. Sticky Marketplace Sidebar (`src/components/layout/sidebar.tsx`)

- **Sticky Top Action Group:** Remains pinned while scrolling the sidebar:
  - **Create new listing** primary blue CTA button (`#1877F2`) linking to `/create`.
  - **Search Marketplace** pill input with instant debounced filtering across title, description, category, and location (plus clear button).
- **Browse All:** Resets category, search, price range, date, and sort filters to show all listings.
- **Interactive Filters:**
  - **Sort by:** `Date listed: Newest first`, `Price: Lowest first`, `Price: Highest first`.
  - **Price:** `Min` and `Max` numeric range filters.
  - **Date listed:** `All time`, `Last 24 hours`, `Last 7 days`, `Last 30 days`.
- **19 Categories with Circular Icon Badges:**
  - `Vehicles`, `Property Rentals`, `Apparel`, `Classifieds`, `Electronics`, `Entertainment`, `Family`, `Free Stuff`, `Garden & Outdoor`, `Hobbies`, `Home Goods`, `Home Improvement`, `Home Sales`, `Musical Instruments`, `Office Supplies`, `Pet Supplies`, `Sporting Goods`, `Toys & Games`, and `Buy and sell groups`.
- **Mobile Responsive Drawer/Tabs:** Collapses into a compact mobile search + action card with horizontally scrollable category pills.

---

## 3. Listing Grid, List View & Lazy Loading (`src/components/marketplace/`)

- **Grid & List Toggle:** Switch between a 1–5 column responsive card grid and a horizontal list layout.
- **Facebook-Style Shimmer Skeletons (`.fb-shimmer`):**
  - Displays card-shaped shimmer placeholders in both Grid (10 cards) and List (6 rows) modes while fetching listings.
- **Lazy Image Loading (`LazyImage`):**
  - Uses `loading="lazy"` and `decoding="async"` on every listing thumbnail.
  - Shows a `.fb-shimmer` skeleton overlay until the image finishes downloading, then smoothly fades the photo in (`transition-opacity duration-300`).
  - Gracefully displays a styled `"Photo unavailable"` placeholder if an image fails to load.

---

## 4. Create, Batch-Create & Edit Listings (`/create`, `/create/item`)

### Choose Listing Type (`/create`)
- Left sidebar with close (`X`) button, **Choose listing type**, **Your listings**, and expandable **Seller help** tips.
- Four type cards matching the Marketplace creation flow:
  - **Item for sale** → `/create/item`
  - **Create multiple listings** → `/create/item?mode=multiple`
  - **Vehicle for sale** → `/create/item?category=vehicles`
  - **Home for sale or rent** → `/create/item?category=property-rentals`

### Listing Editor & Live Preview (`/create/item`)
- **Logged-in Seller Header:** Displays **Greg Wientjes** (`/greg-profile.png`) as the active seller.
- **Compact Drag-and-Drop Photo Uploader:**
  - Supports click-to-browse or drag-and-drop (`PNG`, `JPEG`, `WEBP`, `GIF`, up to 5 MB).
  - Validates magic bytes and re-encodes static images client-side to WebP (`maxWidth = 1200`) to strip EXIF metadata and keep uploads fast.
- **Form Fields & Validation:** Title, Price, Category dropdown, private **Email** (pre-filled from saved seller email when available), Location (defaults to `Palo Alto, CA`), and Description.
- **Full-Width Real-Time Preview:** Live preview with a blurred ambient photo backdrop behind the centered image, live title/price formatting (`$0` renders as `Free`), location, description, and public seller information.
- **Back-to-Back Multiple Listings Mode (`?mode=multiple`):**
  - Button changes to **Publish & Add Another**.
  - Publishes each item to Supabase, displays a session counter + link to the latest listing, clears the form/photo, and lets you immediately add the next item.
- **Edit Mode (`?edit=[id]`):**
  - Pre-fills existing title, price, category, seller email, location, description, and photo.
  - Submitting updates the row in Supabase `listings` and cleans up replaced images in Supabase Storage.

---

## 5. Listing Detail, Privacy, Delete & Messaging (`/item/[id]`)

- **Blurred-Backdrop Photo Stage:** Full-width container with a blurred copy of the listing image behind a centered, shadowed foreground photo, plus a full-page `.fb-shimmer` loading skeleton while loading.
- **Seller Privacy Protection:** Displays `seller_name` publicly while keeping `seller_email` hidden from the UI.
- **Edit & Delete Controls:**
  - **Edit** routes to `/create/item?edit=[id]`.
  - **Delete** reveals an inline confirmation bar; confirming deletes the listing row (cascading related `messages` and `notifications`) **and** removes the stored image file from the Supabase `listing-images` bucket.
- **Send Seller a Message:**
  - Collects **Your Email** (`buyer_email`) and **Message**.
  - Saves the message to Supabase `messages`, creates an in-app notice in `notifications`, triggers the real-time bell update, and sends an email to `seller_email` (with `Reply-To` set to `buyer_email`) via `/api/send-email`.

---

## 6. Seller Profile (`/profile`)

- Styled to match the Marketplace design (`#F0F2F5` canvas, rounded-xl white cards, `#CED0D4` borders, `#1877F2` icon accents).
- Left sidebar displays **Greg Wientjes**' portrait (`/greg-profile.png`), **Bio**, and **Information** (**Networks:** `Stanford Alum`, **Current City:** `Palo Alto, CA`).
- Right section lists all active Marketplace listings posted by Greg Wientjes with **Back to Marketplace** and **Create new listing** actions.
