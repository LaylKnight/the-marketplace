"use client";

import * as React from "react";
import Link from "next/link";
import { MARKETPLACE_CATEGORIES } from "@/lib/categories";
import { Store } from "lucide-react";

interface SidebarProps {
  activeCategorySlug?: string | null;
  onSelectCategory?: (slug: string | null) => void;
  useLinks?: boolean;
}

export function MarketplaceSidebar({
  activeCategorySlug = null,
  onSelectCategory,
  useLinks = false,
}: SidebarProps) {
  const isAllActive = !activeCategorySlug;

  return (
    <>
      {/* Mobile Horizontal Category Tabs */}
      <div className="lg:hidden w-full overflow-x-auto pb-2 mb-4 border-b border-[#CED0D4]">
        <div className="flex items-center gap-2 px-1">
          {useLinks ? (
            <Link
              href="/"
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isAllActive
                  ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                  : "bg-white text-[#1C1E21] hover:bg-[#E4E6EB]"
              }`}
            >
              All
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onSelectCategory?.(null)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isAllActive
                  ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                  : "bg-white text-[#1C1E21] hover:bg-[#E4E6EB]"
              }`}
            >
              All
            </button>
          )}

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

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 rounded-xl bg-white p-3 border border-[#CED0D4]/80 shadow-sm">
          <div className="mb-2 px-2.5 pt-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1C1E21]">Categories</h2>
          </div>

          <nav aria-label="Marketplace Categories" className="space-y-0.5">
            {useLinks ? (
              <Link
                href="/"
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  isAllActive
                    ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                    : "text-[#1C1E21] hover:bg-[#F0F2F5]"
                }`}
              >
                <Store className="h-4 w-4 shrink-0" />
                <span>Browse all</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelectCategory?.(null)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                  isAllActive
                    ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                    : "text-[#1C1E21] hover:bg-[#F0F2F5]"
                }`}
              >
                <Store className="h-4 w-4 shrink-0" />
                <span>Browse all</span>
              </button>
            )}

            <div className="my-1.5 border-t border-[#CED0D4]/60" />

            {MARKETPLACE_CATEGORIES.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              if (useLinks) {
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className={`block rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                        : "text-[#1C1E21] hover:bg-[#F0F2F5]"
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
                  className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[#E7F3FF] text-[#1877F2] font-semibold"
                      : "text-[#1C1E21] hover:bg-[#F0F2F5]"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
