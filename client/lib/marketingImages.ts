import manifest from "@shared/marketingImages.json";

export type MarketingImageEntry = {
  original: string;
  originalBytes: number;
  aspectRatio: string;
  defaultWidth: number;
  defaultHeight: number;
  sizes: { width: number; height: number; path: string; bytes?: number }[];
};

const images = manifest as Record<string, MarketingImageEntry>;

export function getMarketingImage(base: string): MarketingImageEntry | null {
  return images[base] ?? null;
}

export function pictureProps(
  base: string,
  options: { priority?: boolean; sizesAttr?: string; alt: string; className?: string },
) {
  const entry = getMarketingImage(base);
  if (!entry?.sizes?.length) {
    return {
      base,
      variants: [] as MarketingImageEntry["sizes"],
      alt: options.alt,
      fallbackSrc: entry?.original ?? `/${base}.png`,
      priority: options.priority,
      className: options.className,
      width: entry?.defaultWidth,
      height: entry?.defaultHeight,
      sizesAttr: options.sizesAttr,
    };
  }
  return {
    base,
    variants: entry.sizes,
    alt: options.alt,
    priority: options.priority,
    sizesAttr: options.sizesAttr,
    className: options.className,
    width: entry.defaultWidth,
    height: entry.defaultHeight,
    fallbackSrc: entry.original,
  };
}
