# Setup Guide

This guide walks through setting up the Marketplace locally, configuring **Supabase** (database, storage, and realtime), enabling **Gmail SMTP** email delivery, and deploying to **Vercel**.

---

## 1. Prerequisites

- **Node.js** 18+ (recommended: Node 20 LTS or 22 LTS)
- **npm**
- A free **[Supabase](https://supabase.com)** project (optional for local testing; required for live persistence)
- A free **Gmail** account with **2-Step Verification** enabled (optional, for real seller emails via SMTP)
- A **[Vercel](https://vercel.com)** account for deployment

---

## 2. Local Installation

```bash
git clone <your-repo-url>
cd the-marketplace
npm install
```

Create your local environment file from `.env.example`:

```bash
cp .env.example .env.local
```

Start the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`. If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are left blank in `.env.local`, the app runs in **Local Mode** using browser `localStorage` with seeded sample listings.

---

## 3. Environment Variables

Edit `.env.local`:

```env
# Supabase (leave blank for LocalStorage Mode)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_LISTING_STORAGE_BUCKET=listing-images

# SMTP Email Delivery (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your16charapppassword
```

### Where to Find Your Supabase Keys
1. Open your project in the **Supabase Dashboard**.
2. Go to **Project Settings** (gear icon) → **API** (or **Data API** / **API Keys**).
3. Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the **`anon` `public`** (or Publishable) key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`. *(Never place a `service_role` key in `NEXT_PUBLIC_*` variables.)*

---

## 4. Supabase Database, Storage & Realtime Setup

1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.

This script configures everything automatically:
- **`listings` table:** Stores item listings (`id`, `title`, `description`, `price`, `category`, `seller_name`, `seller_email`, `image_url`, `location`, `created_at`, `updated_at`) plus an `update_updated_at_column()` trigger.
- **`messages` table:** Stores buyer-to-seller messages (`id`, `listing_id`, `buyer_email`, `seller_email`, `message`, `created_at`) with `ON DELETE CASCADE`.
- **`notifications` table:** Stores seller notification notices (`id`, `listing_id`, `message_id`, `seller_email`, `listing_title`, `notice`, `is_read`, `created_at`) with `ON DELETE CASCADE`.
- **`listing-images` Storage Bucket:** Creates a public bucket with `SELECT`, `INSERT`, and `DELETE` policies on `storage.objects`.
- **Row Level Security (RLS):** Enables public `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies for no-login demo access.
- **Realtime:** Adds `notifications` to `supabase_realtime` (`ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`) so new messages appear in the header bell without refreshing.

---

## 5. Email Setup (Gmail SMTP via `/api/send-email`)

The built-in [`src/app/api/send-email/route.ts`](./src/app/api/send-email/route.ts) route sends real emails using Node.js `node:tls` / `node:net` (no external npm packages or custom domain needed).

### Generating a Gmail App Password
1. Sign in to your Google Account and open [myaccount.google.com/security](https://myaccount.google.com/security).
2. Enable **2-Step Verification** if it isn't enabled yet.
3. Open [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an app name (e.g., `Marketplace Demo`) and click **Create**.
5. Copy the 16-character password into `SMTP_PASS` in `.env.local` (spaces are stripped automatically).

### Built-In Demo Abuse Protection
To protect your demo inbox and quota, `/api/send-email` enforces two checks against the `messages` table:
- **Weekly Demo Cap:** Maximum **20 emails per 7 days** across all listings (`WEEKLY_EMAIL_CAP = 20`).
- **Per-Listing Cooldown:** Maximum 1 email every **60 seconds** per `(listing_id, buyer_email)` pair (`COOLDOWN_SECONDS = 60`).
- When rate-limited (or if `SMTP_*` env vars are omitted), buyer messages and in-app notifications are **still saved** in Supabase.

---

## 6. Optional: Supabase Edge Function (Resend)

If you prefer sending emails through a **Supabase Edge Function** with [Resend](https://resend.com) and a custom verified domain instead of Gmail SMTP, an optional function is included at [`supabase/functions/send-message-email/index.ts`](./supabase/functions/send-message-email/index.ts):

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set RESEND_API_KEY=re_your_api_key
npx supabase secrets set RESEND_FROM_EMAIL="Marketplace <noreply@mail.yourdomain.com>"
npx supabase functions deploy send-message-email
```

*(Note: By default, `src/lib/marketplace-store.ts` invokes `/api/send-email` so Vercel deployments work without running Supabase CLI.)*

---

## 7. Deploying to Vercel

1. Push your repository to GitHub (make sure [`fix-realpath.cjs`](./fix-realpath.cjs) and [`tsconfig.json`](./tsconfig.json) are committed).
2. Import the repository in **[Vercel](https://vercel.com)**.
3. Under **Project Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_LISTING_STORAGE_BUCKET` = `listing-images`
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = your Gmail address
   - `SMTP_PASS` = your 16-character Google App Password
4. Click **Deploy**.
5. Verify the live site by creating a listing with a photo, filtering categories, opening `/item/[id]`, and sending a message to the seller.
