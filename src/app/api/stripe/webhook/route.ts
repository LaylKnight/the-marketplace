import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  PLATFORM_FEE_RATE,
  getServerSupabase,
  getStripeClient,
  recordOrderAndMarkSold,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Missing webhook secret or Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      },
      { status: 400 }
    );
  }

  try {
    const supabase = getServerSupabase();

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      // Ignore accounts from other candidates in the shared sandbox
      const { data: existingSeller } = await supabase
        .from("seller_accounts")
        .select("id")
        .eq("stripe_account_id", account.id)
        .maybeSingle();

      if (existingSeller) {
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
          .eq("stripe_account_id", account.id);
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const listingId = session.metadata?.listing_id;

      // Ignore sessions from other candidates in the shared sandbox
      if (!listingId) {
        return NextResponse.json({ received: true });
      }

      const { data: listing } = await supabase
        .from("listings")
        .select("id, price, seller_email")
        .eq("id", listingId)
        .maybeSingle();

      if (!listing) {
        return NextResponse.json({ received: true });
      }

      const amountCents =
        session.amount_total ?? Math.round(Number(listing.price) * 100);
      const platformFeeCents =
        Number(session.metadata?.platform_fee_cents) ||
        Math.round(amountCents * PLATFORM_FEE_RATE);
      const buyerEmail =
        session.customer_details?.email ?? session.customer_email ?? null;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await recordOrderAndMarkSold(supabase, {
        listingId: String(listing.id),
        buyerEmail,
        sellerEmail: String(listing.seller_email),
        stripeAccountId: event.account ?? "",
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amountCents,
        platformFeeCents,
        currency: session.currency ?? "usd",
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
