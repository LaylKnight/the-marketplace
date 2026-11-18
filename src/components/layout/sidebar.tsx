"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bike,
  Briefcase,
  Car,
  ChevronDown,
  Clapperboard,
  Gamepad2,
  Heart,
  Home,
  Music,
  Palette,
  PawPrint,
  Plus,
  Search,
  Shirt,
  Smartphone,
  Sprout,
  Store,
  Tag,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { MARKETPLACE_CATEGORIES } from "@/lib/categories";

export type SortOption = "newest" | "price-asc" | "price-desc";
export type DateListedOption = "all" | "24h" | "7d" | "30d";

interface SidebarProps {
  activeCategorySlug?: string | null;
  onSelectCategory?: (slug: string | null) => void;
  useLinks?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  dateListed: DateListedOption;
  onDateListedChange: (value: DateListedOption) => void;
  onBrowseAll?: () => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  vehicles: Car,
  "property-rentals": Home,
  apparel: Shirt,
  classifieds: Tag,
  electronics: Smartphone,
  entertainment: Clapperboard,
  family: Heart,
  "free-stuff": Tag,
  "garden-outdoor": Sprout,
  hobbies: Palette,
  "home-goods": Home,
  "home-improvement": Wrench,
  "home-sales": Home,
  "musical-instruments": Music,
  "office-supplies": Briefcase,
  "pet-supplies": PawPrint,
  "sporting-goods": Bike,
  "toys-games": Gamepad2,
  "buy-and-sell-groups": Users,
};

export function MarketplaceSidebar({
  activeCategorySlug = null,
  onSelectCategory,
  useLinks = false,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  dateListed,
  onDateListedChange,
  onBrowseAll,
}: SidebarProps) {
  const [sortOpen, setSortOpen] = React.useState(true);
  const [dateOpen, setDateOpen] = React.useState(false);
  const isAllActive = !activeCategorySlug;

  return (
    <>
      {/* Mobile Controls + Horizontal Category Tabs */}
      <div className="lg:hidden w-full space-y-3 mb-4">
        <div className="rounded-xl bg-white p-3.5 border border-[#CED0D4] shadow-sm space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65676B]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Marketplace"
              aria-label="Search Marketplace"
              className="h-10 w-full rounded-full bg-[#F0F2F5] pl-9 pr-9 text-sm text-[#1C1E21] placeholder:text-[#65676B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {useLinks ? (
              <Link
                href="/"
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isAllActive
                    ? "bg-[#E7F3FF] text-[#1877F2]"
                    : "bg-[#F0F2F5] text-[#1C1E21] hover:bg-[#E4E6EB]"
                }`}
              >
                <Store className="h-4 w-4" />
                <span>Browse All</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onBrowseAll?.();
                  onSelectCategory?.(null);
                }}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isAllActive
                    ? "bg-[#E7F3FF] text-[#1877F2]"
                    : "bg-[#F0F2F5] text-[#1C1E21] hover:bg-[#E4E6EB]"
                }`}
              >
                <Store className="h-4 w-4" />
                <span>Browse All</span>
              </button>
            )}

            <Link
              href="/create"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1877F2] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create new listing</span>
            </Link>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2 border-b border-[#CED0D4]">
          <div className="flex items-center gap-2 px-1">
            {MARKETPLACE_CATEGORIES.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              if (useLinks) {
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                        : "bg-white text-[#1C1E21] hover:bg-[#E4E6EB]"
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              }
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => onSelectCategory?.(cat.slug)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                      : "bg-white text-[#1C1E21] hover:bg-[#E4E6EB]"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Left Sidebar matching Facebook Marketplace reference */}
      <aside className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-[72px] max-h-[calc(100vh-88px)] flex flex-col overflow-hidden rounded-xl bg-white border border-[#CED0D4]/80 shadow-sm">
          {/* Sticky Top: Create new listing + Search input */}
          <div className="sticky top-0 z-10 bg-white p-4 pb-3 border-b border-[#CED0D4]/70 space-y-3 shrink-0">
            <Link
              href="/create"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Create new listing</span>
            </Link>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65676B]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search Marketplace"
                aria-label="Search Marketplace"
                className="h-10 w-full rounded-full bg-[#F0F2F5] pl-9 pr-9 text-sm text-[#1C1E21] placeholder:text-[#65676B] border border-transparent focus:border-[#1877F2] focus:bg-white focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B] hover:text-[#1C1E21]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Sidebar Body: Browse All + Filters + Categories */}
          <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-4">
            <div>
              {useLinks ? (
                <Link
                  href="/"
                  className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    isAllActive
                      ? "bg-[#E7F3FF] text-[#1877F2]"
                      : "bg-[#F0F2F5] text-[#1C1E21] hover:bg-[#E4E6EB]"
                  }`}
                >
                  <Store className="h-4 w-4 shrink-0" />
                  <span>Browse All</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onBrowseAll?.();
                    onSelectCategory?.(null);
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                    isAllActive
                      ? "bg-[#E7F3FF] text-[#1877F2]"
                      : "bg-[#F0F2F5] text-[#1C1E21] hover:bg-[#E4E6EB]"
                  }`}
                >
                  <Store className="h-4 w-4 shrink-0" />
                  <span>Browse All</span>
                </button>
              )}
            </div>

            <div className="border-t border-[#CED0D4]/70 pt-3 space-y-3">
            {/* Sort by */}
            <div>
              <button
                type="button"
                onClick={() => setSortOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-sm font-semibold text-[#1C1E21]"
              >
                <span>Sort by</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#65676B] transition-transform ${
                    sortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {sortOpen && (
                <select
                  aria-label="Sort listings"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="mt-2 h-9 w-full rounded-lg border border-[#CED0D4] bg-[#F0F2F5] px-2.5 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:bg-white focus:outline-none"
                >
                  <option value="newest">Date listed: Newest first</option>
                  <option value="price-asc">Price: Lowest first</option>
                  <option value="price-desc">Price: Highest first</option>
                </select>
              )}
            </div>

            {/* Price Min to Max */}
            <div>
              <p className="text-sm font-semibold text-[#1C1E21]">Price</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  aria-label="Minimum price"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  className="h-9 w-full rounded-lg bg-[#F0F2F5] px-3 text-sm text-[#1C1E21] placeholder:text-[#65676B] border border-transparent focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
                <span className="text-xs text-[#65676B] shrink-0">to</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  aria-label="Maximum price"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  className="h-9 w-full rounded-lg bg-[#F0F2F5] px-3 text-sm text-[#1C1E21] placeholder:text-[#65676B] border border-transparent focus:border-[#1877F2] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Date listed */}
            <div>
              <button
                type="button"
                onClick={() => setDateOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-sm font-semibold text-[#1C1E21]"
              >
                <span>Date listed</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#65676B] transition-transform ${
                    dateOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {dateOpen && (
                <select
                  aria-label="Filter by date listed"
                  value={dateListed}
                  onChange={(e) =>
                    onDateListedChange(e.target.value as DateListedOption)
                  }
                  className="mt-2 h-9 w-full rounded-lg border border-[#CED0D4] bg-[#F0F2F5] px-2.5 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:bg-white focus:outline-none"
                >
                  <option value="all">All time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              )}
            </div>
          </div>

          {/* Categories with circular icon badges */}
          <div className="border-t border-[#CED0D4]/70 pt-3">
            <h3 className="text-base font-bold text-[#1C1E21] mb-2">
              Categories
            </h3>
            <nav aria-label="Marketplace Categories" className="space-y-1">
              {MARKETPLACE_CATEGORIES.map((cat) => {
                const isActive = activeCategorySlug === cat.slug;
                const Icon = CATEGORY_ICON_MAP[cat.slug] ?? Tag;
                const rowClasses = `flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                    : "text-[#1C1E21] hover:bg-[#F0F2F5] font-medium"
                }`;
                const iconWrapClasses = `flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isActive
                    ? "bg-[#1877F2] text-white"
                    : "bg-[#E4E6EB] text-[#1C1E21]"
                }`;

                if (useLinks) {
                  return (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className={rowClasses}
                    >
                      <span className={iconWrapClasses}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => onSelectCategory?.(cat.slug)}
                    className={rowClasses}
                  >
                    <span className={iconWrapClasses}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          </div>
        </div>
      </aside>
    </>
  );
}
