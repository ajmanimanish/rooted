"use client";

import { useState } from "react";
import Image from "next/image";

// Used inside card Links — arrow clicks must not trigger the card's own
// navigation, hence preventDefault/stopPropagation on every button.
export default function PhotoCarousel({
  photos,
  alt,
  heightClassName = "h-40",
  blurred = false,
}: {
  photos: string[];
  alt: string;
  heightClassName?: string;
  blurred?: boolean;
}) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return null;

  const go = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + photos.length) % photos.length);
  };

  return (
    <div className={`relative ${heightClassName} w-full overflow-hidden bg-[var(--color-base)]`}>
      <Image
        src={photos[index]}
        alt={alt}
        fill
        className={`object-cover ${blurred ? "blur-md" : ""}`}
      />
      {blurred && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-2xl">🔒</div>
      )}
      {photos.length > 1 && !blurred && (
        <>
          <button
            onClick={(e) => go(e, -1)}
            aria-label="Previous photo"
            className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-sm text-white hover:bg-black/60"
          >
            ‹
          </button>
          <button
            onClick={(e) => go(e, 1)}
            aria-label="Next photo"
            className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-sm text-white hover:bg-black/60"
          >
            ›
          </button>
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-1 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
