// Supabase Edge Function: send-message-email
// Deploy with: npx supabase functions deploy send-message-email
// Set secrets:
//   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
//   npx supabase secrets set RESEND_FROM_EMAIL="Marketplace <noreply@mail.yourdomain.com>"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WEEKLY_EMAIL_CAP = 20;
const COOLDOWN_SECONDS = 60;

interface EmailPayload {
  listingId: string;
  listingTitle: string;
  buyerEmail: string;
  sellerEmail: string;
  message: string;
  listingUrl?: string;
}

async function checkRateLimit(
  listingId: string,
  buyerEmail: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return { allowed: true };
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Prefer: "count=exact",
  };

  // 1. Global weekly cap: max 20 emails per 7 days across the demo
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const weeklyRes = await fetch(
    `${supabaseUrl}/rest/v1/messages?select=id&created_at=gte.${encodeURIComponent(sevenDaysAgo)}`,
    { method: "HEAD", headers }
  );
  const weeklyRange = weeklyRes.headers.get("content-range") ?? "";
  const weeklyTotal = Number(weeklyRange.split("/")[1] ?? "0");
  if (Number.isFinite(weeklyTotal) && weeklyTotal > WEEKLY_EMAIL_CAP) {
    return {
      allowed: false,
      reason: `Weekly demo email cap (${WEEKLY_EMAIL_CAP}/week) reached.`,
    };
  }

  // 2. Per-buyer/listing cooldown: skip if same buyer messaged same listing within 60s
  const cooldownAgo = new Date(
    Date.now() - COOLDOWN_SECONDS * 1000
  ).toISOString();
  const cooldownRes = await fetch(
    `${supabaseUrl}/rest/v1/messages?select=id&listing_id=eq.${encodeURIComponent(listingId)}&buyer_email=eq.${encodeURIComponent(buyerEmail)}&created_at=gte.${encodeURIComponent(cooldownAgo)}`,
    { method: "HEAD", headers }
  );
  const cooldownRange = cooldownRes.headers.get("content-range") ?? "";
  const recentCount = Number(cooldownRange.split("/")[1] ?? "0");
  if (Number.isFinite(recentCount) && recentCount > 1) {
    return {
      allowed: false,
      reason: `Cooldown active (${COOLDOWN_SECONDS}s) for this listing.`,
    };
  }

  return { allowed: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ??
      "Marketplace <onboarding@resend.dev>";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          sent: false,
          reason: "RESEND_API_KEY secret is not configured in Supabase.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = (await req.json()) as EmailPayload;
    const {
      listingId,
      listingTitle,
      buyerEmail,
      sellerEmail,
      message,
      listingUrl,
    } = body;

    if (!sellerEmail || !buyerEmail || !message) {
      return new Response(
        JSON.stringify({ sent: false, error: "Missing required fields." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rateCheck = await checkRateLimit(listingId || "", buyerEmail);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ sent: false, rateLimited: true, reason: rateCheck.reason }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [sellerEmail],
        reply_to: buyerEmail,
        subject: `New Marketplace message about "${listingTitle || "your listing"}"`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e6eb; border-radius: 12px;">
            <h2 style="color: #1877F2; margin: 0 0 12px;">Marketplace</h2>
            <p style="color: #1c1e21; font-size: 15px; margin: 0 0 16px;">
              Someone sent you a message about <strong>${listingTitle || "your listing"}</strong>:
            </p>
            <div style="background: #f0f2f5; padding: 14px 16px; border-radius: 8px; color: #1c1e21; font-size: 14px; white-space: pre-wrap; margin-bottom: 16px;">${message}</div>
            <p style="color: #65676b; font-size: 13px; margin: 0 0 16px;">
              Buyer email: <strong>${buyerEmail}</strong> (reply directly to this email to start a conversation).
            </p>
            ${
              listingUrl
                ? `<a href="${listingUrl}" style="display: inline-block; background: #1877F2; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Listing</a>`
                : ""
            }
          </div>
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ sent: false, error: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        sent: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
