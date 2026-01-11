import { createStore } from "./store.js?v=20260111-4";
import { getDom } from "./dom.js?v=20260111-4";
import { renderApp, renderLive } from "./render.js?v=20260111-4";
import { showToast, showUndoToast, showUndoToastMessage, removeUndoToast } from "./components/toast.js?v=20260111-4";
import { setupSettingsDialog } from "./components/settings.js?v=20260111-4";
import { applyThemePreference } from "./theme.js?v=20260111-4";
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
} from "./model.js?v=20260111-4";
import { nowMs, toLocalDateKey, formatDateKeyForUser, formatHMS } from "./time.js?v=20260111-4";

const store = createStore();
const dom = getDom();

const UNDO_MS = 8000;
let pendingUndo = null; // { snapshot, timeoutId }

function deleteHistoryEntryWithUndo(taskId, dateKey) {
  const state = store.getState();
  const task = state.tasks.find((t) => t.id === taskId);
  const secs = task?.entries?.[dateKey];
  if (!task || !secs) return;

  const ok = confirm(
    `¿Borrar la entrada de "${task.name}" del ${formatDateKeyForUser(dateKey)} (${formatHMS(secs)})?`,
  );
  if (!ok) return;

  invalidatePendingUndo();

  const snapshot = {
    kind: "history",
    taskId,
    taskName: task.name,
    dateKey,
    seconds: secs,
  };

  deleteHistoryEntry(store, taskId, dateKey);

  const timeoutId = setTimeout(() => {
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
  }, UNDO_MS);

  pendingUndo = { snapshot, timeoutId };

  showUndoToastMessage(
    dom.toastHost,
    `Entrada de “${task.name}” · ${formatDateKeyForUser(dateKey)} borrada.`,
    () => {
      if (!pendingUndo) return;
      clearTimeout(pendingUndo.timeoutId);
      const snap = pendingUndo.snapshot;
      pendingUndo = null;
      removeUndoToast(dom.toastHost);
      restoreHistoryEntry(store, snap);
    },
    { ms: UNDO_MS },
  );
}

function invalidatePendingUndo() {
  if (pendingUndo?.timeoutId) {
    clearTimeout(pendingUndo.timeoutId);
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
  }
}

function deleteTaskWithUndo(taskId) {
  const state = store.getState();
  const index = state.tasks.findIndex((t) => t.id === taskId);
  const task = state.tasks[index];
  if (!task) return;

  // Invalidate previous undo (only the last deletion can be undone)
  invalidatePendingUndo();

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

  const timeoutId = setTimeout(() => {
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
  }, UNDO_MS);

  pendingUndo = { snapshot, timeoutId };

  showUndoToast(dom.toastHost, task.name, () => {
    if (!pendingUndo) return;
    clearTimeout(pendingUndo.timeoutId);
    const snap = pendingUndo.snapshot;
    pendingUndo = null;
    removeUndoToast(dom.toastHost);
    restoreDeletedTask(store, snap);
  }, { ms: UNDO_MS });
}

const handlers = {
  addTask: (name) => {
    const res = addTask(store, name);
    if (!res?.ok) {
      if (res?.error === "duplicate") showToast(dom.toastHost, "Ya existe una tarea con ese nombre.", { kind: "error", ms: 4500 });
      else if (res?.error === "too_long") showToast(dom.toastHost, "El nombre es demasiado largo (máx. 80 caracteres).", { kind: "error", ms: 4500 });
      else showToast(dom.toastHost, "Escribe un nombre de tarea válido.", { kind: "error", ms: 4500 });
    }
    return res;
  },
  startTask: (taskId) => startTask(store, taskId),
  stopRunning: () => stopRunning(store),
  deleteTask: (taskId) => deleteTaskWithUndo(taskId),
  deleteHistoryEntry: (taskId, dateKey) => deleteHistoryEntryWithUndo(taskId, dateKey),
  toggleHistory: (taskId) => toggleHistory(store, taskId),
  toggleShowAll: (taskId) => toggleShowAll(store, taskId),
  renameTask: (taskId, nextName) => {
    const res = renameTask(store, taskId, nextName);
    if (!res?.ok) {
      if (res?.error === "duplicate") showToast(dom.toastHost, "Ya existe una tarea con ese nombre.", { kind: "error", ms: 4500 });
      else if (res?.error === "too_long") showToast(dom.toastHost, "El nombre es demasiado largo (máx. 80 caracteres).", { kind: "error", ms: 4500 });
      else showToast(dom.toastHost, "Escribe un nombre de tarea válido.", { kind: "error", ms: 4500 });
    }
    return res;
  },
};

function render() {
  renderApp(store.getState(), dom, handlers);
}

let lastTheme = null;
function syncThemeFromState() {
  const theme = store.getState()?.ui?.theme ?? "system";
  if (theme === lastTheme) return;
  lastTheme = theme;
  applyThemePreference(theme);
}

store.subscribe(() => {
  syncThemeFromState();
  render();
});

dom.addTaskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handlers.addTask(dom.taskName.value);
  dom.taskName.value = "";
  dom.taskName.focus();
});

syncThemeFromState();
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
