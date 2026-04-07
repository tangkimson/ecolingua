type CoverImageTransform = {
  src: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseCoverImageTransform(value: string): CoverImageTransform {
  if (!value) {
    return { src: "", zoom: 1, offsetX: 0, offsetY: 0 };
  }

  const [src, hash] = value.split("#", 2);
  const params = new URLSearchParams(hash || "");

  const zoom = clamp(Number(params.get("z") || 100) / 100, 0.5, 2);
  const offsetX = clamp(Number(params.get("x") || 0), -50, 50);
  const offsetY = clamp(Number(params.get("y") || 0), -50, 50);

  return {
    src,
    zoom: Number.isFinite(zoom) ? zoom : 1,
    offsetX: Number.isFinite(offsetX) ? offsetX : 0,
    offsetY: Number.isFinite(offsetY) ? offsetY : 0
  };
}

export function formatCoverImageTransform(src: string, zoom: number, offsetX: number, offsetY: number) {
  const cleanSrc = src.split("#", 2)[0];
  if (!cleanSrc) return "";

  const params = new URLSearchParams();
  params.set("z", String(Math.round(clamp(zoom, 0.5, 2) * 100)));
  params.set("x", String(Math.round(clamp(offsetX, -50, 50))));
  params.set("y", String(Math.round(clamp(offsetY, -50, 50))));

  return `${cleanSrc}#${params.toString()}`;
}
