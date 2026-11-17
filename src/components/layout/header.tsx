"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Database, HardDrive, X } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/marketplace-store";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function MarketplaceHeader({
  searchQuery = "",
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#CED0D4] shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Facebook-style F Logo + Marketplace */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-2xl leading-none shadow-sm transition-transform group-hover:scale-105">
              f
            </span>
            <span className="text-xl font-bold tracking-tight text-[#1C1E21]">
              Marketplace
            </span>
          </Link>
        </div>

        {/* Center: Search bar */}
        {showSearch && onSearchChange ? (
          <div className="relative flex-1 max-w-md hidden sm:block">
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
        ) : (
          <div className="flex-1" />
        )}

        {/* Right: Storage status + Create Listing CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            title={
              isSupabaseConfigured
                ? "Connected to Supabase Database + Storage"
                : "Running in LocalStorage Mode (configure .env.local for Supabase)"
            }
            className="hidden md:flex items-center gap-1.5 rounded-full bg-[#F0F2F5] px-3 py-1.5 text-xs font-medium text-[#65676B]"
          >
            {isSupabaseConfigured ? (
              <>
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                <span>Supabase</span>
              </>
            ) : (
              <>
                <HardDrive className="h-3.5 w-3.5 text-amber-600" />
                <span>Local Mode</span>
              </>
            )}
          </div>

          <Link
            href="/create"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1877F2] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create new listing</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && onSearchChange && (
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65676B]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Marketplace"
              aria-label="Search Marketplace"
              className="h-9 w-full rounded-full bg-[#F0F2F5] pl-9 pr-4 text-sm text-[#1C1E21] placeholder:text-[#65676B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
            />
          </div>
        </div>
      )}
    </header>
  );
}
