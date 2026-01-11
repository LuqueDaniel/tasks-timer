function createToastElement(message, { kind = "info" } = {}) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${kind}`;
  toast.dataset.toast = kind;

  // A11y: announce changes without stealing focus.
  if (kind === "error") {
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
  } else {
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
  }

  const text = document.createElement("div");
  text.className = "toast__text";
  text.textContent = message;

  const actions = document.createElement("div");
  actions.className = "toast__actions";

  toast.appendChild(text);
  toast.appendChild(actions);
  return { toast, actions };
}

/**
 * Shows a toast message inside the provided host element.
 */
export function showToast(host, message, { kind = "info", ms = 3500 } = {}) {
  const { toast } = createToastElement(message, { kind });
  host.appendChild(toast);
  window.setTimeout(() => toast.remove(), ms);
}

/**
 * Removes the current undo toast (if any) and clears its countdown timer.
 */
export function removeUndoToast(host) {
  const existing = host.querySelector('[data-toast="undo"]');
  if (existing?.dataset?.intervalId) {
    clearInterval(Number(existing.dataset.intervalId));
  }
  existing?.remove();
}

/**
 * Shows an undo toast with a custom message and countdown label.
 * The toast is not auto-removed here; the caller typically removes it via `removeUndoToast`.
 */
export function showUndoToastMessage(host, message, onUndo, { ms = 8000, undoText = "Deshacer" } = {}) {
  removeUndoToast(host);
  const { toast, actions } = createToastElement(message, { kind: "undo" });

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.className = "btn btn--ghost";
  undoBtn.textContent = undoText;

  const endAt = Date.now() + ms;
  const updateLabel = () => {
    const remaining = Math.max(0, endAt - Date.now());
    const secs = Math.ceil(remaining / 1000);
    undoBtn.textContent = secs > 0 ? `${undoText} (${secs}s)` : undoText;
  };
  updateLabel();
  const intervalId = setInterval(updateLabel, 250);
  toast.dataset.intervalId = String(intervalId);

  undoBtn.addEventListener("click", () => {
    clearInterval(intervalId);
    onUndo();
  });

  actions.appendChild(undoBtn);
  host.appendChild(toast);
}

/**
 * Shows an undo toast with a countdown label.
 * The toast is not auto-removed here; the caller typically removes it via `removeUndoToast`.
 */
export function showUndoToast(host, taskName, onUndo, { ms = 8000 } = {}) {
  showUndoToastMessage(host, `Tarea “${taskName}” borrada.`, onUndo, { ms, undoText: "Deshacer" });
}
