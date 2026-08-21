import { showToast } from "./toast.js";
import { setLanguage, setTheme } from "../model.js";
import { clearStoredState, defaultState, migrateState } from "../storage.js";
import { nowMs, toLocalDateKey } from "../time.js";
import { setLanguage as setI18nLanguage, t } from "../i18n.js";
import { renderSettingsDialog } from "../app/settings/settingsRoot.jsx";

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

/**
 * Wires the settings modal: export/import/delete-all.
 */
export function setupSettingsDialog({ store, dom, invalidatePendingUndo }) {
  let resetToken = 0;

  function renderSettings() {
    const state = store.getState();
    const theme = state?.ui?.theme ?? "system";
    const language = state?.ui?.language === "es" ? "es" : "en";

    renderSettingsDialog({
      dom,
      theme,
      language,
      resetToken,
      onThemeChange: (nextTheme) => {
        setTheme(store, nextTheme);
      },
      onLanguageChange: (nextLanguage) => {
        setLanguage(store, nextLanguage);
        setI18nLanguage(nextLanguage);
      },
      onExport: () => {
        const current = store.getState();
        const exportPayload = {
          app: "task-timer",
          exportedAt: new Date().toISOString(),
          // Running timers are device/time dependent; do not export them.
          state: { ...current, running: null },
        };

        const dateKey = toLocalDateKey(nowMs());
        downloadJson(`task-timer-${dateKey}.json`, exportPayload);
        showToast(dom.toastHost, t("toast.exportCreated"), { kind: "info", ms: 2500 });
      },
      onImportFile: async (file) => {
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
      },
      onDeleteAll: () => {
        invalidatePendingUndo();
        clearStoredState();
        store.replaceState(defaultState(), { persist: false });
        dom.settingsDialog.close();
        showToast(dom.toastHost, t("toast.deletedAll"), { kind: "info", ms: 3000 });
      },
    });
  }

  renderSettings();
  store.subscribe(renderSettings);

  dom.settingsButton.addEventListener("click", () => {
    resetToken += 1;
    renderSettings();
    dom.settingsDialog.showModal();
  });

  dom.settingsDialog.addEventListener("close", () => {
    resetToken += 1;
    renderSettings();
  });

  dom.settingsDialog.addEventListener("click", (e) => {
    // Close on backdrop click.
    if (e.target === dom.settingsDialog) dom.settingsDialog.close();
  });
}
