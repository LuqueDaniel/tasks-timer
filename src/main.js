import { createStore } from "./store.js";
import { getDom } from "./dom.js";
import { renderApp, renderLive } from "./render.js";
import {
  showToast,
  showUndoToast,
  showUndoToastMessage,
  removeUndoToast,
  mountToastHost,
} from "./components/toast.js";
import { setupSettingsDialog } from "./components/settings.js";
import { applyThemePreference } from "./theme.js";
import {
  addTask,
  startTask,
  stopRunning,
  deleteTask,
  deleteHistoryEntry,
  toggleHistory,
  toggleShowAll,
  renameTask,
  restoreDeletedTask,
  restoreHistoryEntry,
} from "./model.js";
import { nowMs, toLocalDateKey, formatDateKeyForUser, formatHMS } from "./time.js";
import { applyTranslations, detectLanguage, setLanguage as setI18nLanguage, t } from "./i18n.js";
import { setupErrorReporting } from "./errorReporter.js";

/** @typedef {ReturnType<typeof createStore>} Store */
/** @typedef {import("./types/appTypes.js").DomRefs} DomRefs */
/** @typedef {import("./types/appTypes.js").AppTaskState} AppTaskState */
/** @typedef {import("./types/appTypes.js").RenderHandlers} RenderHandlers */

/**
 * @typedef HistoryUndoSnapshot
 * @property {"history"} kind
 * @property {string} taskId
 * @property {string} taskName
 * @property {string} dateKey
 * @property {number} seconds
 */

/**
 * @typedef TaskUndoSnapshot
 * @property {{ id: string, name: string, createdAt: number, entries: Record<string, number> }} task
 * @property {number} index
 * @property {{ expanded: boolean | undefined, showAllHistory: boolean | undefined }} ui
 * @property {{ taskId: string, startedAt: number } | null} running
 */

/**
 * @typedef PendingUndo
 * @property {HistoryUndoSnapshot | TaskUndoSnapshot} snapshot
 * @property {number} timeoutId
 */

/**
 * Initializes the language (persisted or detected) and applies a translation pass.
 * Dynamic Preact-rendered sections consume i18n keys directly at render time.
 *
 * @param {Store} store
 * @returns {void}
 */
function ensureLanguageInitialized(store) {
  const state = /** @type {AppTaskState} */ (store.getState());
  const stored = state?.ui?.language;
  const detected = detectLanguage();
  const initial = stored === "en" || stored === "es" ? stored : detected;

  if (state?.ui?.language !== initial) {
    store.mutate(
      /** @param {AppTaskState} s */
      (s) => {
        s.ui.language = initial;
      },
    );
  }

  setI18nLanguage(initial);
  applyTranslations(document);
}

const store = createStore();
const dom = getDom();

mountToastHost(dom.toastHost);

setupErrorReporting();

ensureLanguageInitialized(store);

const UNDO_MS = 8000;
/** @type {PendingUndo | null} */
let pendingUndo = null;

/** @param {string} taskId @param {string} dateKey */
function deleteHistoryEntryWithUndo(taskId, dateKey) {
  const state = /** @type {AppTaskState} */ (store.getState());
  const task = state.tasks.find((t) => t.id === taskId);
  const secs = task?.entries?.[dateKey];
  if (!task || !secs) return;

  const ok = confirm(
    t("dialogs.confirmDeleteEntry", {
      task: task.name,
      date: formatDateKeyForUser(dateKey),
      time: formatHMS(secs),
    }),
  );
  if (!ok) return;

  invalidatePendingUndo();

  /** @type {HistoryUndoSnapshot} */
  const snapshot = {
    kind: "history",
    taskId,
    taskName: task.name,
    dateKey,
    seconds: secs,
  };

  deleteHistoryEntry(store, taskId, dateKey);

  const timeoutId = window.setTimeout(() => {
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
  }, UNDO_MS);

  pendingUndo = { snapshot, timeoutId };

  showUndoToastMessage(
    dom.toastHost,
    t("toast.historyDeleted", {
      task: task.name,
      date: formatDateKeyForUser(dateKey),
    }),
    () => {
      if (!pendingUndo) return;
      clearTimeout(pendingUndo.timeoutId);
      const snap = pendingUndo.snapshot;
      pendingUndo = null;
      removeUndoToast(dom.toastHost);
      restoreHistoryEntry(store, snap);
    },
    { ms: UNDO_MS, undoText: t("common.undo") },
  );
}

function invalidatePendingUndo() {
  if (pendingUndo?.timeoutId) {
    clearTimeout(pendingUndo.timeoutId);
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
  }
}

/** @param {string} taskId */
function deleteTaskWithUndo(taskId) {
  const state = /** @type {AppTaskState} */ (store.getState());
  const index = state.tasks.findIndex((t) => t.id === taskId);
  const task = state.tasks[index];
  if (!task) return;

  // Invalidate previous undo (only the last deletion can be undone)
  invalidatePendingUndo();

  /** @type {TaskUndoSnapshot} */
  const snapshot = {
    task:
      typeof structuredClone === "function"
        ? structuredClone(task)
        : JSON.parse(JSON.stringify(task)),
    index,
    ui: {
      expanded: state.ui.expanded?.[taskId],
      showAllHistory: state.ui.showAllHistory?.[taskId],
    },
    running: state.running?.taskId === taskId ? { ...state.running } : null,
  };

  deleteTask(store, taskId);

  const timeoutId = window.setTimeout(() => {
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
  }, UNDO_MS);

  pendingUndo = { snapshot, timeoutId };

  showUndoToast(
    dom.toastHost,
    task.name,
    () => {
      if (!pendingUndo) return;
      clearTimeout(pendingUndo.timeoutId);
      const snap = pendingUndo.snapshot;
      pendingUndo = null;
      removeUndoToast(dom.toastHost);
      restoreDeletedTask(store, snap);
    },
    { ms: UNDO_MS },
  );
}

/** @type {RenderHandlers} */
const handlers = {
  /** @param {string} name */
  addTask: (name) => {
    const res = addTask(store, name);
    if (!res?.ok) {
      if (res?.error === "duplicate")
        showToast(dom.toastHost, t("errors.duplicateTaskName"), { kind: "error", ms: 4500 });
      else if (res?.error === "too_long")
        showToast(dom.toastHost, t("errors.taskNameTooLong"), { kind: "error", ms: 4500 });
      else showToast(dom.toastHost, t("errors.invalidTaskName"), { kind: "error", ms: 4500 });
    }
    return res;
  },
  /** @param {string} taskId */
  startTask: (taskId) => startTask(store, taskId),
  stopRunning: () => stopRunning(store),
  /** @param {string} taskId */
  deleteTask: (taskId) => deleteTaskWithUndo(taskId),
  /** @param {string} taskId @param {string} dateKey */
  deleteHistoryEntry: (taskId, dateKey) => deleteHistoryEntryWithUndo(taskId, dateKey),
  /** @param {string} taskId */
  toggleHistory: (taskId) => toggleHistory(store, taskId),
  /** @param {string} taskId */
  toggleShowAll: (taskId) => toggleShowAll(store, taskId),
  /** @param {string} taskId @param {string} nextName */
  renameTask: (taskId, nextName) => {
    const res = renameTask(store, taskId, nextName);
    if (!res?.ok) {
      if (res?.error === "duplicate")
        showToast(dom.toastHost, t("errors.duplicateTaskName"), { kind: "error", ms: 4500 });
      else if (res?.error === "too_long")
        showToast(dom.toastHost, t("errors.taskNameTooLong"), { kind: "error", ms: 4500 });
      else showToast(dom.toastHost, t("errors.invalidTaskName"), { kind: "error", ms: 4500 });
    }
    return res;
  },
};

function render() {
  renderApp(store.getState(), dom, handlers);
}

/** @type {"system" | "light" | "dark" | null} */
let lastTheme = null;
function syncThemeFromState() {
  const theme = store.getState()?.ui?.theme ?? "system";
  if (theme === lastTheme) return;
  lastTheme = theme;
  applyThemePreference(theme);
}

/** @type {"en" | "es" | null} */
let lastLanguage = null;
function syncLanguageFromState() {
  const lang = store.getState()?.ui?.language === "es" ? "es" : "en";
  if (lang === lastLanguage) return;
  lastLanguage = lang;

  setI18nLanguage(lang);
  applyTranslations(document);
}

store.subscribe(() => {
  syncThemeFromState();
  syncLanguageFromState();
  render();
});

syncThemeFromState();
syncLanguageFromState();
render();

setupSettingsDialog({ store, dom, invalidatePendingUndo });

let lastDateKey = toLocalDateKey(nowMs());
setInterval(() => {
  const state = store.getState();
  const dateKey = toLocalDateKey(nowMs());

  // If the day changes, do a full render to refresh every card.
  if (dateKey !== lastDateKey) {
    lastDateKey = dateKey;
    renderApp(state, dom, handlers);
    return;
  }

  // If a timer is running, update only summary + active task.
  if (state.running) {
    renderLive(state, dom);
  }
}, 1000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render();
});

window.addEventListener("beforeunload", () => {
  store.persist();
});
