import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PLATFORM_FEE_RATE = 0.1; // 10% platform fee

let cachedStripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured in environment variables."
    );
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey);
  }
  return cachedStripe;
}

export function getServerSupabase(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabaseUrl = rawUrl
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!supabaseUrl || !key) {
    throw new Error("Supabase URL or key is not configured.");
  }

  return createClient(supabaseUrl, key);
}

export function getAppOrigin(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  return new URL(req.url).origin.replace(/\/+$/, "");
}

export async function syncSellerAccountStatus(
  stripe: Stripe,
  supabase: SupabaseClient,
  stripeAccountId: string
): Promise<{
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}> {
  const account = await stripe.accounts.retrieve(stripeAccountId);
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const onboardingComplete = Boolean(
    account.details_submitted && chargesEnabled
  );

  await supabase
    .from("seller_accounts")
    .update({
      onboarding_complete: onboardingComplete,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId);

  return {
    stripe_account_id: stripeAccountId,
    onboarding_complete: onboardingComplete,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
  };
}

export async function recordOrderAndMarkSold(
  supabase: SupabaseClient,
  params: {
    listingId: string;
    buyerEmail: string | null;
    sellerEmail: string;
    stripeAccountId: string;
    stripeSessionId: string;
    stripePaymentIntentId: string | null;
    amountCents: number;
    platformFeeCents: number;
    currency?: string;
  }
): Promise<void> {
  await supabase.from("orders").upsert(
    {
      listing_id: params.listingId,
      buyer_email: params.buyerEmail,
      seller_email: params.sellerEmail,
      stripe_account_id: params.stripeAccountId,
      stripe_session_id: params.stripeSessionId,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      amount_cents: params.amountCents,
      platform_fee_cents: params.platformFeeCents,
      currency: params.currency ?? "usd",
      status: "paid",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true }
  );

  await supabase
    .from("listings")
    .update({
      status: "sold",
      sold_at: new Date().toISOString(),
    })
    .eq("id", params.listingId);
}
