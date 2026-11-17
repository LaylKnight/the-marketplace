import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSafeImageUrl,
  reencodeSafeImageBlob,
  sanitizeTextInput,
  validateImageFile,
} from "@/lib/security";

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  seller_name: string;
  seller_email: string;
  image_url: string | null;
  location: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  category: string;
  seller_name: string;
  seller_email: string;
  location?: string;
  imageFile?: File | null;
}

export interface CreateMessageInput {
  listing_id: string;
  buyer_email: string;
  seller_email: string;
  message: string;
}

export interface MarketplaceMessage {
  id: string;
  listing_id: string;
  buyer_email: string;
  seller_email: string;
  message: string;
  created_at: string;
}

const LISTINGS_STORAGE_KEY = "marketplace_listings_v1";
const MESSAGES_STORAGE_KEY = "marketplace_messages_v1";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseUrl = rawSupabaseUrl
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/+$/, "");
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
const listingStorageBucket =
  process.env.NEXT_PUBLIC_LISTING_STORAGE_BUCKET?.trim() || "listing-images";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return "$0";
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSeedListings(): Listing[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return [
    {
      id: "demo-bike-24",
      title: "Bike 24 inch",
      description:
        "Smooth-riding 24-inch commuter bike in great condition. Recently tuned brakes and tires.",
      price: 99,
      category: "Sporting Goods",
      seller_name: "Wei Gu",
      seller_email: "seller-wei@example.com",
      image_url: null,
      location: "Palo Alto, CA",
      created_at: new Date(now - 1 * hour).toISOString(),
    },
    {
      id: "demo-macbook-pro",
      title: 'MacBook Pro 14" M3',
      description:
        "Barely used laptop with original box and MagSafe charger. Battery cycle count under 20.",
      price: 1450,
      category: "Electronics",
      seller_name: "Greg Wientjes",
      seller_email: "seller-greg@example.com",
      image_url: null,
      location: "Palo Alto, CA",
      created_at: new Date(now - 2 * hour).toISOString(),
    },
    {
      id: "demo-sony-headphones",
      title: "Sony WH-1000XM5 Headphones",
      description:
        "Noise-canceling wireless headphones in midnight black. Includes carrying case.",
      price: 260,
      category: "Electronics",
      seller_name: "Anna Chen",
      seller_email: "seller-anna@example.com",
      image_url: null,
      location: "Mountain View, CA",
      created_at: new Date(now - 4 * hour).toISOString(),
    },
    {
      id: "demo-desk-lamp",
      title: "Minimalist LED Desk Lamp",
      description:
        "Adjustable aluminum architect lamp with warm/cool color temperature control.",
      price: 45,
      category: "Home Goods",
      seller_name: "Alex Rivera",
      seller_email: "seller-alex@example.com",
      image_url: null,
      location: "Menlo Park, CA",
      created_at: new Date(now - 6 * hour).toISOString(),
    },
    {
      id: "demo-mechanical-keyboard",
      title: "Custom Mechanical Keyboard",
      description:
        "65% hot-swappable aluminum keyboard with tactile switches and PBT keycaps.",
      price: 135,
      category: "Electronics",
      seller_name: "Maija Korhonen",
      seller_email: "seller-maija@example.com",
      image_url: null,
      location: "Palo Alto, CA",
      created_at: new Date(now - 9 * hour).toISOString(),
    },
  ];
}

function readLocalListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (!raw) {
      const seeds = getSeedListings();
      window.localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalListings(listings: Listing[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings));
}

async function fileToCompressedDataUrl(
  file: File,
  detectedMime: string
): Promise<string> {
  const { blob } = await reencodeSafeImageBlob(file, detectedMime);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image to Data URL."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(blob);
  });
}

function normalizeListingRow(row: Record<string, unknown>): Listing {
  const imageUrl =
    typeof row.image_url === "string" && isSafeImageUrl(row.image_url)
      ? row.image_url
      : null;

  return {
    id: String(row.id ?? ""),
    title: sanitizeTextInput(String(row.title ?? "Untitled Listing")),
    description:
      typeof row.description === "string"
        ? sanitizeTextInput(row.description)
        : null,
    price: Number(row.price ?? 0),
    category: sanitizeTextInput(String(row.category ?? "Classifieds")),
    seller_name: sanitizeTextInput(
      String(row.seller_name ?? "Marketplace Seller")
    ),
    seller_email: String(row.seller_email ?? ""),
    image_url: imageUrl,
    location: sanitizeTextInput(String(row.location ?? "Palo Alto, CA")),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at:
      typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export async function fetchListings(options?: {
  category?: string | null;
  search?: string | null;
}): Promise<{ listings: Listing[]; error: string | null }> {
  const category = options?.category?.trim() || "";
  const search = options?.search?.trim().toLowerCase() || "";

  const supabase = getSupabaseClient();
  if (supabase) {
    let query = supabase
      .from("listings")
      .select(
        "id, title, description, price, category, seller_name, seller_email, image_url, location, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (category) {
      query = query.ilike("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return {
        listings: [],
        error: `Supabase error: ${error.message}`,
      };
    }

    let listings = (data ?? []).map((row) =>
      normalizeListingRow(row as Record<string, unknown>)
    );

    if (search) {
      listings = listings.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          (item.description ?? "").toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.location.toLowerCase().includes(search)
      );
    }

    return { listings, error: null };
  }

  // LocalStorage fallback
  let local = readLocalListings();
  if (category) {
    local = local.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (search) {
    local = local.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        (item.description ?? "").toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.location.toLowerCase().includes(search)
    );
  }
  local.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { listings: local, error: null };
}

export async function fetchListingById(
  id: string
): Promise<{ listing: Listing | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, title, description, price, category, seller_name, seller_email, image_url, location, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { listing: null, error: `Supabase error: ${error.message}` };
    }
    if (!data) {
      return { listing: null, error: null };
    }
    return {
      listing: normalizeListingRow(data as Record<string, unknown>),
      error: null,
    };
  }

  const local = readLocalListings();
  const found = local.find((item) => item.id === id) ?? null;
  return { listing: found, error: null };
}

export async function createListing(
  input: CreateListingInput
): Promise<{ listing: Listing | null; error: string | null }> {
  const title = sanitizeTextInput(input.title).trim();
  const description = sanitizeTextInput(input.description).trim();
  const category = sanitizeTextInput(input.category).trim();
  const sellerName =
    sanitizeTextInput(input.seller_name).trim() || "Marketplace Seller";
  const sellerEmail = sanitizeTextInput(input.seller_email).trim();
  const location =
    sanitizeTextInput(input.location ?? "Palo Alto, CA").trim() ||
    "Palo Alto, CA";

  if (!title) return { listing: null, error: "Title is required." };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { listing: null, error: "Please enter a valid price." };
  }
  if (!category) return { listing: null, error: "Category is required." };
  if (!sellerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
    return { listing: null, error: "Please enter a valid email address." };
  }

  let imageUrl: string | null = null;
  const supabase = getSupabaseClient();

  if (input.imageFile) {
    const validation = await validateImageFile(input.imageFile);
    if (!validation.valid) {
      return { listing: null, error: validation.error };
    }

    if (supabase) {
      try {
        const { blob, ext, contentType } = await reencodeSafeImageBlob(
          input.imageFile,
          validation.mime
        );
        const filePath = `listings/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(listingStorageBucket)
          .upload(filePath, blob, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          return {
            listing: null,
            error: `Image upload failed: ${uploadError.message}`,
          };
        }

        const { data: publicUrlData } = supabase.storage
          .from(listingStorageBucket)
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      } catch (err) {
        return {
          listing: null,
          error:
            err instanceof Error ? err.message : "Failed to process image.",
        };
      }
    } else {
      imageUrl = await fileToCompressedDataUrl(
        input.imageFile,
        validation.mime
      );
    }
  }

  if (supabase) {
    const { data, error } = await supabase
      .from("listings")
      .insert({
        title,
        description: description || null,
        price: Number(input.price.toFixed(2)),
        category,
        seller_name: sellerName,
        seller_email: sellerEmail,
        image_url: imageUrl,
        location,
      })
      .select(
        "id, title, description, price, category, seller_name, seller_email, image_url, location, created_at, updated_at"
      )
      .single();

    if (error) {
      return {
        listing: null,
        error: `Failed to save listing: ${error.message}`,
      };
    }

    return {
      listing: normalizeListingRow(data as Record<string, unknown>),
      error: null,
    };
  }

  // LocalStorage fallback
  const newListing: Listing = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description: description || null,
    price: Number(input.price.toFixed(2)),
    category,
    seller_name: sellerName,
    seller_email: sellerEmail,
    image_url: imageUrl,
    location,
    created_at: new Date().toISOString(),
  };

  const existing = readLocalListings();
  writeLocalListings([newListing, ...existing]);
  return { listing: newListing, error: null };
}

export async function sendMessageToSeller(
  input: CreateMessageInput
): Promise<{ success: boolean; error: string | null }> {
  const buyerEmail = sanitizeTextInput(input.buyer_email).trim();
  const message = sanitizeTextInput(input.message).trim();

  if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return {
      success: false,
      error: "Please enter a valid email address.",
    };
  }
  if (!message) {
    return { success: false, error: "Please enter a message." };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("messages").insert({
      listing_id: input.listing_id,
      buyer_email: buyerEmail,
      seller_email: input.seller_email,
      message,
    });

    if (error) {
      return {
        success: false,
        error: `Failed to send message: ${error.message}`,
      };
    }

    return { success: true, error: null };
  }

  // LocalStorage fallback
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
      const existing: MarketplaceMessage[] = raw ? JSON.parse(raw) : [];
      existing.unshift({
        id: `msg-${Date.now()}`,
        listing_id: input.listing_id,
        buyer_email: buyerEmail,
        seller_email: input.seller_email,
        message,
        created_at: new Date().toISOString(),
      });
      window.localStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(existing)
      );
    } catch {
      // Ignore storage quota errors in demo mode
    }
  }

  return { success: true, error: null };
}
