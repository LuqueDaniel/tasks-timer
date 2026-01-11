export const THEMES = /** @type {const} */ ({
  system: "system",
  light: "light",
  dark: "dark",
});

export function normalizeTheme(value) {
  const v = String(value ?? "").toLowerCase();
  if (v === THEMES.light) return THEMES.light;
  if (v === THEMES.dark) return THEMES.dark;
  return THEMES.system;
}

export function applyThemePreference(theme) {
  const root = document.documentElement;
  const norm = normalizeTheme(theme);

  if (norm === THEMES.light || norm === THEMES.dark) {
    root.dataset.theme = norm;
  } else {
    delete root.dataset.theme;
  }
}
