import { t } from "../i18n.js";

const controllers = new WeakMap();

export function createToastController() {
  let nextId = 0;
  let notifications = [];
  const listeners = new Set();
  const timers = new Map();

  function emit() {
    for (const listener of listeners) listener(notifications);
  }

  function clearTimers(id) {
    const timer = timers.get(id);
    if (!timer) return;
    clearTimeout(timer.timeoutId);
    if (timer.intervalId) clearInterval(timer.intervalId);
    timers.delete(id);
  }

  function remove(id) {
    clearTimers(id);
    notifications = notifications.filter((notification) => notification.id !== id);
    emit();
  }

  function removeUndo() {
    for (const notification of notifications) {
      if (notification.kind === "undo") remove(notification.id);
    }
  }

  function add(notification, ms) {
    const id = ++nextId;
    const entry = { ...notification, id };
    notifications = [...notifications, entry];
    emit();

    const timer = { timeoutId: window.setTimeout(() => remove(id), ms) };
    if (entry.kind === "undo") {
      const endAt = Date.now() + ms;
      timer.intervalId = window.setInterval(() => {
        const remainingSeconds = Math.ceil(Math.max(0, endAt - Date.now()) / 1000);
        notifications = notifications.map((item) =>
          item.id === id ? { ...item, remainingSeconds } : item,
        );
        emit();
      }, 250);
    }
    timers.set(id, timer);
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(notifications);
      return () => listeners.delete(listener);
    },
    add,
    removeUndo,
    undo(id) {
      const notification = notifications.find((item) => item.id === id);
      if (!notification?.onUndo) return;
      remove(id);
      notification.onUndo();
    },
    destroy() {
      for (const id of timers.keys()) clearTimers(id);
      listeners.clear();
      notifications = [];
    },
  };
}

function getController(host) {
  let controller = controllers.get(host);
  if (!controller) {
    controller = createToastController();
    controllers.set(host, controller);
  }
  return controller;
}

/** Mounts the state-driven Preact notification host. */
export function mountToastHost(host, controller = createToastController()) {
  controllers.set(host, controller);
}

/** Shows a toast message inside the provided host element. */
export function showToast(host, message, { kind = "info", ms = 3500 } = {}) {
  getController(host).add({ kind, message }, ms);
}

/** Removes the current undo toast (if any) and clears its timers. */
export function removeUndoToast(host) {
  getController(host).removeUndo();
}

/** Shows an undo toast with a custom message and countdown label. */
export function showUndoToastMessage(
  host,
  message,
  onUndo,
  { ms = 8000, undoText = t("common.undo") } = {},
) {
  const controller = getController(host);
  controller.removeUndo();
  controller.add(
    { kind: "undo", message, onUndo, undoText, remainingSeconds: Math.ceil(ms / 1000) },
    ms,
  );
}

/** Shows an undo toast for a deleted task. */
export function showUndoToast(host, taskName, onUndo, { ms = 8000 } = {}) {
  showUndoToastMessage(host, t("toast.taskDeleted", { name: taskName }), onUndo, {
    ms,
    undoText: t("common.undo"),
  });
}
