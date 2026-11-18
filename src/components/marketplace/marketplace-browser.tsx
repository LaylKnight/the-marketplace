"use client";

import * as React from "react";
import { LayoutGrid, List, AlertCircle } from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/header";
import {
  MarketplaceSidebar,
  type DateListedOption,
  type SortOption,
} from "@/components/layout/sidebar";
import { ItemGrid } from "@/components/marketplace/item-grid";
import { getCategoryBySlug } from "@/lib/categories";
import { fetchListings, type Listing } from "@/lib/marketplace-store";

interface MarketplaceBrowserProps {
  initialCategorySlug?: string | null;
  useCategoryLinks?: boolean;
}

export function MarketplaceBrowser({
  initialCategorySlug = null,
  useCategoryLinks = false,
}: MarketplaceBrowserProps) {
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(
    initialCategorySlug
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [dateListed, setDateListed] = React.useState<DateListedOption>("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedSlug(initialCategorySlug);
  }, [initialCategorySlug]);

  const activeCategory = getCategoryBySlug(selectedSlug);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      const result = await fetchListings({
        category: activeCategory?.name ?? null,
        search: searchQuery,
      });

      if (!cancelled) {
        setListings(result.listings);
        setError(result.error);
        setIsLoading(false);
      }
    }

    const timer = setTimeout(load, searchQuery ? 180 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory?.name, searchQuery]);

  const filteredListings = React.useMemo(() => {
    const min = minPrice.trim() !== "" ? Number(minPrice) : null;
    const max = maxPrice.trim() !== "" ? Number(maxPrice) : null;
    const now = Date.now();
    const cutoffMs =
      dateListed === "24h"
        ? 24 * 60 * 60 * 1000
        : dateListed === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : dateListed === "30d"
            ? 30 * 24 * 60 * 60 * 1000
            : null;

    const filtered = listings.filter((item) => {
      if (min !== null && Number.isFinite(min) && item.price < min) {
        return false;
      }
      if (max !== null && Number.isFinite(max) && item.price > max) {
        return false;
      }
      if (cutoffMs !== null) {
        const age = now - new Date(item.created_at).getTime();
        if (age > cutoffMs) return false;
      }
      return true;
    });

    if (sortBy === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    return [...filtered].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [listings, minPrice, maxPrice, dateListed, sortBy]);

  function handleBrowseAll() {
    setSelectedSlug(null);
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setDateListed("all");
    setSortBy("newest");
  }

  const heading = activeCategory ? activeCategory.name : "Today's picks";

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <MarketplaceSidebar
            activeCategorySlug={selectedSlug}
            onSelectCategory={(slug) => setSelectedSlug(slug)}
            useLinks={useCategoryLinks}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            dateListed={dateListed}
            onDateListedChange={setDateListed}
            onBrowseAll={handleBrowseAll}
          />

          <section className="flex-1 min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1C1E21]">
                  {heading}
                </h1>
                <p className="text-xs sm:text-sm text-[#65676B]">
                  {isLoading
                    ? "Loading listings..."
                    : `${filteredListings.length} ${filteredListings.length === 1 ? "listing" : "listings"}${searchQuery ? ` matching "${searchQuery}"` : ""}`}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-[#CED0D4]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#E7F3FF] text-[#1877F2]"
                      : "text-[#65676B] hover:bg-[#F0F2F5]"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-[#E7F3FF] text-[#1877F2]"
                      : "text-[#65676B] hover:bg-[#F0F2F5]"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
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
              listings={filteredListings}
              isLoading={isLoading}
              viewMode={viewMode}
              emptyTitle={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : activeCategory
                    ? `No listings in ${activeCategory.name} yet`
                    : "No listings yet"
              }
              emptyDescription={
                searchQuery
                  ? "Try a different keyword or clear your search filter."
                  : "Be the first to post an item for sale!"
              }
            />
          </section>
        </div>
      </main>
    </div>
  );
}
