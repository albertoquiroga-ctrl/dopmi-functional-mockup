export const PALETTE_STORAGE_KEY = "dopmi-palette-preview";

export type PalettePreviewId = "classic" | "warm" | "warm-trust";

const paletteListeners = new Set<() => void>();

export function subscribePalettePreview(listener: () => void) {
  paletteListeners.add(listener);
  return () => {
    paletteListeners.delete(listener);
  };
}

export function applyPalettePreview(id: PalettePreviewId) {
  if (id === "classic") delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = id;
  localStorage.setItem(PALETTE_STORAGE_KEY, id);
  paletteListeners.forEach((listener) => listener());
}

export function donorPawLogoFile(): string {
  return document.documentElement.dataset.palette === "warm-trust" ? "logo-paw-naranja.svg" : "logo-paw.svg";
}

export function verifiedBadgeIconFile(): string {
  return document.documentElement.dataset.palette === "warm-trust" ? "icon-verified-celeste.svg" : "icon-verified.svg";
}

export function readPalettePreview(): PalettePreviewId {
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
  if (stored === "warm" || stored === "warm-trust") return stored;
  if (document.documentElement.dataset.palette === "warm-trust") return "warm-trust";
  if (document.documentElement.dataset.palette === "warm") return "warm";
  return "classic";
}

export function initPalettePreview() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("palette");
  if (fromUrl === "warm" || fromUrl === "warm-trust" || fromUrl === "classic") {
    applyPalettePreview(fromUrl);
    return;
  }
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
  if (stored === "warm" || stored === "warm-trust") {
    document.documentElement.dataset.palette = stored;
    return;
  }
  /* Primera visita sin preferencia: mostrar propuesta alineada al mock de marca */
  if (!stored) {
    applyPalettePreview("warm-trust");
  }
}
