"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type SafeImageProps = Omit<ImageProps, "onError"> & {
  fallbackLabel?: string;
};

export function SafeImage({ fallbackLabel = "KHANGHUYNH VAULT", className, alt, src, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div
        className={cn("flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,rgba(255,138,61,.16),rgba(8,12,18,.92))] text-center", className)}
        aria-hidden="true"
      >
        <span className="px-3 text-[10px] font-bold uppercase tracking-[.22em] text-white/45">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
