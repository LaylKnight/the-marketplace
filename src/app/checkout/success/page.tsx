"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/header";

interface VerifiedOrder {
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  sellerName: string;
  buyerEmail: string | null;
  amountCents: number;
  platformFeeCents: number;
  currency: string;
  sessionId: string;
}

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";
  const listingId = searchParams.get("listing_id") ?? "";

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paid, setPaid] = React.useState(false);
  const [order, setOrder] = React.useState<VerifiedOrder | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!sessionId || !listingId) {
        setError("Missing Stripe checkout session details.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/stripe/session?session_id=${encodeURIComponent(sessionId)}&listing_id=${encodeURIComponent(listingId)}`
        );
        const data = (await res.json()) as {
          paid?: boolean;
          order?: VerifiedOrder;
          error?: string;
        };

        if (cancelled) return;
        if (!res.ok || data.error) {
          setError(data.error ?? "Unable to confirm payment.");
        } else {
          setPaid(Boolean(data.paid));
          setOrder(data.order ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("Network error verifying checkout session.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, listingId]);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <MarketplaceHeader />

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div className="rounded-2xl bg-white border border-[#CED0D4] shadow-sm p-10 text-center space-y-3">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1877F2]" />
            <h1 className="text-lg font-bold text-[#1C1E21]">
              Confirming your payment...
            </h1>
            <p className="text-sm text-[#65676B]">
              Verifying your order with Stripe and updating the listing.
            </p>
          </div>
        ) : error || !order ? (
          <div className="rounded-2xl bg-white border border-[#CED0D4] shadow-sm p-8 text-center space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="text-xl font-bold text-[#1C1E21]">
              Could not verify order
            </h1>
            <p className="text-sm text-[#65676B]">
              {error ?? "Please check your Marketplace listings."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166FE5]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Marketplace</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-[#CED0D4] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h1 className="text-2xl font-bold text-[#1C1E21]">
                {paid ? "Purchase Confirmed!" : "Order Recorded"}
              </h1>
              <p className="text-sm text-[#65676B]">
                Thank you for your purchase. The listing has been marked as{" "}
                <strong>Sold</strong>.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-[#F8F9FB] p-4 border border-[#CED0D4]/80">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#E4E6EB] border border-[#CED0D4]/60">
                {order.listingImageUrl ? (
                  <img
                    src={order.listingImageUrl}
                    alt={order.listingTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#65676B]">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-[#1C1E21] truncate">
                  {order.listingTitle}
                </p>
                <p className="text-xs text-[#65676B]">
                  Seller: {order.sellerName}
                </p>
                <p className="mt-1 text-lg font-bold text-[#1877F2]">
                  {formatCents(order.amountCents, order.currency)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#65676B] border-t border-[#CED0D4]/70 pt-4">
              <div className="flex justify-between">
                <span>Total Paid</span>
                <span className="font-semibold text-[#1C1E21]">
                  {formatCents(order.amountCents, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Marketplace Fee (10%)</span>
                <span>
                  {formatCents(order.platformFeeCents, order.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Seller Payout</span>
                <span>
                  {formatCents(
                    order.amountCents - order.platformFeeCents,
                    order.currency
                  )}
                </span>
              </div>
              {order.buyerEmail && (
                <div className="flex justify-between">
                  <span>Receipt Email</span>
                  <span className="font-medium text-[#1C1E21]">
                    {order.buyerEmail}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href={`/item/${order.listingId}`}
                className="flex h-10 items-center justify-center rounded-lg border border-[#CED0D4] bg-white text-sm font-semibold text-[#1C1E21] hover:bg-[#F0F2F5] transition-colors"
              >
                View Listing
              </Link>
              <Link
                href="/"
                className="flex h-10 items-center justify-center rounded-lg bg-[#1877F2] text-sm font-semibold text-white hover:bg-[#166FE5] transition-colors"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center text-sm text-[#65676B]">
          Loading order confirmation...
        </div>
      }
    >
      <CheckoutSuccessInner />
    </React.Suspense>
  );
}
