"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Car,
  HelpCircle,
  Home,
  Layers,
  MessageCircle,
  Tag,
  User,
  X,
} from "lucide-react";

const LISTING_TYPES = [
  {
    title: "Item for sale",
    description: "Create a single listing for one or more items to sell.",
    href: "/create/item",
    icon: Tag,
  },
  {
    title: "Create multiple listings",
    description: "Quickly create listings for multiple items to sell.",
    href: "/create/item?mode=multiple",
    icon: Layers,
  },
  {
    title: "Vehicle for sale",
    description: "Sell a car, truck, motorcycle, or other vehicle.",
    href: "/create/item?category=vehicles",
    icon: Car,
  },
  {
    title: "Home for sale or rent",
    description: "List a house, apartment, or room for sale or rent.",
    href: "/create/item?category=property-rentals",
    icon: Home,
  },
];

export default function CreateListingTypePage() {
  const [showSellerHelp, setShowSellerHelp] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col lg:flex-row">
      {/* Left Sidebar matching Mockup 2 */}
      <aside className="w-full lg:w-80 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#CED0D4] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-[#CED0D4]/70">
            <Link
              href="/"
              aria-label="Back to Marketplace"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21] hover:bg-[#D8DADF] transition-colors"
            >
              <X className="h-5 w-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-xl leading-none">
                f
              </span>
            </Link>
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-bold text-[#1C1E21] px-2">
              Create new listing
            </h1>

            <nav className="mt-3 space-y-1">
              <div className="flex items-center gap-3 rounded-lg bg-[#E7F3FF] px-3 py-2.5 text-sm font-semibold text-[#1877F2]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white">
                  <Tag className="h-4 w-4" />
                </span>
                <span>Choose listing type</span>
              </div>

              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#1C1E21] hover:bg-[#F0F2F5] transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21]">
                  <Tag className="h-4 w-4" />
                </span>
                <span>Your listings</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowSellerHelp((prev) => !prev)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#1C1E21] hover:bg-[#F0F2F5] transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21]">
                  <HelpCircle className="h-4 w-4" />
                </span>
                <span>Seller help</span>
              </button>
            </nav>

            {showSellerHelp && (
              <div className="mt-3 rounded-xl bg-[#F0F2F5] p-3.5 text-xs text-[#65676B] space-y-1.5 border border-[#CED0D4]">
                <p className="font-semibold text-[#1C1E21]">
                  Tips for a great listing
                </p>
                <p>• Upload a clear photo of your item in good lighting.</p>
                <p>• Use a descriptive title and fair local price.</p>
                <p>
                  • Your email stays private—buyers only see your display name.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top-right utility icons matching Mockup 2 */}
        <div className="hidden lg:flex items-center justify-end gap-2 px-6 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21]">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21]">
            <Bell className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21]">
            <User className="h-4 w-4" />
          </span>
        </div>

        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-[#1C1E21] mb-6">
              Choose listing type
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {LISTING_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Link
                    key={type.title}
                    href={type.href}
                    className="group flex flex-col items-center text-center rounded-xl bg-white p-6 border border-[#CED0D4]/80 shadow-sm hover:border-[#1877F2] hover:shadow-md transition-all"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1C1E21]">
                      {type.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#65676B] leading-relaxed">
                      {type.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
