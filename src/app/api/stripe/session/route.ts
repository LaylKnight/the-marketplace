import { NextResponse } from "next/server";
import {
  PLATFORM_FEE_RATE,
  getServerSupabase,
  getStripeClient,
  recordOrderAndMarkSold,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = (searchParams.get("session_id") ?? "").trim();
    const listingId = (searchParams.get("listing_id") ?? "").trim();

    if (!sessionId || !listingId) {
      return NextResponse.json(
        { error: "session_id and listing_id are required." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { data: listing } = await supabase
      .from("listings")
      .select(
        "id, title, price, image_url, seller_name, seller_email, status"
      )
      .eq("id", listingId)
      .maybeSingle();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    const { data: sellerAccount } = await supabase
      .from("seller_accounts")
      .select("stripe_account_id")
      .ilike("seller_email", listing.seller_email)
      .maybeSingle();

    if (!sellerAccount?.stripe_account_id) {
      return NextResponse.json(
        { error: "Seller Stripe account not found." },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      {},
      { stripeAccount: sellerAccount.stripe_account_id }
    );

    const isPaid = session.payment_status === "paid";
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

    if (isPaid) {
      await recordOrderAndMarkSold(supabase, {
        listingId: String(listing.id),
        buyerEmail,
        sellerEmail: String(listing.seller_email),
        stripeAccountId: sellerAccount.stripe_account_id,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amountCents,
        platformFeeCents,
        currency: session.currency ?? "usd",
      });
    }

    return NextResponse.json({
      paid: isPaid,
      order: {
        listingId: listing.id,
        listingTitle: listing.title,
        listingImageUrl: listing.image_url,
        sellerName: listing.seller_name,
        buyerEmail,
        amountCents,
        platformFeeCents,
        currency: session.currency ?? "usd",
        sessionId: session.id,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to verify Stripe session.",
      },
      { status: 500 }
    );
  }
}
