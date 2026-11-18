"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Trash2,
} from "lucide-react";
import {
  MARKETPLACE_CATEGORIES,
  getCategoryBySlug,
} from "@/lib/categories";
import {
  createListing,
  fetchListingById,
  formatPrice,
  getSavedSellerEmail,
  updateListing,
} from "@/lib/marketplace-store";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/security";

const LOGGED_IN_SELLER = {
  name: "Greg Wientjes",
  avatar: "/greg-profile.png",
};

function CreateItemFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editListingId = searchParams.get("edit");
  const isEditMode = Boolean(editListingId);
  const isMultipleMode = !isEditMode && searchParams.get("mode") === "multiple";
  const initialCategorySlug = searchParams.get("category");
  const initialCategory =
    getCategoryBySlug(initialCategorySlug)?.name ?? "Electronics";

  const [title, setTitle] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState(initialCategory);
  const [sellerEmail, setSellerEmail] = React.useState("");
  const [location, setLocation] = React.useState("Palo Alto, CA");
  const [description, setDescription] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = React.useState<string | null>(
    null
  );
  const [removeExistingImage, setRemoveExistingImage] = React.useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null
  );
  const [isLoadingExisting, setIsLoadingExisting] =
    React.useState(isEditMode);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [publishedListings, setPublishedListings] = React.useState<
    Array<{ id: string; title: string; price: number }>
  >([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!editListingId) {
      const saved = getSavedSellerEmail();
      if (saved) setSellerEmail(saved);
      setIsLoadingExisting(false);
      return;
    }

    let cancelled = false;
    async function loadExisting() {
      setIsLoadingExisting(true);
      const result = await fetchListingById(editListingId!);
      if (cancelled) return;
      if (result.error || !result.listing) {
        setError(result.error ?? "Listing not found.");
        setIsLoadingExisting(false);
        return;
      }

      const item = result.listing;
      setTitle(item.title);
      setPrice(String(item.price));
      setCategory(item.category);
      setSellerEmail(item.seller_email || "");
      setLocation(item.location || "Palo Alto, CA");
      setDescription(item.description ?? "");
      setExistingImageUrl(item.image_url);
      setImagePreviewUrl(item.image_url);
      setRemoveExistingImage(false);
      setIsLoadingExisting(false);
    }

    void loadExisting();
    return () => {
      cancelled = true;
    };
  }, [editListingId]);

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function handleFileSelect(file: File | null) {
    setError(null);
    if (!file) return;

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setRemoveExistingImage(false);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleClearImage() {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    if (existingImageUrl) {
      setRemoveExistingImage(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    void handleFileSelect(droppedFile);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedPrice = Number(price);
    if (!title.trim()) {
      setError("Please enter a listing title.");
      return;
    }
    if (price.trim() === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid non-negative price.");
      return;
    }
    if (!sellerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    if (isEditMode && editListingId) {
      const result = await updateListing(editListingId, {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category,
        seller_email: sellerEmail.trim(),
        location: location.trim() || "Palo Alto, CA",
        imageFile,
        removeImage: removeExistingImage,
        existingImageUrl,
      });
      setIsSubmitting(false);

      if (result.error || !result.listing) {
        setError(result.error ?? "Failed to update listing.");
        return;
      }

      router.push(`/item/${result.listing.id}`);
      return;
    }

    const result = await createListing({
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      category,
      seller_name: LOGGED_IN_SELLER.name,
      seller_email: sellerEmail.trim(),
      location: location.trim() || "Palo Alto, CA",
      imageFile,
    });
    setIsSubmitting(false);

    if (result.error || !result.listing) {
      setError(result.error ?? "Failed to create listing.");
      return;
    }

    if (isMultipleMode) {
      setPublishedListings((prev) => [
        {
          id: result.listing!.id,
          title: result.listing!.title,
          price: result.listing!.price,
        },
        ...prev,
      ]);
      setTitle("");
      setPrice("");
      setDescription("");
      handleClearImage();
      return;
    }

    router.push(`/item/${result.listing.id}`);
  }

  const numericPreviewPrice =
    price.trim() !== "" && Number.isFinite(Number(price))
      ? Number(price)
      : null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col lg:flex-row">
      {/* Left Form Column */}
      <aside className="w-full lg:w-[440px] xl:w-[480px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#CED0D4] p-6 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#CED0D4]/70">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-xl leading-none">
              f
            </span>
            <span className="text-lg font-bold text-[#1C1E21]">
              Marketplace
            </span>
          </Link>
          <Link
            href={isEditMode && editListingId ? `/item/${editListingId}` : "/create"}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#65676B] hover:text-[#1C1E21]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#1C1E21]">
              {isEditMode
                ? "Edit listing"
                : isMultipleMode
                  ? "Create multiple listings"
                  : "Item for sale"}
            </h1>
            {isMultipleMode && (
              <p className="text-xs text-[#65676B]">
                Publish items back-to-back without leaving this page.
              </p>
            )}
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full bg-[#F0F2F5] px-2.5 py-1 hover:bg-[#E4E6EB] transition-colors shrink-0"
          >
            <img
              src={LOGGED_IN_SELLER.avatar}
              alt={LOGGED_IN_SELLER.name}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-xs font-semibold text-[#1C1E21]">
              {LOGGED_IN_SELLER.name}
            </span>
          </Link>
        </div>

        {isMultipleMode && publishedListings.length > 0 && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Published {publishedListings.length}{" "}
                {publishedListings.length === 1 ? "listing" : "listings"}!
              </span>
              <Link
                href="/"
                className="font-semibold text-[#1877F2] hover:underline"
              >
                View all
              </Link>
            </div>
            <p className="text-emerald-700 truncate">
              Latest:{" "}
              <Link
                href={`/item/${publishedListings[0].id}`}
                className="font-semibold underline"
              >
                {publishedListings[0].title}
              </Link>{" "}
              ({formatPrice(publishedListings[0].price)}) — add your next item
              below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 flex-1">
          {/* Drag & Drop Photo Upload (compact width) */}
          <div>
            <label className="block text-xs font-semibold text-[#65676B] mb-1.5">
              Photo
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative w-full max-w-[260px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#1877F2] bg-[#E7F3FF]"
                  : "border-[#CED0D4] bg-[#F8F9FB] hover:border-[#1877F2]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) =>
                  void handleFileSelect(e.target.files?.[0] ?? null)
                }
              />

              {imagePreviewUrl ? (
                <div className="relative w-full">
                  <img
                    src={imagePreviewUrl}
                    alt="Selected listing preview"
                    className="mx-auto max-h-40 rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearImage();
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove photo</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#E4E6EB] text-[#1C1E21]">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#1C1E21]">
                    Add photos
                  </p>
                  <p className="mt-0.5 text-xs text-[#65676B]">
                    Drag and drop or click to upload (max {MAX_IMAGE_SIZE_LABEL})
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="listing-title"
              className="block text-xs font-semibold text-[#65676B] mb-1"
            >
              Title *
            </label>
            <input
              id="listing-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              className="h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="listing-price"
                className="block text-xs font-semibold text-[#65676B] mb-1"
              >
                Price ($) *
              </label>
              <input
                id="listing-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
              />
            </div>

            <div>
              <label
                htmlFor="listing-category"
                className="block text-xs font-semibold text-[#65676B] mb-1"
              >
                Category *
              </label>
              <select
                id="listing-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-2.5 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
              >
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seller Email (private, receives buyer messages) */}
          <div>
            <label
              htmlFor="seller-email"
              className="block text-xs font-semibold text-[#65676B] mb-1"
            >
              Email (kept private, receives buyer messages) *
            </label>
            <input
              id="seller-email"
              type="email"
              required
              value={sellerEmail}
              onChange={(e) => setSellerEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="listing-location"
              className="block text-xs font-semibold text-[#65676B] mb-1"
            >
              Location
            </label>
            <input
              id="listing-location"
              type="text"
              maxLength={100}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Palo Alto, CA"
              className="h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="listing-description"
              className="block text-xs font-semibold text-[#65676B] mb-1"
            >
              Description
            </label>
            <textarea
              id="listing-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the condition, dimensions, or pickup details..."
              className="w-full rounded-lg border border-[#CED0D4] bg-white p-3 text-sm text-[#1C1E21] focus:border-[#1877F2] focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoadingExisting}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] text-sm font-semibold text-white shadow-sm hover:bg-[#166FE5] disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEditMode ? "Saving..." : "Publishing..."}</span>
              </>
            ) : (
              <span>
                {isEditMode
                  ? "Save changes"
                  : isMultipleMode
                    ? "Publish & Add Another"
                    : "Next"}
              </span>
            )}
          </button>
        </form>
      </aside>

      {/* Right Real-Time Preview Panel matching Mockups 3 & 4 */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
        <div className="w-full">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#65676B]">
              Preview
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#65676B] border border-[#CED0D4]">
              {category}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white border border-[#CED0D4] shadow-sm flex flex-col md:flex-row">
            {/* Image Preview with blurred background */}
            <div
              className={`relative flex-1 overflow-hidden flex items-center justify-center p-6 sm:p-8 min-h-[320px] md:min-h-[540px] border-b md:border-b-0 md:border-r border-[#CED0D4] ${
                imagePreviewUrl ? "bg-[#18191A]" : "bg-[#F0F2F5]"
              }`}
            >
              {imagePreviewUrl ? (
                <>
                  <img
                    src={imagePreviewUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-65 select-none pointer-events-none"
                  />
                  <img
                    src={imagePreviewUrl}
                    alt="Listing preview"
                    className="relative z-10 max-h-[440px] max-w-[82%] w-auto object-contain rounded-lg shadow-2xl"
                  />
                </>
              ) : (
                <div className="marketplace-placeholder-pattern flex h-full w-full min-h-[320px] flex-col items-center justify-center p-6 text-center">
                  <ImagePlus className="h-10 w-10 text-[#1877F2]/60 mb-2" />
                  <p className="text-sm font-medium text-[#1877F2]">
                    Your listing photo will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Details Preview */}
            <div className="w-full md:w-[340px] xl:w-[380px] shrink-0 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#1C1E21] break-words">
                    {title.trim() || "Title"}
                  </h2>
                  <p className="mt-1 text-xl font-bold text-[#1C1E21]">
                    {numericPreviewPrice !== null
                      ? formatPrice(numericPreviewPrice)
                      : "Price"}
                  </p>
                </div>

                <div className="text-xs text-[#65676B] space-y-1">
                  <p>Listed just now</p>
                  <p className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>in {location.trim() || "Palo Alto, CA"}</span>
                  </p>
                </div>

                <div className="border-t border-[#CED0D4]/70 pt-4">
                  <h3 className="text-sm font-semibold text-[#1C1E21]">
                    Details
                  </h3>
                  <p className="mt-1.5 text-sm text-[#65676B] whitespace-pre-wrap break-words">
                    {description.trim() ||
                      "Your item description will appear here as you type."}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#CED0D4]/70 pt-4">
                <h3 className="text-sm font-semibold text-[#1C1E21]">
                  Seller Information
                </h3>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <img
                    src={LOGGED_IN_SELLER.avatar}
                    alt={LOGGED_IN_SELLER.name}
                    className="h-9 w-9 rounded-full object-cover border border-[#CED0D4]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#1C1E21]">
                      {LOGGED_IN_SELLER.name}
                    </p>
                    <p className="text-xs text-[#65676B]">
                      Palo Alto · Seller
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateItemPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center text-sm text-[#65676B]">
          Loading listing editor...
        </div>
      }
    >
      <CreateItemFormInner />
    </React.Suspense>
  );
}
