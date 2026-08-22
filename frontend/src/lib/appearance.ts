export type ThemeMode = "dark" | "light";
export type FontScaleKey = "sm" | "md" | "lg" | "xl";

export const THEME_KEY = "theme";
export const FONT_SCALE_KEY = "font-scale";

export const FONT_SCALES: Record<FontScaleKey, { label: string; value: number }> = {
  sm: { label: "Pequeño", value: 0.9 },
  md: { label: "Normal", value: 1 },
  lg: { label: "Grande", value: 1.15 },
  xl: { label: "Muy grande", value: 1.3 },
};

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  return stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

export function getStoredFontScale(): FontScaleKey {
  if (typeof window === "undefined") return "md";
  const stored = localStorage.getItem(FONT_SCALE_KEY) as FontScaleKey | null;
  return stored && stored in FONT_SCALES ? stored : "md";
}

/**
 * Aplica tema y tamaño de letra al documento. Se llama al montar la app
 * (ResponsiveLayout) y desde el panel de configuración cuando el usuario
 * cambia una preferencia.
 */
export function applyAppearance(theme: ThemeMode, fontScale: FontScaleKey) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.style.fontSize = `${FONT_SCALES[fontScale].value * 100}%`;
}

export function setTheme(theme: ThemeMode) {
  localStorage.setItem(THEME_KEY, theme);
  applyAppearance(theme, getStoredFontScale());
}

export function setFontScale(fontScale: FontScaleKey) {
  localStorage.setItem(FONT_SCALE_KEY, fontScale);
  applyAppearance(getStoredTheme(), fontScale);
}
