import { createStore } from "./store.js";
import { h, render } from "preact";
import { App } from "./app/App.jsx";
import {
  showToast,
  showUndoToast,
  showUndoToastMessage,
  removeUndoToast,
  createToastController,
} from "./components/toast.js";
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
  setLanguage,
  setTheme,
} from "./model.js";
import { clearStoredState, defaultState, migrateState } from "./storage.js";
import { nowMs, toLocalDateKey, formatDateKeyForUser, formatHMS } from "./time.js";
import { detectLanguage, setLanguage as setI18nLanguage, t } from "./i18n.js";
import { setupErrorReporting } from "./errorReporter.js";

/** @typedef {ReturnType<typeof createStore>} Store */
/** @typedef {import("./types/appTypes.js").AppTaskState} AppTaskState */
/** @typedef {import("./types/appTypes.js").AppHandlers} AppHandlers */

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
 * Initializes the language from persisted state or browser preferences before the first render.
 * Preact-rendered sections consume i18n keys directly at render time.
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
}

const store = createStore();
const toastController = createToastController();

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
    removeUndoToast(toastController);
  }, UNDO_MS);

  pendingUndo = { snapshot, timeoutId };

  showUndoToastMessage(
    toastController,
    t("toast.historyDeleted", {
      task: task.name,
      date: formatDateKeyForUser(dateKey),
    }),
    () => {
      if (!pendingUndo) return;
      clearTimeout(pendingUndo.timeoutId);
      const snap = pendingUndo.snapshot;
      pendingUndo = null;
      removeUndoToast(toastController);
      restoreHistoryEntry(store, snap);
    },
    { ms: UNDO_MS, undoText: t("common.undo") },
  );
}

function invalidatePendingUndo() {
  if (pendingUndo?.timeoutId) {
    clearTimeout(pendingUndo.timeoutId);
    pendingUndo = null;
    removeUndoToast(toastController);
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
    removeUndoToast(toastController);
  }, UNDO_MS);

  pendingUndo = { snapshot, timeoutId };

  showUndoToast(
    toastController,
    task.name,
    () => {
      if (!pendingUndo) return;
      clearTimeout(pendingUndo.timeoutId);
      const snap = pendingUndo.snapshot;
      pendingUndo = null;
      removeUndoToast(toastController);
      restoreDeletedTask(store, snap);
    },
    { ms: UNDO_MS },
  );
}

/** @type {AppHandlers} */
const handlers = {
  /** @param {string} name */
  addTask: (name) => {
    const res = addTask(store, name);
    if (!res?.ok) {
      if (res?.error === "duplicate")
        showToast(toastController, t("errors.duplicateTaskName"), { kind: "error", ms: 4500 });
      else if (res?.error === "too_long")
        showToast(toastController, t("errors.taskNameTooLong"), { kind: "error", ms: 4500 });
      else showToast(toastController, t("errors.invalidTaskName"), { kind: "error", ms: 4500 });
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
        showToast(toastController, t("errors.duplicateTaskName"), { kind: "error", ms: 4500 });
      else if (res?.error === "too_long")
        showToast(toastController, t("errors.taskNameTooLong"), { kind: "error", ms: 4500 });
      else showToast(toastController, t("errors.invalidTaskName"), { kind: "error", ms: 4500 });
    }
    return res;
  },
};

const settings = {
  onThemeChange: (nextTheme) => setTheme(store, nextTheme),
  onLanguageChange: (nextLanguage) => {
    setLanguage(store, nextLanguage);
  },
  onExport: () => {
    const current = store.getState();
    const blob = new Blob(
      [
        JSON.stringify(
          {
            app: "task-timer",
            exportedAt: new Date().toISOString(),
            state: { ...current, running: null },
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `task-timer-${toLocalDateKey(nowMs())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(toastController, t("toast.exportCreated"), { kind: "info", ms: 2500 });
  },
  onImportFile: async (file) => {
    try {
      const parsed = JSON.parse(await file.text());
      const rawState = parsed?.app === "task-timer" && parsed?.state ? parsed.state : parsed;
      const nextState = migrateState(rawState);
      nextState.running = null;
      invalidatePendingUndo();
      store.replaceState(nextState);
      showToast(toastController, t("toast.imported"), { kind: "info", ms: 3000 });
      return true;
    } catch (err) {
      console.error("[Task Timer] Failed to import JSON", err);
      showToast(toastController, t("toast.importFailed"), { kind: "error", ms: 4500 });
      return false;
    }
  },
  onDeleteAll: () => {
    invalidatePendingUndo();
    clearStoredState();
    store.replaceState(defaultState(), { persist: false });
    showToast(toastController, t("toast.deletedAll"), { kind: "info", ms: 3000 });
  },
};

render(h(App, { store, handlers, settings, toastController }), document.getElementById("appRoot"));
