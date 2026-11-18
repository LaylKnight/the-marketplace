"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Database,
  HardDrive,
  Mail,
} from "lucide-react";
import {
  fetchNotifications,
  formatRelativeTime,
  getSavedSellerEmail,
  getSupabaseClient,
  isSupabaseConfigured,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
  setSavedSellerEmail,
  type MarketplaceNotification,
} from "@/lib/marketplace-store";

export function MarketplaceHeader() {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<
    MarketplaceNotification[]
  >([]);
  const [sellerFilter, setSellerFilter] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const loadNotifications = React.useCallback(async (emailFilter?: string) => {
    const result = await fetchNotifications(emailFilter ?? "");
    if (!result.error) {
      setNotifications(result.notifications);
    }
  }, []);

  React.useEffect(() => {
    const saved = getSavedSellerEmail();
    setSellerFilter(saved);
    void loadNotifications(saved);
  }, [loadNotifications]);

  React.useEffect(() => {
    const handleUpdate = () => {
      void loadNotifications(sellerFilter);
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const supabase = getSupabaseClient();
    const channel = supabase
      ? supabase
          .channel("marketplace-notifications")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "notifications" },
            handleUpdate
          )
          .subscribe()
      : null;

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadNotifications, sellerFilter]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleFilterChange(value: string) {
    setSellerFilter(value);
    setSavedSellerEmail(value);
    void loadNotifications(value);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(sellerFilter);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleNotificationClick(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setNotifOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#CED0D4] shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Facebook-style F Logo + Marketplace */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none shrink-0"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-2xl leading-none shadow-sm transition-transform group-hover:scale-105">
            f
          </span>
          <span className="text-xl font-bold tracking-tight text-[#1C1E21]">
            Marketplace
          </span>
        </Link>

        {/* Right: Storage status + Notifications Bell + Profile Button */}
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

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next) {
                  void loadNotifications(sellerFilter);
                }
              }}
              aria-label="Notifications"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                notifOpen
                  ? "bg-[#E7F3FF] text-[#1877F2]"
                  : "bg-[#E4E6EB] text-[#1C1E21] hover:bg-[#D8DADF]"
              }`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E41E3F] px-1 text-[11px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#CED0D4] shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#CED0D4]/70">
                  <h2 className="text-base font-bold text-[#1C1E21]">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1877F2] hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="px-4 py-2.5 bg-[#F8F9FB] border-b border-[#CED0D4]/70">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={sellerFilter}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      placeholder="Filter by seller email (or leave blank for all)"
                      aria-label="Filter notifications by seller email"
                      className="h-8 w-full rounded-md border border-[#CED0D4] bg-white px-2.5 text-xs text-[#1C1E21] placeholder:text-[#65676B] focus:border-[#1877F2] focus:outline-none"
                    />
                    {sellerFilter && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange("")}
                        className="text-xs font-medium text-[#65676B] hover:text-[#1C1E21] shrink-0"
                      >
                        All
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#CED0D4]/50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-[#65676B]">
                      No notifications yet. When a buyer messages a seller, a
                      notice will appear here.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={`/item/${notif.listing_id}`}
                        onClick={() => void handleNotificationClick(notif.id)}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F0F2F5] ${
                          !notif.is_read ? "bg-[#E7F3FF]/45" : "bg-white"
                        }`}
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                          <Mail className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1C1E21] leading-snug">
                            {notif.notice}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-[#1877F2] truncate">
                            {notif.listing_title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#65676B]">
                            {formatRelativeTime(notif.created_at)}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <span
                            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#1877F2]"
                            aria-label="Unread"
                          />
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Button on the right of Notification Icon */}
          <Link
            href="/profile"
            title="Greg Wientjes — Profile & Wall"
            aria-label="Profile & Wall"
            className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-2 border-[#CED0D4] hover:border-[#1877F2] transition-colors shadow-sm"
          >
            <img
              src="/greg-profile.png"
              alt="Greg Wientjes"
              className="h-full w-full object-cover"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
