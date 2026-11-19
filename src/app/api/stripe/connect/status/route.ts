import { NextResponse } from "next/server";
import {
  getServerSupabase,
  getStripeClient,
  syncSellerAccountStatus,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") ?? "").trim().toLowerCase();
    const accountParam = (searchParams.get("account") ?? "").trim();

    if (!email && !accountParam) {
      return NextResponse.json(
        { connected: false, error: "Email or account ID is required." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    let query = supabase
      .from("seller_accounts")
      .select(
        "seller_email, stripe_account_id, onboarding_complete, charges_enabled, payouts_enabled"
      );

    if (accountParam) {
      query = query.eq("stripe_account_id", accountParam);
    } else {
      query = query.ilike("seller_email", email);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    // Sync live status from Stripe if secret key is configured
    if (process.env.STRIPE_SECRET_KEY?.trim()) {
      const stripe = getStripeClient();
      const synced = await syncSellerAccountStatus(
        stripe,
        supabase,
        data.stripe_account_id
      );
      return NextResponse.json({
        connected: true,
        seller_email: data.seller_email,
        ...synced,
      });
    }

    return NextResponse.json({
      connected: true,
      seller_email: data.seller_email,
      stripe_account_id: data.stripe_account_id,
      onboarding_complete: Boolean(data.onboarding_complete),
      charges_enabled: Boolean(data.charges_enabled),
      payouts_enabled: Boolean(data.payouts_enabled),
    });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        error:
          err instanceof Error ? err.message : "Failed to check Stripe status.",
      },
      { status: 500 }
    );
  }
}
