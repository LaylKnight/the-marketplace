"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  GraduationCap,
  MapPin,
  Plus,
  Store,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/header";
import { ItemGrid } from "@/components/marketplace/item-grid";
import { fetchListings, type Listing } from "@/lib/marketplace-store";

const SELLER_NAME = "Greg Wientjes";
const SELLER_EMAIL = "greg.wientjes@example.com";

export default function SellerProfilePage() {
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      const result = await fetchListings();
      if (!cancelled) {
        const sellerListings = result.listings.filter(
          (item) =>
            item.seller_email.toLowerCase() === SELLER_EMAIL.toLowerCase() ||
            item.seller_name.toLowerCase() === SELLER_NAME.toLowerCase()
        );
        setListings(sellerListings);
        setError(result.error);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#1C1E21] border border-[#CED0D4] hover:bg-[#E4E6EB] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>

          <Link
            href="/create/item"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1877F2] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create new listing</span>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Marketplace-styled Seller Profile Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-[72px]">
            {/* Portrait Card */}
            <div className="overflow-hidden rounded-xl bg-white border border-[#CED0D4] shadow-sm">
              <div className="aspect-square w-full overflow-hidden bg-[#F0F2F5]">
                <img
                  src="/greg-profile.png"
                  alt={SELLER_NAME}
                  className="h-full w-full object-cover select-none"
                />
              </div>
              <div className="p-4 border-t border-[#CED0D4]/70">
                <h2 className="text-lg font-bold text-[#1C1E21]">
                  {SELLER_NAME}
                </h2>
                <p className="text-xs text-[#65676B]">Marketplace Seller</p>
              </div>
            </div>

            {/* Bio Card */}
            <div className="rounded-xl bg-white border border-[#CED0D4] shadow-sm p-4">
              <h3 className="text-base font-bold text-[#1C1E21]">Bio</h3>
              <p className="mt-2 text-sm text-[#65676B] leading-relaxed">
                Builder, coffee enthusiast, and lifelong learner based in Palo
                Alto. Always tinkering with web apps, late-night side projects,
                and questionable dance moves.
              </p>
            </div>

            {/* Information Card */}
            <div className="rounded-xl bg-white border border-[#CED0D4] shadow-sm p-4 space-y-3">
              <h3 className="text-base font-bold text-[#1C1E21]">
                Information
              </h3>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#65676B]">
                    Networks
                  </p>
                  <p className="text-sm font-medium text-[#1C1E21]">
                    Stanford Alum
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#65676B]">
                    Current City
                  </p>
                  <p className="text-sm font-medium text-[#1C1E21]">
                    Palo Alto, CA
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Card */}
            <div className="rounded-xl bg-white border border-[#CED0D4] shadow-sm p-4 space-y-3">
              <h3 className="text-base font-bold text-[#1C1E21]">Settings</h3>
              <p className="text-xs text-[#65676B]">
                Connect your Stripe account to accept Buy Now payments on your
                listings.
              </p>
              <Link
                href="/connect"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#635BFF] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#5249F5] transition-colors"
              >
                <CreditCard className="h-4 w-4 shrink-0" />
                <span>Connect with Stripe</span>
              </Link>
            </div>
          </aside>

          {/* Right: Seller's Marketplace Listings */}
          <section className="flex-1 min-w-0 w-full">
            <div className="mb-4 rounded-xl bg-white p-5 border border-[#CED0D4] shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1C1E21]">
                    {SELLER_NAME}&apos;s Listings
                  </h1>
                  <p className="text-xs sm:text-sm text-[#65676B]">
                    {isLoading
                      ? "Loading listings..."
                      : `${listings.length} active ${listings.length === 1 ? "listing" : "listings"}`}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to load listings</p>
                  <p className="text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <ItemGrid
              listings={listings}
              isLoading={isLoading}
              emptyTitle="No marketplace listings yet"
              emptyDescription="Items you list for sale as Greg Wientjes will appear here."
            />
          </section>
        </div>
      </main>
    </div>
  );
}
