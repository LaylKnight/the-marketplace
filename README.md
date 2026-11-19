# Marketplace — Facebook Marketplace Clone

A full-stack mini-marketplace inspired by **Facebook Marketplace**, built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, and zero-dependency **Node.js SMTP** email delivery.

Works out of the box with **Supabase** (PostgreSQL + Storage + Realtime) and automatically falls back to **LocalStorage Mode** for zero-config local testing.

---

## Documentation

- **[SETUP.md](./SETUP.md)** — Detailed local setup, Supabase SQL & Storage setup, Gmail SMTP configuration, and Vercel deployment.
- **[FEATURES.md](./FEATURES.md)** — Complete feature walkthrough (browsing, filtering, live preview creation, batch posting, edit/delete, realtime notifications, and lazy-loading skeletons).
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** — Phased architecture, design system, routing strategy, data layer, and security implementation.

---

## Core Features

1. **Create, Batch-Create & Edit Listings (`/create`, `/create/item`)**
   - Drag-and-drop photo upload with magic-byte validation and client-side WebP compression.
   - Real-time split-screen preview synced to your form inputs.
   - **Create multiple listings** mode (`/create/item?mode=multiple`) for back-to-back **Publish & Add Another** workflows.
   - Full edit support (`/create/item?edit=[id]`).
2. **Browse, Search & Filter (`/`, `/category/[slug]`, `/category/electronics`)**
   - Sticky left sidebar with **Create new listing** CTA, keyword search, **Browse All**, **Sort by**, **Price (Min/Max)**, **Date listed**, and **19 icon-badged categories**.
   - Responsive 1–5 column **Grid** and **List** views with Facebook-style shimmer skeletons (`LazyImage` & `.fb-shimmer`).
3. **Listing Detail, Delete & Message Seller (`/item/[id]`)**
   - Full-width photo stage with a blurred ambient image backdrop behind the centered item photo.
   - Privacy-safe seller display (`seller_name` is shown publicly; `seller_email` is kept private).
   - **Delete** with confirmation that removes both the database row and the uploaded image in Supabase Storage.
   - **Message Seller** form that saves buyer messages in Supabase `messages`, inserts a `notifications` record, broadcasts real-time updates to the header bell, and emails the seller via `/api/send-email`.
4. **Seller Profile (`/profile`)**
   - Connected seller profile page for **Greg Wientjes** showcasing bio, profile info, and active Marketplace listings.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui (`src/components/ui/*`), Lucide Icons, Geist font
- **Backend / Database:** Supabase (`@supabase/supabase-js`) — PostgreSQL, Storage (`listing-images`), Realtime
- **Email Delivery:** Node.js built-in `node:tls` / `node:net` SMTP route (`/api/send-email`) + optional Supabase Edge Function (`supabase/functions/send-message-email/index.ts`)
- **Deployment:** Vercel

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template (optional — leave Supabase blank for LocalStorage Mode)
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```text
├── src/
│   ├── app/
│   │   ├── api/send-email/route.ts       # SMTP email endpoint with weekly cap & cooldown
│   │   ├── category/[slug]/page.tsx      # Dynamic category browse page
│   │   ├── category/electronics/page.tsx # Static Electronics category example page
│   │   ├── create/page.tsx               # Listing type chooser
│   │   ├── create/item/page.tsx          # Create / batch-create / edit item form + live preview
│   │   ├── item/[id]/page.tsx            # Item detail, edit/delete, & Message Seller
│   │   ├── profile/page.tsx              # Seller Profile page
│   │   ├── globals.css                   # Theme variables & .fb-shimmer keyframes
│   │   ├── layout.tsx                    # Root layout (Geist font & #F0F2F5 canvas)
│   │   └── page.tsx                      # Marketplace homepage
│   ├── components/
│   │   ├── layout/header.tsx             # Top navbar with Realtime Notification Bell & Profile link
│   │   ├── layout/sidebar.tsx            # Sticky Marketplace sidebar (CTA, search, filters, categories)
│   │   └── marketplace/
│   │       ├── item-grid.tsx             # 1–5 column Grid & List views + shimmer skeletons
│   │       ├── lazy-image.tsx            # Lazy-loading image component with shimmer overlay
│   │       └── marketplace-browser.tsx   # Main browsing state container
│   └── lib/
│       ├── categories.ts                 # 19 canonical categories & slug helpers
│       ├── marketplace-store.ts          # Supabase + LocalStorage CRUD, notifications & email trigger
│       └── security.ts                   # Input sanitization, magic-byte validation, WebP re-encoding
├── supabase/
│   ├── schema.sql                        # Tables, Storage bucket, RLS policies & Realtime publication
│   └── functions/send-message-email/     # Optional Resend Supabase Edge Function
├── .env.example
├── SETUP.md
├── FEATURES.md
└── DEVELOPMENT_GUIDE.md
```
