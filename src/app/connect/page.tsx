"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/layout/header";
import {
  getSavedSellerEmail,
  setSavedSellerEmail,
} from "@/lib/marketplace-store";

interface ConnectStatus {
  connected: boolean;
  seller_email?: string;
  stripe_account_id?: string;
  onboarding_complete?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

function ConnectStripeInner() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const accountParam = searchParams.get("account") ?? "";
  const isReturn = searchParams.get("return") === "1";
  const isRefresh = searchParams.get("refresh") === "1";

  const [sellerEmail, setSellerEmail] = React.useState("");
  const [status, setStatus] = React.useState<ConnectStatus | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkStatus = React.useCallback(
    async (emailToCheck: string, accountToCheck?: string) => {
      const cleanEmail = emailToCheck.trim();
      if (!cleanEmail && !accountToCheck) return;

      setIsChecking(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (cleanEmail) params.set("email", cleanEmail);
        if (accountToCheck) params.set("account", accountToCheck);

        const res = await fetch(`/api/stripe/connect/status?${params.toString()}`);
        const data = (await res.json()) as ConnectStatus & { error?: string };
        if (!res.ok && data.error) {
          setError(data.error);
        } else {
          setStatus(data);
        }
      } catch {
        setError("Unable to check Stripe connection status.");
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const initialEmail = emailParam || getSavedSellerEmail();
    if (initialEmail) {
      setSellerEmail(initialEmail);
      setSavedSellerEmail(initialEmail);
      void checkStatus(initialEmail, accountParam || undefined);
    } else if (accountParam) {
      void checkStatus("", accountParam);
    }
  }, [emailParam, accountParam, checkStatus]);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = sellerEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid seller email address.");
      return;
    }

    setSavedSellerEmail(cleanEmail);
    setIsConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerEmail: cleanEmail }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Failed to start Stripe onboarding.");
        setIsConnecting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error while connecting to Stripe.");
      setIsConnecting(false);
    }
  }

  const isFullyOnboarded = Boolean(
    status?.connected && (status.charges_enabled || status.onboarding_complete)
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <MarketplaceHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#1C1E21] border border-[#CED0D4] hover:bg-[#E4E6EB] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-[#CED0D4] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
              <CreditCard className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#1C1E21]">
                Connect with Stripe
              </h1>
              <p className="mt-1 text-sm text-[#65676B]">
                Enter the email address you use on your Marketplace listings to
                receive test payouts. Once onboarded, all listings with that
                email automatically display a <strong>Buy Now</strong> button.
              </p>
            </div>
          </div>

          {isRefresh && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Your Stripe onboarding link expired. Enter your email below and
              click <strong>Connect with Stripe</strong> to continue.
            </div>
          )}

          {isReturn && isFullyOnboarded && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                Stripe onboarding complete! Your listings now show{" "}
                <strong>Buy Now</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label
                htmlFor="connect-seller-email"
                className="block text-xs font-semibold text-[#65676B] mb-1.5"
              >
                Seller Email *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="connect-seller-email"
                  type="email"
                  required
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className="h-11 flex-1 rounded-lg border border-[#CED0D4] bg-[#F8F9FB] px-3.5 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                />
                <button
                  type="button"
                  disabled={isChecking || !sellerEmail.trim()}
                  onClick={() => void checkStatus(sellerEmail)}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#CED0D4] bg-white px-4 text-xs font-semibold text-[#1C1E21] hover:bg-[#F0F2F5] disabled:opacity-50 transition-colors shrink-0"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`}
                  />
                  <span>Check Status</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {status?.connected && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  isFullyOnboarded
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-2">
                    {isFullyOnboarded ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Connected &amp; Ready for Payments</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span>Onboarding Incomplete</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs font-mono opacity-80">
                    {status.stripe_account_id}
                  </span>
                </div>
                <p className="mt-1.5 text-xs opacity-90">
                  {isFullyOnboarded
                    ? "Buyers can purchase your items via Stripe Checkout. Marketplace retains a 10% platform fee."
                    : "Please complete Stripe's onboarding form so your listings can accept Buy Now payments."}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#635BFF] text-sm font-semibold text-white shadow-sm hover:bg-[#5249F5] disabled:opacity-60 transition-colors"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting to Stripe...</span>
                </>
              ) : (
                <>
                  <span>
                    {isFullyOnboarded
                      ? "Update Stripe Onboarding"
                      : "Connect with Stripe"}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-[#CED0D4]/70 pt-4 flex items-start gap-2.5 text-xs text-[#65676B]">
            <ShieldCheck className="h-4 w-4 text-[#1877F2] shrink-0 mt-0.5" />
            <p>
              Runs in <strong>Stripe Sandbox (Test Mode)</strong>. No real money
              moves—use Stripe test details during onboarding and test card{" "}
              <code className="rounded bg-[#F0F2F5] px-1.5 py-0.5 font-mono text-[#1C1E21]">
                4242 4242 4242 4242
              </code>{" "}
              at checkout.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConnectStripePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center text-sm text-[#65676B]">
          Loading Stripe Connect...
        </div>
      }
    >
      <ConnectStripeInner />
    </React.Suspense>
  );
}
