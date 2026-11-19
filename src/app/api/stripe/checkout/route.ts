import { NextResponse } from "next/server";
import {
  PLATFORM_FEE_RATE,
  getAppOrigin,
  getServerSupabase,
  getStripeClient,
  syncSellerAccountStatus,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { listingId?: string };
    const listingId = (body.listingId ?? "").trim();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const stripe = getStripeClient();
    const origin = getAppOrigin(req);

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, description, price, seller_email, image_url, status")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (listing.status === "sold") {
      return NextResponse.json(
        { error: "This item has already been sold." },
        { status: 400 }
      );
    }

    const amountCents = Math.round(Number(listing.price) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      return NextResponse.json(
        { error: "Item price must be at least $0.50 for Stripe Checkout." },
        { status: 400 }
      );
    }

    const { data: sellerAccount } = await supabase
      .from("seller_accounts")
      .select(
        "stripe_account_id, onboarding_complete, charges_enabled"
      )
      .ilike("seller_email", listing.seller_email)
      .maybeSingle();

    if (!sellerAccount?.stripe_account_id) {
      return NextResponse.json(
        { error: "This seller has not connected a Stripe account yet." },
        { status: 400 }
      );
    }

    let isReady = Boolean(
      sellerAccount.charges_enabled || sellerAccount.onboarding_complete
    );
    if (!isReady) {
      const synced = await syncSellerAccountStatus(
        stripe,
        supabase,
        sellerAccount.stripe_account_id
      );
      isReady = synced.charges_enabled || synced.onboarding_complete;
    }

    if (!isReady) {
      return NextResponse.json(
        {
          error:
            "Seller has not completed Stripe onboarding yet. Checkout is unavailable.",
        },
        { status: 400 }
      );
    }

    const applicationFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
    const productImages =
      typeof listing.image_url === "string" &&
      /^https:\/\//i.test(listing.image_url)
        ? [listing.image_url]
        : [];

    // Direct charge on the seller's connected account with 10% platform fee
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: String(listing.title),
                description: listing.description
                  ? String(listing.description).slice(0, 300)
                  : undefined,
                images: productImages,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeCents,
        },
        metadata: {
          listing_id: String(listing.id),
          seller_email: String(listing.seller_email),
          platform_fee_cents: String(applicationFeeCents),
        },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&listing_id=${encodeURIComponent(String(listing.id))}`,
        cancel_url: `${origin}/item/${encodeURIComponent(String(listing.id))}?canceled=1`,
      },
      {
        stripeAccount: sellerAccount.stripe_account_id,
      }
    );

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create Stripe Checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to start Stripe Checkout.",
      },
      { status: 500 }
    );
  }
}
