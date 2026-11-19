"use client";

import * as React from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function LazyImage({
  src,
  alt,
  className = "",
  containerClassName = "relative h-full w-full overflow-hidden",
}: LazyImageProps) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
    setIsLoaded(
      Boolean(imgRef.current?.complete && imgRef.current?.naturalWidth > 0)
    );
  }, [src]);

  if (hasError) {
    return (
      <div className="marketplace-placeholder-pattern flex h-full w-full items-center justify-center text-xs font-medium text-[#1877F2]">
        Photo unavailable
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 fb-shimmer"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
