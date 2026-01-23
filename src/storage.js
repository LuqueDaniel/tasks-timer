const STORAGE_KEY = "task-timer:v1";
const CURRENT_VERSION = 1;

const THEMES = new Set(["system", "light", "dark"]);
const LANGUAGES = new Set(["en", "es"]);

/**
 * In-memory fallback for environments where `localStorage` is blocked
 * (e.g. some private browsing modes).
 *
 * @type {string|null}
 */
let memoryStorageValue = null;

/**
 * Returns a usable localStorage reference if available.
 * Some environments expose `localStorage` but throw on access.
 *
 * @returns {Storage|null}
 */
function getSafeLocalStorage() {
  try {
    if (typeof localStorage === "undefined") return null;
    const testKey = "__task_timer_ls_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return localStorage;
  } catch (err) {
    console.warn("[Task Timer] localStorage unavailable; using in-memory fallback", err);
    return null;
  }
}

/**
 * Storage backend used by this app.
 * When unavailable, we fall back to `memoryStorageValue`.
 *
 * @type {Storage|null}
 */
const SAFE_STORAGE = getSafeLocalStorage();

/**
 * Returns a fresh state object in the current schema.
 *
 * Note: this is also used as a safe fallback when storage is missing/corrupted.
 */
export function defaultState() {
  return {
    version: CURRENT_VERSION,
    tasks: [],
    running: null, // { taskId, startedAt }
    ui: {
      expanded: {}, // taskId: boolean
      showAllHistory: {}, // taskId: boolean
      theme: "system", // "system" | "light" | "dark"
      language: null, // null | "en" | "es" (null => detect on first run)
    },
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toSafeIntSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function normalizeEntries(entries) {
  if (!isPlainObject(entries)) return {};
  const out = {};
  for (const [k, v] of Object.entries(entries)) {
    if (typeof k !== "string" || k.length < 8) continue;
    const secs = toSafeIntSeconds(v);
    if (secs > 0) out[k] = secs;
  }
  return out;
}

function normalizeTask(raw) {
  if (!isPlainObject(raw)) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !name) return null;
  const createdAt = Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : Date.now();
  return {
    id,
    name,
    createdAt,
    entries: normalizeEntries(raw.entries),
  };
}

function normalizeUi(ui) {
  const expandedRaw = isPlainObject(ui?.expanded) ? ui.expanded : {};
  const showAllHistoryRaw = isPlainObject(ui?.showAllHistory) ? ui.showAllHistory : {};
  const themeRaw = typeof ui?.theme === "string" ? ui.theme : "system";
  const languageRaw = typeof ui?.language === "string" ? ui.language : null;

  // Treat these maps like sets: only keep keys that are enabled.
  const expanded = {};
  for (const [taskId, value] of Object.entries(expandedRaw)) {
    if (value) expanded[taskId] = true;
  }

  const showAllHistory = {};
  for (const [taskId, value] of Object.entries(showAllHistoryRaw)) {
    if (value) showAllHistory[taskId] = true;
  }

  const theme = THEMES.has(themeRaw) ? themeRaw : "system";

  const language = LANGUAGES.has(String(languageRaw).toLowerCase())
    ? String(languageRaw).toLowerCase()
    : null;
  return {
    expanded: { ...expanded },
    showAllHistory: { ...showAllHistory },
    theme,
    language,
  };
}

function normalizeState(state) {
  const base = defaultState();

  const tasksRaw = Array.isArray(state?.tasks) ? state.tasks : [];
  const tasks = [];
  const seenIds = new Set();
  for (const t of tasksRaw) {
    const norm = normalizeTask(t);
    if (!norm) continue;
    if (seenIds.has(norm.id)) continue;
    seenIds.add(norm.id);
    tasks.push(norm);
  }

  const ui = normalizeUi(state?.ui);

  let running = null;
  if (isPlainObject(state?.running)) {
    const taskId = typeof state.running.taskId === "string" ? state.running.taskId : null;
    const startedAt = Number(state.running.startedAt);
    if (taskId && Number.isFinite(startedAt) && tasks.some((t) => t.id === taskId)) {
      running = { taskId, startedAt };
    }
  }

  // Drop UI keys that no longer exist.
  for (const key of Object.keys(ui.expanded)) {
    if (!seenIds.has(key)) delete ui.expanded[key];
  }
  for (const key of Object.keys(ui.showAllHistory)) {
    if (!seenIds.has(key)) delete ui.showAllHistory[key];
  }

  return {
    ...base,
    version: CURRENT_VERSION,
    tasks,
    running,
    ui,
  };
}

export function migrateState(state) {
  if (!state || typeof state !== "object") return defaultState();

  // Supports states without a version (v0) or future/corrupted versions.
  const version = Number.isFinite(Number(state.version)) ? Number(state.version) : 0;

  // In this app (for now), v0/v1 are normalized into the current schema.
  if (version <= CURRENT_VERSION) {
    return normalizeState(state);
  }

  // If we find a future version, try not to break: normalize what we can.
  return normalizeState(state);
}

/**
 * Loads state from localStorage.
 *
 * Guarantees it returns a valid state in the current schema.
 */
export function loadState() {
  try {
    const raw = SAFE_STORAGE ? SAFE_STORAGE.getItem(STORAGE_KEY) : memoryStorageValue;
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return migrateState(parsed);
  } catch (err) {
    console.warn("[Task Timer] Failed to load state; using default state", err);
    return defaultState();
  }
}

/**
 * Saves state to localStorage.
 *
 * Returns false on quota/private-mode errors.
 */
export function saveState(state) {
  try {
    const raw = JSON.stringify(state);
    if (SAFE_STORAGE) SAFE_STORAGE.setItem(STORAGE_KEY, raw);
    else memoryStorageValue = raw;
    return true;
  } catch (err) {
    // This may fail due to quota/private mode; avoid breaking the UI.
    memoryStorageValue = null;
    console.warn("Failed to save state", err);
    return false;
  }
}

/**
 * Clears the persisted state from localStorage.
 * Returns false on quota/private-mode errors.
 */
export function clearStoredState() {
  try {
    if (SAFE_STORAGE) SAFE_STORAGE.removeItem(STORAGE_KEY);
    memoryStorageValue = null;
    return true;
  } catch (err) {
    memoryStorageValue = null;
    console.warn("Failed to clear state", err);
    return false;
  }
}
