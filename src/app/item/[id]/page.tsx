"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Send,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/header";
import { getCategoryByName } from "@/lib/categories";
import {
  deleteListing,
  fetchListingById,
  formatPrice,
  formatRelativeTime,
  sendMessageToSeller,
  type Listing,
} from "@/lib/marketplace-store";

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const listingId = typeof params?.id === "string" ? params.id : "";

  const [listing, setListing] = React.useState<Listing | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [message, setMessage] = React.useState("I want to buy this item!");
  const [isSending, setIsSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = React.useState(false);

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

  async function handleDeleteListing() {
    if (!listing) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteListing(listing.id, listing.image_url);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error ?? "Failed to delete listing.");
      return;
    }

    router.push("/");
  }

  const categoryObj = getCategoryByName(listing?.category);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#1C1E21] border border-[#CED0D4] hover:bg-[#F0F2F5] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>

          {listing && !isLoading && (
            <div className="flex items-center gap-2">
              <Link
                href={`/create/item?edit=${listing.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-[#1C1E21] border border-[#CED0D4] hover:bg-[#E4E6EB] transition-colors"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDelete((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {confirmDelete && listing && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div>
              <p className="font-semibold">Delete &ldquo;{listing.title}&rdquo;?</p>
              <p className="text-xs text-red-700">
                This will permanently remove the listing and its uploaded image.
              </p>
              {deleteError && (
                <p className="mt-1 text-xs font-semibold text-red-700">
                  {deleteError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1C1E21] border border-[#CED0D4] hover:bg-[#F0F2F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDeleteListing()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl bg-white border border-[#CED0D4] p-6 flex flex-col lg:flex-row gap-6 animate-pulse">
            <div className="flex-1 min-h-[400px] lg:min-h-[580px] rounded-xl bg-[#E4E6EB]" />
            <div className="w-full lg:w-[400px] shrink-0 space-y-4">
              <div className="h-7 w-2/3 rounded bg-[#E4E6EB]" />
              <div className="h-6 w-1/4 rounded bg-[#E4E6EB]" />
              <div className="h-4 w-1/2 rounded bg-[#E4E6EB]" />
              <div className="h-28 w-full rounded bg-[#E4E6EB]" />
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
              {listing.image_url ? (
                <>
                  <img
                    src={listing.image_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-65 select-none pointer-events-none"
                  />
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="relative z-10 max-h-[480px] max-w-[82%] w-auto object-contain rounded-lg shadow-2xl"
                  />
                </>
              ) : (
                <div className="marketplace-placeholder-pattern flex h-full w-full min-h-[360px] items-center justify-center">
                  <span className="text-sm font-medium text-[#1877F2]">
                    No photo provided
                  </span>
                </div>
              )}
            </div>

            {/* Right: Item Details & Message Seller */}
            <div className="w-full lg:w-[400px] xl:w-[420px] shrink-0 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1C1E21] break-words">
                    {listing.title}
                  </h1>
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
