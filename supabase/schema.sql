-- Facebook Marketplace Clone - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  seller_name VARCHAR(255) NOT NULL DEFAULT 'Marketplace Seller',
  seller_email VARCHAR(255) NOT NULL,
  image_url TEXT,
  location VARCHAR(255) DEFAULT 'Palo Alto, CA',
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure status/sold_at columns exist if upgrading an existing database
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'available';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Create seller_accounts table (Stripe Connect accounts keyed by seller_email)
CREATE TABLE IF NOT EXISTS seller_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_email VARCHAR(255) UNIQUE NOT NULL,
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table (completed Stripe Checkout purchases)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255),
  seller_email VARCHAR(255) NOT NULL,
  stripe_account_id VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_email VARCHAR(255) NOT NULL,
  seller_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (for in-app seller notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  seller_email VARCHAR(255) NOT NULL,
  listing_title VARCHAR(255) NOT NULL,
  notice TEXT NOT NULL DEFAULT 'Someone sent you a message, check your email to start a conversation.',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for listing images storage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload listing images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can upload listing images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'listing-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view listing images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can view listing images" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-images');
  END IF;

  DROP POLICY IF EXISTS "Anyone can delete listing images" ON storage.objects;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_notifications_seller_email ON notifications(seller_email);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_accounts_email ON seller_accounts(seller_email);
CREATE INDEX IF NOT EXISTS idx_seller_accounts_stripe_id ON seller_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(stripe_session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for listings (anyone can read, anyone can insert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view listings' AND tablename = 'listings'
  ) THEN
    CREATE POLICY "Anyone can view listings" ON listings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create listings' AND tablename = 'listings'
  ) THEN
    CREATE POLICY "Anyone can create listings" ON listings FOR INSERT WITH CHECK (true);
  END IF;

  DROP POLICY IF EXISTS "Anyone can delete listings" ON listings;
  DROP POLICY IF EXISTS "Users can update their own listings" ON listings;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update listings' AND tablename = 'listings'
  ) THEN
    CREATE POLICY "Anyone can update listings" ON listings FOR UPDATE USING (true);
  END IF;
END $$;

-- Create policies for messages (anyone can read and insert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view messages' AND tablename = 'messages'
  ) THEN
    CREATE POLICY "Anyone can view messages" ON messages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create messages' AND tablename = 'messages'
  ) THEN
    CREATE POLICY "Anyone can create messages" ON messages FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Anyone can view notifications" ON notifications FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Anyone can create notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Anyone can update notifications" ON notifications FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view seller_accounts' AND tablename = 'seller_accounts'
  ) THEN
    CREATE POLICY "Anyone can view seller_accounts" ON seller_accounts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create seller_accounts' AND tablename = 'seller_accounts'
  ) THEN
    CREATE POLICY "Anyone can create seller_accounts" ON seller_accounts FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update seller_accounts' AND tablename = 'seller_accounts'
  ) THEN
    CREATE POLICY "Anyone can update seller_accounts" ON seller_accounts FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Anyone can view orders" ON orders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can create orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Supabase Realtime for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
