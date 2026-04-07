"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type AdaptiveImageFrameProps = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
};

type Palette = {
  base: string;
  accent: string;
};

function fallbackPalette(): Palette {
  return {
    base: "rgb(226, 239, 231)",
    accent: "rgb(176, 201, 186)"
  };
}

export function AdaptiveImageFrame({
  src,
  alt,
  sizes,
  priority,
  className,
  imageClassName,
  zoom = 1,
  offsetX = 0,
  offsetY = 0
}: AdaptiveImageFrameProps) {
  const [palette, setPalette] = useState<Palette>(fallbackPalette);

  useEffect(() => {
    if (!src) {
      setPalette(fallbackPalette());
      return;
    }

    let mounted = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;

    img.onload = () => {
      if (!mounted) return;

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setPalette(fallbackPalette());
          return;
        }

        const size = 24;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 32) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }

        if (!count) {
          setPalette(fallbackPalette());
          return;
        }

        const avgR = Math.round(r / count);
        const avgG = Math.round(g / count);
        const avgB = Math.round(b / count);
        const accentR = Math.max(0, avgR - 30);
        const accentG = Math.max(0, avgG - 30);
        const accentB = Math.max(0, avgB - 30);

        setPalette({
          base: `rgb(${avgR}, ${avgG}, ${avgB})`,
          accent: `rgb(${accentR}, ${accentG}, ${accentB})`
        });
      } catch {
        setPalette(fallbackPalette());
      }
    };

    img.onerror = () => {
      if (mounted) setPalette(fallbackPalette());
    };

    return () => {
      mounted = false;
    };
  }, [src]);

  const backgroundStyle = useMemo(
    () => ({
      backgroundImage: `radial-gradient(circle at 25% 20%, ${palette.base}, ${palette.accent})`
    }),
    [palette]
  );

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)} style={backgroundStyle}>
      <div className="absolute inset-0 opacity-30 blur-3xl" style={backgroundStyle} />
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-contain", imageClassName)}
        style={{
          transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
          transformOrigin: "center center"
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/8" />
    </div>
  );
}
