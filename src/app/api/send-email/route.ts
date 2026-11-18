import net from "node:net";
import tls from "node:tls";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const WEEKLY_EMAIL_CAP = 20;
const COOLDOWN_SECONDS = 60;
const SMTP_TIMEOUT_MS = 15000;

interface SendEmailBody {
  listingId?: string;
  listingTitle?: string;
  buyerEmail?: string;
  sellerEmail?: string;
  message?: string;
  listingUrl?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeMimeSubject(subject: string): string {
  const clean = sanitizeHeader(subject);
  const encoded = Buffer.from(clean, "utf8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function wrapBase64(input: string): string {
  const b64 = Buffer.from(input, "utf8").toString("base64");
  return b64.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

async function checkRateLimit(
  listingId: string,
  buyerEmail: string
): Promise<{ allowed: boolean; reason?: string }> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const supabaseUrl = rawUrl
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return { allowed: true };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Global weekly cap: max 20 emails per 7 days across the demo
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: weeklyCount, error: weeklyError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  if (!weeklyError && typeof weeklyCount === "number" && weeklyCount > WEEKLY_EMAIL_CAP) {
    return {
      allowed: false,
      reason: `Weekly demo email cap (${WEEKLY_EMAIL_CAP}/week) reached.`,
    };
  }

  // 2. Per-buyer/listing cooldown: skip if same buyer messaged same listing within 60s
  if (listingId) {
    const cooldownAgo = new Date(
      Date.now() - COOLDOWN_SECONDS * 1000
    ).toISOString();
    const { count: recentCount, error: cooldownError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .eq("buyer_email", buyerEmail)
      .gte("created_at", cooldownAgo);

    if (!cooldownError && typeof recentCount === "number" && recentCount > 1) {
      return {
        allowed: false,
        reason: `Cooldown active (${COOLDOWN_SECONDS}s) for this listing.`,
      };
    }
  }

  return { allowed: true };
}

interface SmtpSocketReader {
  readResponse: () => Promise<{ code: number; lines: string[] }>;
  sendCommand: (
    command: string,
    expectedCodes: number[]
  ) => Promise<{ code: number; lines: string[] }>;
  sendRaw: (payload: string) => void;
  close: () => void;
}

function attachSocketReader(socket: net.Socket | tls.TLSSocket): SmtpSocketReader {
  let buffer = "";
  const waiters: Array<{
    resolve: (res: { code: number; lines: string[] }) => void;
    reject: (err: Error) => void;
  }> = [];
  let pendingLines: string[] = [];

  function flushBuffer() {
    while (true) {
      const idx = buffer.indexOf("\n");
      if (idx === -1) break;
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      if (!line) continue;

      pendingLines.push(line);
      const match = /^(\d{3})( |-)([\s\S]*)$/.exec(line);
      if (match && match[2] === " ") {
        const code = Number(match[1]);
        const lines = pendingLines;
        pendingLines = [];
        const waiter = waiters.shift();
        if (waiter) {
          waiter.resolve({ code, lines });
        }
      }
    }
  }

  const onData = (chunk: Buffer | string) => {
    buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    flushBuffer();
  };

  const onError = (err: Error) => {
    while (waiters.length > 0) {
      waiters.shift()?.reject(err);
    }
  };

  const onClose = () => {
    while (waiters.length > 0) {
      waiters.shift()?.reject(new Error("SMTP connection closed unexpectedly."));
    }
  };

  socket.setTimeout(SMTP_TIMEOUT_MS, () => {
    const err = new Error("SMTP connection timed out.");
    socket.destroy(err);
    onError(err);
  });

  socket.on("data", onData);
  socket.on("error", onError);
  socket.on("close", onClose);

  const readResponse = () =>
    new Promise<{ code: number; lines: string[] }>((resolve, reject) => {
      waiters.push({ resolve, reject });
    });

  const sendCommand = async (command: string, expectedCodes: number[]) => {
    const responsePromise = readResponse();
    socket.write(`${command}\r\n`);
    const res = await responsePromise;
    if (!expectedCodes.includes(res.code)) {
      throw new Error(
        `SMTP error (${res.code}): ${res.lines.join(" | ")}`
      );
    }
    return res;
  };

  return {
    readResponse,
    sendCommand,
    sendRaw: (payload: string) => {
      socket.write(payload);
    },
    close: () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
      socket.end();
    },
  };
}

async function sendSmtpEmail(params: {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { host, port, user, pass, to, replyTo, subject, html } = params;

  let socket: net.Socket | tls.TLSSocket;
  let reader: SmtpSocketReader;

  if (port === 465) {
    socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const s = tls.connect(
        { host, port, servername: host },
        () => resolve(s)
      );
      s.once("error", reject);
      s.setTimeout(SMTP_TIMEOUT_MS, () => {
        s.destroy(new Error("SMTP TLS connect timed out."));
      });
    });
    reader = attachSocketReader(socket);
    const greeting = await reader.readResponse();
    if (greeting.code !== 220) {
      reader.close();
      throw new Error(`Unexpected SMTP greeting (${greeting.code}).`);
    }
    await reader.sendCommand("EHLO localhost", [250]);
  } else {
    const rawSocket = await new Promise<net.Socket>((resolve, reject) => {
      const s = net.connect({ host, port }, () => resolve(s));
      s.once("error", reject);
      s.setTimeout(SMTP_TIMEOUT_MS, () => {
        s.destroy(new Error("SMTP connect timed out."));
      });
    });
    const rawReader = attachSocketReader(rawSocket);
    const greeting = await rawReader.readResponse();
    if (greeting.code !== 220) {
      rawReader.close();
      throw new Error(`Unexpected SMTP greeting (${greeting.code}).`);
    }
    await rawReader.sendCommand("EHLO localhost", [250]);
    await rawReader.sendCommand("STARTTLS", [220]);

    rawSocket.removeAllListeners("data");
    rawSocket.removeAllListeners("error");
    rawSocket.removeAllListeners("close");

    socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const s = tls.connect(
        { socket: rawSocket, servername: host },
        () => resolve(s)
      );
      s.once("error", reject);
    });
    reader = attachSocketReader(socket);
    await reader.sendCommand("EHLO localhost", [250]);
  }

  try {
    await reader.sendCommand("AUTH LOGIN", [334]);
    await reader.sendCommand(Buffer.from(user, "utf8").toString("base64"), [334]);
    await reader.sendCommand(Buffer.from(pass, "utf8").toString("base64"), [235]);

    const cleanUser = sanitizeHeader(user);
    const cleanTo = sanitizeHeader(to);
    const cleanReplyTo = sanitizeHeader(replyTo);

    await reader.sendCommand(`MAIL FROM:<${cleanUser}>`, [250]);
    await reader.sendCommand(`RCPT TO:<${cleanTo}>`, [250, 251]);
    await reader.sendCommand("DATA", [354]);

    const dateHeader = new Date().toUTCString();
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${sanitizeHeader(host)}>`;
    const mimeMessage = [
      `From: "Marketplace" <${cleanUser}>`,
      `To: <${cleanTo}>`,
      `Reply-To: <${cleanReplyTo}>`,
      `Subject: ${encodeMimeSubject(subject)}`,
      `Date: ${dateHeader}`,
      `Message-ID: ${messageId}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      wrapBase64(html),
      ".",
      "",
    ].join("\r\n");

    const dataDonePromise = reader.readResponse();
    reader.sendRaw(mimeMessage);
    const dataRes = await dataDonePromise;
    if (dataRes.code !== 250) {
      throw new Error(
        `SMTP DATA error (${dataRes.code}): ${dataRes.lines.join(" | ")}`
      );
    }

    await reader.sendCommand("QUIT", [221]).catch(() => undefined);
  } finally {
    reader.close();
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendEmailBody;
    const listingId = (body.listingId ?? "").trim();
    const listingTitle = (body.listingTitle ?? "your listing").trim();
    const buyerEmail = (body.buyerEmail ?? "").trim();
    const sellerEmail = (body.sellerEmail ?? "").trim();
    const message = (body.message ?? "").trim();
    const listingUrl = (body.listingUrl ?? "").trim();

    if (!sellerEmail || !buyerEmail || !message) {
      return NextResponse.json(
        { sent: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sellerEmail) || !emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { sent: false, error: "Invalid email address." },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const parsedPort = Number(process.env.SMTP_PORT?.trim() || "465");
    const smtpPort = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 465;
    const smtpUser = process.env.SMTP_USER?.trim() || "";
    const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({
        sent: false,
        reason: "SMTP credentials not configured.",
      });
    }

    const rateCheck = await checkRateLimit(listingId, buyerEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        sent: false,
        rateLimited: true,
        reason: rateCheck.reason,
      });
    }

    const safeTitle = escapeHtml(listingTitle || "your listing");
    const safeBuyerEmail = escapeHtml(buyerEmail);
    const safeMessage = escapeHtml(message);
    const safeUrl = /^https?:\/\//i.test(listingUrl) ? escapeHtml(listingUrl) : "";

    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e6eb; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #1877F2; margin: 0 0 12px;">Marketplace</h2>
        <p style="color: #1c1e21; font-size: 15px; margin: 0 0 16px;">
          Someone sent you a message about <strong>${safeTitle}</strong>:
        </p>
        <div style="background: #f0f2f5; padding: 14px 16px; border-radius: 8px; color: #1c1e21; font-size: 14px; white-space: pre-wrap; margin-bottom: 16px;">${safeMessage}</div>
        <p style="color: #65676b; font-size: 13px; margin: 0 0 16px;">
          Buyer email: <strong>${safeBuyerEmail}</strong> (reply directly to this email to start a conversation).
        </p>
        ${
          safeUrl
            ? `<a href="${safeUrl}" style="display: inline-block; background: #1877F2; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Listing</a>`
            : ""
        }
      </div>
    `;

    await sendSmtpEmail({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      to: sellerEmail,
      replyTo: buyerEmail,
      subject: `New Marketplace message about "${listingTitle || "your listing"}"`,
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    return NextResponse.json({
      sent: false,
      error: err instanceof Error ? err.message : "Failed to send SMTP email.",
    });
  }
}
