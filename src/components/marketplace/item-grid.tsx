"use client";

import * as React from "react";
import Link from "next/link";
import { ImageOff, MapPin, Plus } from "lucide-react";
import { LazyImage } from "@/components/marketplace/lazy-image";
import {
  type Listing,
  formatPrice,
  formatRelativeTime,
} from "@/lib/marketplace-store";

interface ItemGridProps {
  listings: Listing[];
  isLoading: boolean;
  viewMode?: "grid" | "list";
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ItemGrid({
  listings,
  isLoading,
  viewMode = "grid",
  emptyTitle = "No listings found",
  emptyDescription = "Be the first to post an item in this category!",
}: ItemGridProps) {
  if (isLoading) {
    if (viewMode === "list") {
      return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading listings">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row gap-4 rounded-xl bg-white p-3 border border-[#CED0D4]/60 shadow-sm"
            >
              <div className="h-44 sm:h-32 sm:w-32 shrink-0 rounded-lg fb-shimmer" />
              <div className="flex flex-1 flex-col justify-between py-1 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="h-4 w-1/2 rounded fb-shimmer" />
                    <div className="h-4 w-16 rounded fb-shimmer" />
                  </div>
                  <div className="h-3.5 w-5/6 rounded fb-shimmer" />
                  <div className="h-3.5 w-2/3 rounded fb-shimmer" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-24 rounded fb-shimmer" />
                  <div className="h-3 w-20 rounded fb-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        aria-busy="true"
        aria-label="Loading listings"
      >
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white p-2 border border-[#CED0D4]/60 shadow-sm space-y-2.5"
          >
            <div className="aspect-square w-full rounded-lg fb-shimmer" />
            <div className="px-1 pb-1 space-y-2">
              <div className="h-4 w-1/3 rounded fb-shimmer" />
              <div className="h-3.5 w-3/4 rounded fb-shimmer" />
              <div className="h-3 w-1/2 rounded fb-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CED0D4] bg-white px-6 py-14 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
          <ImageOff className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-[#1C1E21]">{emptyTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-[#65676B]">
          {emptyDescription}
        </p>
        <Link
          href="/create/item"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166FE5] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Listing</span>
        </Link>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {listings.map((item) => (
          <Link
            key={item.id}
            href={`/item/${item.id}`}
            className="group flex flex-col sm:flex-row gap-4 rounded-xl bg-white p-3 border border-[#CED0D4]/80 shadow-sm hover:shadow-md hover:border-[#1877F2]/40 transition-all"
          >
            <div className="relative h-44 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-lg border border-[#CED0D4]/60 bg-[#F0F2F5]">
              {item.image_url ? (
                <LazyImage
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="marketplace-placeholder-pattern flex h-full w-full items-center justify-center text-xs font-medium text-[#1877F2]">
                  No photo
                </div>
              )}
              {item.status === "sold" && (
                <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                  Sold
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-[#1C1E21] group-hover:text-[#1877F2] transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <span className="shrink-0 text-base font-bold text-[#1C1E21]">
                    {formatPrice(item.price)}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-[#65676B] line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#65676B]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </span>
                <span>{item.category}</span>
                <span>Listed {formatRelativeTime(item.created_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {listings.map((item) => (
        <Link
          key={item.id}
          href={`/item/${item.id}`}
          className="group flex flex-col rounded-xl bg-white p-2 border border-transparent hover:border-[#CED0D4] hover:shadow-md transition-all"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#CED0D4]/60 bg-[#F0F2F5]">
            {item.image_url ? (
              <LazyImage
                src={item.image_url}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="marketplace-placeholder-pattern flex h-full w-full items-center justify-center text-xs font-medium text-[#1877F2]">
                No photo
              </div>
            )}
            {item.status === "sold" ? (
              <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                Sold
              </span>
            ) : item.seller_stripe_onboarded ? (
              <span className="absolute left-2 top-2 z-10 rounded-md bg-[#1877F2]/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                Buy Now
              </span>
            ) : null}
          </div>

          <div className="px-1 pt-2.5 pb-1">
            <p className="text-base font-bold text-[#1C1E21] leading-tight">
              {formatPrice(item.price)}
            </p>
            <h3 className="mt-1 text-sm font-medium text-[#1C1E21] group-hover:text-[#1877F2] transition-colors line-clamp-1">
              {item.title}
            </h3>
            <p className="mt-0.5 text-xs text-[#65676B] line-clamp-1">
              {item.location}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
