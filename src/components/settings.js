import { showToast } from "./toast.js?v=20260111-4";
import { setTheme } from "../model.js?v=20260111-4";
import { clearStoredState, defaultState, migrateState } from "../storage.js?v=20260111-4";
import { nowMs, toLocalDateKey } from "../time.js?v=20260111-4";

const REQUIRED_DELETE_CONFIRM = "BORRAR";

function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function resetDeleteConfirmation(dom) {
  dom.settingsDeleteConfirm.value = "";
  dom.settingsDelete.disabled = true;
}

function updateDeleteButtonState(dom) {
  const typed = String(dom.settingsDeleteConfirm.value ?? "")
    .trim()
    .toLocaleUpperCase("es-ES");
  dom.settingsDelete.disabled = typed !== REQUIRED_DELETE_CONFIRM;
}

/**
 * Wires the settings modal: export/import/delete-all.
 */
export function setupSettingsDialog({ store, dom, invalidatePendingUndo }) {
  dom.settingsButton.addEventListener("click", () => {
    resetDeleteConfirmation(dom);
    dom.settingsTheme.value = store.getState()?.ui?.theme ?? "system";
    dom.settingsDialog.showModal();
  });

  dom.settingsDialog.addEventListener("close", () => {
    resetDeleteConfirmation(dom);
  });

  dom.settingsDialog.addEventListener("click", (e) => {
    // Close on backdrop click.
    if (e.target === dom.settingsDialog) dom.settingsDialog.close();
  });

  dom.settingsDeleteConfirm.addEventListener("input", () => updateDeleteButtonState(dom));

  dom.settingsTheme.addEventListener("change", () => {
    setTheme(store, dom.settingsTheme.value);
  });

  dom.settingsExport.addEventListener("click", () => {
    const state = store.getState();
    const exportPayload = {
      app: "task-timer",
      exportedAt: new Date().toISOString(),
      // Running timers are device/time dependent; do not export them.
      state: { ...state, running: null },
    };

    const dateKey = toLocalDateKey(nowMs());
    downloadJson(`task-timer-${dateKey}.json`, exportPayload);
    showToast(dom.toastHost, "Exportación creada.", { kind: "info", ms: 2500 });
  });

  dom.settingsImport.addEventListener("click", () => {
    dom.settingsImportInput.click();
  });

  dom.settingsImportInput.addEventListener("change", async () => {
    const file = dom.settingsImportInput.files?.[0];
    dom.settingsImportInput.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawState = parsed?.app === "task-timer" && parsed?.state ? parsed.state : parsed;

      const nextState = migrateState(rawState);
      nextState.running = null;

      invalidatePendingUndo();
      store.replaceState(nextState);
      dom.settingsDialog.close();
      showToast(dom.toastHost, "Datos importados.", { kind: "info", ms: 3000 });
    } catch {
      showToast(dom.toastHost, "No se pudo importar el JSON.", { kind: "error", ms: 4500 });
    }
  });

  dom.settingsDelete.addEventListener("click", () => {
    if (dom.settingsDelete.disabled) return;

    invalidatePendingUndo();
    clearStoredState();
    store.replaceState(defaultState(), { persist: false });
    dom.settingsDialog.close();
    showToast(dom.toastHost, "Datos eliminados.", { kind: "info", ms: 3000 });
  });
}
