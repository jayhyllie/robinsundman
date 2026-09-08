/** Default theme tokens — mirrored in globals.css fallbacks. */
export type BrandingColors = {
  bgColor: string;
  primaryColor: string;
  primaryBrightColor: string;
  accentColor: string;
  cardColor: string;
  borderColor: string;
  sidebarColor: string;
  borderRadius: string;
};

export const BRANDING_COLOR_DEFAULTS: BrandingColors = {
  bgColor: "#0a120e",
  primaryColor: "#a4c639",
  primaryBrightColor: "#39ff14",
  accentColor: "#ffd700",
  cardColor: "rgba(10, 30, 18, 0.85)",
  borderColor: "rgba(164, 198, 57, 0.4)",
  sidebarColor: "#0f1a12",
  borderRadius: "0.625rem",
};

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export const COLOR_VALUE = /^(#[0-9a-fA-F]{6}|rgba?\([^)]+\))$/;
export const BORDER_RADIUS_VALUE = /^(\d+(\.\d+)?)(rem|px)$/;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

/** Parse hex or rgb/rgba into picker-friendly parts. */
export function parseCssColor(value: string): { hex: string; alpha: number } {
  const trimmed = value.trim();
  if (HEX_COLOR.test(trimmed)) {
    return { hex: trimmed.toLowerCase(), alpha: 1 };
  }

  const match = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (match) {
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const alpha = match[4] !== undefined ? Number(match[4]) : 1;
    const hex = `#${[r, g, b]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")}`;
    return { hex, alpha };
  }

  return { hex: "#000000", alpha: 1 };
}

/** Format for storage — rgba fields always use rgba(), hex fields use #rrggbb. */
export function formatCssColor(
  hex: string,
  alpha: number,
  asRgba: boolean,
): string {
  if (!asRgba && alpha >= 1) return hex.toLowerCase();
  const { r, g, b } = hexToRgb(hex);
  const a = Math.round(alpha * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Parse CSS border-radius (rem or px) to pixels for the admin slider. */
export function parseBorderRadiusPx(value: string): number {
  const trimmed = value.trim();
  const remMatch = trimmed.match(/^([\d.]+)rem$/);
  if (remMatch) return Math.round(Number(remMatch[1]) * 16);
  const pxMatch = trimmed.match(/^([\d.]+)px$/);
  if (pxMatch) return Math.round(Number(pxMatch[1]));
  return 10;
}

/** Format pixel value from slider as rem for CSS `--radius`. */
export function formatBorderRadius(px: number): string {
  const rem = Math.round(px) / 16;
  return `${rem}rem`;
}

/** Push tenant colors into CSS custom properties consumed by globals.css + Tailwind. */
export function applyBrandingColors(
  root: HTMLElement,
  colors: Partial<BrandingColors>,
) {
  const c = { ...BRANDING_COLOR_DEFAULTS, ...colors };

  root.style.setProperty("--brand-primary-dark", c.bgColor);
  root.style.setProperty("--brand-primary-bright", c.primaryBrightColor);
  root.style.setProperty("--brand-surface", c.cardColor);
  root.style.setProperty("--brand-border", c.borderColor);

  root.style.setProperty("--primary", c.primaryColor);
  root.style.setProperty("--primary-foreground", c.bgColor);
  root.style.setProperty("--accent", c.accentColor);
  root.style.setProperty("--accent-foreground", c.bgColor);
  root.style.setProperty("--background", c.bgColor);
  root.style.setProperty("--foreground", "#f5f5f5");
  root.style.setProperty("--card", c.cardColor);
  root.style.setProperty("--border", c.borderColor);
  root.style.setProperty("--input", c.borderColor);
  root.style.setProperty("--ring", c.primaryColor);
  root.style.setProperty("--sidebar-primary", c.primaryColor);
  root.style.setProperty("--sidebar-primary-foreground", c.bgColor);
  root.style.setProperty("--sidebar-border", c.borderColor);
  root.style.setProperty("--sidebar-ring", c.primaryColor);
  root.style.setProperty("--sidebar", c.sidebarColor);
  root.style.setProperty("--radius", c.borderRadius);
}
