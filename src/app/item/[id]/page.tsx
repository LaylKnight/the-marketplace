"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Send,
  Tag,
  User,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/header";
import { getCategoryByName } from "@/lib/categories";
import {
  fetchListingById,
  formatPrice,
  formatRelativeTime,
  sendMessageToSeller,
  type Listing,
} from "@/lib/marketplace-store";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = typeof params?.id === "string" ? params.id : "";

  const [listing, setListing] = React.useState<Listing | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [message, setMessage] = React.useState("I want to buy this item!");
  const [isSending, setIsSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = React.useState(false);

  const [isBuying, setIsBuying] = React.useState(false);
  const [buyError, setBuyError] = React.useState<string | null>(null);

  const mainImgRef = React.useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(
      Boolean(
        mainImgRef.current?.complete && mainImgRef.current?.naturalWidth > 0
      )
    );
  }, [listing?.image_url]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!listingId) return;
      setIsLoading(true);
      setLoadError(null);
      const result = await fetchListingById(listingId);
      if (!cancelled) {
        setListing(result.listing);
        setLoadError(result.error);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;

    setSendError(null);
    setSendSuccess(false);

    if (!buyerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setSendError("Please enter a valid email address.");
      return;
    }
    if (!message.trim()) {
      setSendError("Please enter a message for the seller.");
      return;
    }

    setIsSending(true);
    const result = await sendMessageToSeller({
      listing_id: listing.id,
      listing_title: listing.title,
      buyer_email: buyerEmail.trim(),
      seller_email: listing.seller_email,
      message: message.trim(),
    });
    setIsSending(false);

    if (!result.success) {
      setSendError(result.error ?? "Failed to send message.");
      return;
    }

    setSendSuccess(true);
    setMessage("");
  }

  async function handleBuyNow() {
    if (!listing) return;
    setBuyError(null);
    setIsBuying(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setBuyError(data.error ?? "Unable to start Stripe Checkout.");
        setIsBuying(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setBuyError("Network error starting checkout.");
      setIsBuying(false);
    }
  }

  const categoryObj = getCategoryByName(listing?.category);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#1C1E21] border border-[#CED0D4] hover:bg-[#F0F2F5] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading listing details"
            className="overflow-hidden rounded-2xl bg-white border border-[#CED0D4] shadow-sm flex flex-col lg:flex-row"
          >
            <div className="flex-1 min-h-[360px] lg:min-h-[620px] p-6 sm:p-10 bg-[#F0F2F5] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#CED0D4]">
              <div className="h-[320px] sm:h-[440px] w-full max-w-[520px] rounded-xl fb-shimmer" />
            </div>
            <div className="w-full lg:w-[400px] xl:w-[420px] shrink-0 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="h-7 w-3/4 rounded-lg fb-shimmer" />
                  <div className="h-7 w-1/3 rounded-lg fb-shimmer" />
                </div>
                <div className="h-4 w-1/2 rounded fb-shimmer" />
                <div className="flex gap-2">
                  <div className="h-6 w-24 rounded-full fb-shimmer" />
                  <div className="h-6 w-28 rounded-full fb-shimmer" />
                </div>
                <div className="border-t border-[#CED0D4]/70 pt-4 space-y-2">
                  <div className="h-4 w-20 rounded fb-shimmer" />
                  <div className="h-3.5 w-full rounded fb-shimmer" />
                  <div className="h-3.5 w-5/6 rounded fb-shimmer" />
                  <div className="h-3.5 w-2/3 rounded fb-shimmer" />
                </div>
                <div className="border-t border-[#CED0D4]/70 pt-4">
                  <div className="h-4 w-32 rounded fb-shimmer mb-3" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full fb-shimmer shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-32 rounded fb-shimmer" />
                      <div className="h-3 w-24 rounded fb-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#CED0D4]/70 pt-5 space-y-3">
                <div className="h-4 w-40 rounded fb-shimmer" />
                <div className="h-10 w-full rounded-lg fb-shimmer" />
                <div className="h-24 w-full rounded-lg fb-shimmer" />
                <div className="h-10 w-full rounded-lg fb-shimmer" />
              </div>
            </div>
          </div>
        ) : loadError || !listing ? (
          <div className="rounded-2xl bg-white border border-[#CED0D4] p-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-[#65676B] mb-3" />
            <h1 className="text-xl font-bold text-[#1C1E21]">
              {loadError ? "Unable to load listing" : "Listing not found"}
            </h1>
            <p className="mt-1 text-sm text-[#65676B]">
              {loadError ??
                "This listing may have been removed or the link is invalid."}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166FE5]"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white border border-[#CED0D4] shadow-sm flex flex-col lg:flex-row">
            {/* Left: Full-width stage with blurred background + crisp centered photo */}
            <div className="relative flex-1 overflow-hidden bg-[#18191A] flex items-center justify-center p-6 sm:p-10 min-h-[360px] lg:min-h-[620px] border-b lg:border-b-0 lg:border-r border-[#CED0D4]">
              {listing.image_url && !imageError ? (
                <>
                  {!imageLoaded && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 z-20 fb-shimmer"
                    />
                  )}
                  <img
                    src={listing.image_url}
                    alt=""
                    aria-hidden="true"
                    className={`absolute inset-0 h-full w-full object-cover scale-110 blur-2xl select-none pointer-events-none transition-opacity duration-500 ${
                      imageLoaded ? "opacity-65" : "opacity-0"
                    }`}
                  />
                  <img
                    ref={mainImgRef}
                    src={listing.image_url}
                    alt={listing.title}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`relative z-10 max-h-[480px] max-w-[82%] w-auto object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </>
              ) : (
                <div className="marketplace-placeholder-pattern flex h-full w-full min-h-[360px] items-center justify-center">
                  <span className="text-sm font-medium text-[#1877F2]">
                    {imageError ? "Photo unavailable" : "No photo provided"}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Item Details & Message Seller */}
            <div className="w-full lg:w-[400px] xl:w-[420px] shrink-0 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-[#1C1E21] break-words">
                      {listing.title}
                    </h1>
                    {listing.status === "sold" && (
                      <span className="rounded-md bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                        Sold
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[#1C1E21]">
                    {formatPrice(listing.price)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#65676B]">
                  <span>
                    Listed {formatRelativeTime(listing.created_at)} in{" "}
                    <span className="font-medium text-[#1C1E21]">
                      {listing.location}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {categoryObj ? (
                    <Link
                      href={`/category/${categoryObj.slug}`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#E7F3FF] px-3 py-1 text-xs font-semibold text-[#1877F2] hover:bg-[#D8EBFF] transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{listing.category}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F3FF] px-3 py-1 text-xs font-semibold text-[#1877F2]">
                      <Tag className="h-3 w-3" />
                      <span>{listing.category}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F2F5] px-3 py-1 text-xs font-medium text-[#65676B]">
                    <MapPin className="h-3 w-3" />
                    <span>{listing.location}</span>
                  </span>
                </div>

                {listing.description && (
                  <div className="border-t border-[#CED0D4]/70 pt-4">
                    <h2 className="text-sm font-semibold text-[#1C1E21]">
                      Details
                    </h2>
                    <p className="mt-1.5 text-sm text-[#1C1E21]/90 whitespace-pre-wrap break-words leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                )}

                {/* Buy Now / Sold Status */}
                {listing.status === "sold" ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    This item has been sold and is no longer available for
                    purchase.
                  </div>
                ) : listing.seller_stripe_onboarded && listing.price > 0 ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isBuying}
                      onClick={() => void handleBuyNow()}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
                    >
                      {isBuying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Redirecting to Checkout...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <span>Buy Now · {formatPrice(listing.price)}</span>
                        </>
                      )}
                    </button>
                    {buyError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{buyError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#CED0D4] bg-[#F8F9FB] px-3.5 py-2.5 text-xs text-[#65676B]">
                    Online checkout unavailable — seller hasn&apos;t connected
                    Stripe yet. Message the seller below to coordinate.
                  </div>
                )}

                {/* Seller Information (Privacy-safe: shows Seller Name, never email) */}
                <div className="border-t border-[#CED0D4]/70 pt-4">
                  <h2 className="text-sm font-semibold text-[#1C1E21]">
                    Seller Information
                  </h2>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                      <User className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1E21]">
                        {listing.seller_name}
                      </p>
                      <p className="text-xs text-[#65676B]">
                        Marketplace Seller
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Seller Form */}
              <div className="border-t border-[#CED0D4]/70 pt-5">
                <h2 className="text-sm font-semibold text-[#1C1E21] mb-3">
                  Send seller a message
                </h2>

                {sendSuccess ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Message sent!</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-700">
                      Your message to {listing.seller_name} has been saved.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSendSuccess(false)}
                      className="mt-3 text-xs font-semibold text-[#1877F2] hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <div>
                      <label
                        htmlFor="buyer-email"
                        className="block text-xs font-semibold text-[#65676B] mb-1"
                      >
                        Your Email *
                      </label>
                      <input
                        id="buyer-email"
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="buyer@example.com"
                        className="h-10 w-full rounded-lg border border-[#CED0D4] bg-[#F8F9FB] px-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="buyer-message"
                        className="block text-xs font-semibold text-[#65676B] mb-1"
                      >
                        Message *
                      </label>
                      <textarea
                        id="buyer-message"
                        rows={3}
                        required
                        maxLength={1000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="I want to buy your bike!"
                        className="w-full rounded-lg border border-[#CED0D4] bg-[#F8F9FB] p-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                      />
                    </div>

                    {sendError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{sendError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSending}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
