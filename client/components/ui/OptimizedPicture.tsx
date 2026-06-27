import { cn } from "@/lib/utils";

export type PictureVariant = {
  width: number;
  height: number;
  path: string;
};

export type OptimizedPictureProps = {
  /** Base name without extension, e.g. "home-hero" */
  base: string;
  variants: PictureVariant[];
  alt: string;
  className?: string;
  /** CSS sizes attribute for srcset selection */
  sizesAttr?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  /** Fallback when WebP unsupported */
  fallbackSrc?: string;
};

export function OptimizedPicture({
  base,
  variants,
  alt,
  className,
  sizesAttr = "100vw",
  priority = false,
  width,
  height,
  fallbackSrc,
}: OptimizedPictureProps) {
  const sorted = [...variants].sort((a, b) => a.width - b.width);
  const srcSet = sorted.map((s) => `${s.path} ${s.width}w`).join(", ");
  const largest = sorted[sorted.length - 1];
  const defaultSrc = largest?.path ?? fallbackSrc ?? `/${base}.png`;
  const w = width ?? largest?.width;
  const h = height ?? largest?.height;

  return (
    <picture>
      {srcSet ? (
        <source type="image/webp" srcSet={srcSet} sizes={sizesAttr} />
      ) : null}
      <img
        src={fallbackSrc ?? defaultSrc}
        alt={alt}
        width={w}
        height={h}
        className={cn(className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined}
      />
    </picture>
  );
}

/** Logo — small fixed sizes, always eager in chrome. */
export function LogoPicture({
  base = "1",
  alt = "Servd Co",
  className,
  width = 120,
  height = 40,
}: {
  base?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const webp128 = `/${base}-128.webp`;
  const webp256 = `/${base}-256.webp`;
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={`${webp128} 128w, ${webp256} 256w`}
        sizes={`${width}px`}
      />
      <img
        src={`/${base}.png`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    </picture>
  );
}
