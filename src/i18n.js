import { messagesEn } from "./locales/en.js";
import { messagesEs } from "./locales/es.js";

const SUPPORTED_LANGUAGES = /** @type {const} */ (["en", "es"]);

/** @typedef {typeof SUPPORTED_LANGUAGES[number]} Language */

/** @type {Language} */
let currentLanguage = "en";

const MESSAGES = /** @type {const} */ ({
  en: messagesEn,
  es: messagesEs,
});

/**
 * Normalizes a language tag (e.g. "es-ES") into a supported base language.
 *
 * @param {unknown} raw
 * @returns {Language|null}
 */
function normalizeLanguage(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  const base = s.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(/** @type {any} */ (base)) ? /** @type {Language} */ (base) : null;
}

/**
 * Detects the best language for the current user agent.
 * Falls back to English when the browser language is unsupported.
 *
 * @returns {Language}
 */
export function detectLanguage() {
  /** @type {string[]} */
  const candidates = [];

  try {
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  } catch (err) {
    console.warn("[Task Timer] Failed to read navigator.languages", err);
  }

  try {
    if (navigator.language) candidates.push(navigator.language);
  } catch (err) {
    console.warn("[Task Timer] Failed to read navigator.language", err);
  }

  for (const cand of candidates) {
    const norm = normalizeLanguage(cand);
    if (norm) return norm;
  }

  return "en";
}

/**
 * Returns the currently active language.
 *
 * @returns {Language}
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Sets the current language (unsupported values fall back to English).
 * Also updates `<html lang>` and localized meta descriptions.
 *
 * @param {unknown} lang
 * @returns {void}
 */
export function setLanguage(lang) {
  const next = normalizeLanguage(lang) ?? "en";
  currentLanguage = next;

  document.documentElement.lang = next;

  const desc = t("meta.description");
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", desc);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", desc);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute("content", desc);
}

/**
 * Resolves a message by dot-key within a language dictionary.
 *
 * @param {Language} language
 * @param {string} key
 * @returns {string|null}
 */
function readMessage(language, key) {
  const parts = String(key).split(".");
  /** @type {any} */
  let cur = MESSAGES[language];
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return null;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : null;
}

/**
 * Performs simple `{name}` interpolation.
 *
 * @param {string} template
 * @param {Record<string, unknown>=} vars
 * @returns {string}
 */
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
    const v = vars[name];
    return typeof v === "undefined" || v === null ? "" : String(v);
  });
}

/**
 * Translates a dot-key using current language with English fallback.
 *
 * @param {string} key
 * @param {Record<string, unknown>=} vars
 * @returns {string}
 */
export function t(key, vars) {
  const fromCurrent = readMessage(currentLanguage, key);
  const fromEn = currentLanguage === "en" ? null : readMessage("en", key);
  const template = fromCurrent ?? fromEn ?? String(key);
  return interpolate(template, vars);
}

/**
 * Applies i18n markers to a single element.
 *
 * @param {Element} el
 * @returns {void}
 */
function applyToElement(el) {
  const key = el.getAttribute("data-i18n");
  if (key) el.textContent = t(key);

  const attrs = el.getAttribute("data-i18n-attr");
  if (attrs) {
    for (const part of attrs.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx < 0) continue;
      const attrName = trimmed.slice(0, idx).trim();
      const attrKey = trimmed.slice(idx + 1).trim();
      if (!attrName || !attrKey) continue;
      el.setAttribute(attrName, t(attrKey));
    }
  }
}

/**
 * Applies translations for all nodes under `root`.
 * Supports:
 * - `data-i18n="some.key"` => textContent
 * - `data-i18n-attr="aria-label:some.key,title:other.key"` => attributes
 *
 * @param {Document|Element} [root=document]
 * @returns {void}
 */
export function applyTranslations(root = document) {
  // Apply root itself if it has markers.
  if (root instanceof Element) applyToElement(root);

  const elements = root.querySelectorAll?.("[data-i18n], [data-i18n-attr]") ?? [];
  for (const el of elements) applyToElement(el);
}

/**
 * Returns true if `lang` is a supported language tag.
 *
 * @param {unknown} lang
 * @returns {boolean}
 */
export function isSupportedLanguage(lang) {
  return Boolean(normalizeLanguage(lang));
}

/**
 * Returns all supported languages.
 *
 * @returns {Language[]}
 */
export function supportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}
