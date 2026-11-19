import { NextResponse } from "next/server";
import {
  getAppOrigin,
  getServerSupabase,
  getStripeClient,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { sellerEmail?: string };
    const sellerEmail = (body.sellerEmail ?? "").trim().toLowerCase();

    if (!sellerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid seller email address." },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const supabase = getServerSupabase();
    const origin = getAppOrigin(req);

    // Reuse existing connected account for this email if present
    const { data: existing } = await supabase
      .from("seller_accounts")
      .select("stripe_account_id")
      .ilike("seller_email", sellerEmail)
      .maybeSingle();

    let stripeAccountId = existing?.stripe_account_id ?? "";

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        email: sellerEmail,
        controller: {
          fees: { payer: "account" },
          losses: { payments: "stripe" },
          stripe_dashboard: { type: "express" },
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          seller_email: sellerEmail,
        },
      });

      stripeAccountId = account.id;

      const { error: insertError } = await supabase
        .from("seller_accounts")
        .upsert(
          {
            seller_email: sellerEmail,
            stripe_account_id: stripeAccountId,
            onboarding_complete: false,
            charges_enabled: false,
            payouts_enabled: false,
          },
          { onConflict: "seller_email" }
        );

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to save connected account: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/connect?refresh=1&email=${encodeURIComponent(sellerEmail)}`,
      return_url: `${origin}/connect?return=1&email=${encodeURIComponent(sellerEmail)}&account=${encodeURIComponent(stripeAccountId)}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      stripeAccountId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to start Stripe onboarding.",
      },
      { status: 500 }
    );
  }
}
