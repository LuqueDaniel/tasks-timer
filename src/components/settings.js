import { showToast } from "./toast.js";
import { setLanguage, setTheme } from "../model.js";
import { clearStoredState, defaultState, migrateState } from "../storage.js";
import { nowMs, toLocalDateKey } from "../time.js";
import { applyTranslations, setLanguage as setI18nLanguage, t } from "../i18n.js";

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
    .toLocaleUpperCase(storeLocale(dom));
  const required = String(t("settings.deleteConfirmWord")).toLocaleUpperCase(storeLocale(dom));
  dom.settingsDelete.disabled = typed !== required;
}

function storeLocale(dom) {
  const lang = dom.settingsLanguage?.value === "es" ? "es-ES" : "en-US";
  return lang;
}

function syncSettingsI18n(dom) {
  applyTranslations(dom.settingsDialog);

  dom.settingsDeleteConfirmLabel.innerHTML = `${t("settings.deleteConfirmLabel", {
    word: `<strong>${t("settings.deleteConfirmWord")}</strong>`,
  })}`;
  dom.settingsDeleteConfirm.setAttribute("placeholder", t("settings.deleteConfirmPlaceholder"));
}

/**
 * Wires the settings modal: export/import/delete-all.
 */
export function setupSettingsDialog({ store, dom, invalidatePendingUndo }) {
  dom.settingsButton.addEventListener("click", () => {
    resetDeleteConfirmation(dom);
    dom.settingsTheme.value = store.getState()?.ui?.theme ?? "system";
    dom.settingsLanguage.value = store.getState()?.ui?.language ?? "en";
    syncSettingsI18n(dom);
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

  dom.settingsLanguage.addEventListener("change", () => {
    setLanguage(store, dom.settingsLanguage.value);
    setI18nLanguage(dom.settingsLanguage.value);
    syncSettingsI18n(dom);
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
    showToast(dom.toastHost, t("toast.exportCreated"), { kind: "info", ms: 2500 });
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
      showToast(dom.toastHost, t("toast.imported"), { kind: "info", ms: 3000 });
    } catch (err) {
      console.error("[Task Timer] Failed to import JSON", err);
      showToast(dom.toastHost, t("toast.importFailed"), { kind: "error", ms: 4500 });
    }
  });

  dom.settingsDelete.addEventListener("click", () => {
    if (dom.settingsDelete.disabled) return;

    invalidatePendingUndo();
    clearStoredState();
    store.replaceState(defaultState(), { persist: false });
    dom.settingsDialog.close();
    showToast(dom.toastHost, t("toast.deletedAll"), { kind: "info", ms: 3000 });
  });
}
