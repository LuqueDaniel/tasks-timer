import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { showToast } from "../../components/toast.js";
import { setLanguage, setTheme } from "../../model.js";
import { clearStoredState, defaultState, migrateState } from "../../storage.js";
import { nowMs, toLocalDateKey } from "../../time.js";
import { setLanguage as setI18nLanguage, t } from "../../i18n.js";
import { SettingsDialogContent } from "./components/SettingsDialogContent.jsx";

/** @typedef {import("../../types/appTypes.js").DomRefs} DomRefs */

/**
 * @typedef SettingsRootProps
 * @property {DomRefs} dom
 * @property {ReturnType<import("../../store.js").createStore>} store
 * @property {() => void} invalidatePendingUndo
 */

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** @param {SettingsRootProps} props */
function SettingsRoot({ dom, store, invalidatePendingUndo }) {
  const [resetToken, setResetToken] = useState(0);
  const [, refresh] = useState(0);

  useEffect(() => store.subscribe(() => refresh((value) => value + 1)), [store]);

  useEffect(() => {
    const open = () => {
      setResetToken((value) => value + 1);
      dom.settingsDialog.showModal();
    };
    const reset = () => setResetToken((value) => value + 1);
    const closeOnBackdrop = (event) => {
      if (event.target === dom.settingsDialog) dom.settingsDialog.close();
    };

    dom.settingsButton.addEventListener("click", open);
    dom.settingsDialog.addEventListener("close", reset);
    dom.settingsDialog.addEventListener("click", closeOnBackdrop);
    return () => {
      dom.settingsButton.removeEventListener("click", open);
      dom.settingsDialog.removeEventListener("close", reset);
      dom.settingsDialog.removeEventListener("click", closeOnBackdrop);
    };
  }, [dom]);

  const state = store.getState();
  const theme = state?.ui?.theme ?? "system";
  const language = state?.ui?.language === "es" ? "es" : "en";

  const onExport = () => {
    const current = store.getState();
    downloadJson(`task-timer-${toLocalDateKey(nowMs())}.json`, {
      app: "task-timer",
      exportedAt: new Date().toISOString(),
      // Running timers are device/time dependent; do not export them.
      state: { ...current, running: null },
    });
    showToast(dom.toastHost, t("toast.exportCreated"), { kind: "info", ms: 2500 });
  };

  const onImportFile = async (file) => {
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
  };

  const onDeleteAll = () => {
    invalidatePendingUndo();
    clearStoredState();
    store.replaceState(defaultState(), { persist: false });
    dom.settingsDialog.close();
    showToast(dom.toastHost, t("toast.deletedAll"), { kind: "info", ms: 3000 });
  };

  return (
    <SettingsDialogContent
      theme={theme}
      language={language}
      resetToken={resetToken}
      onThemeChange={(nextTheme) => setTheme(store, nextTheme)}
      onLanguageChange={(nextLanguage) => {
        setLanguage(store, nextLanguage);
        setI18nLanguage(nextLanguage);
      }}
      onExport={onExport}
      onImportFile={onImportFile}
      onDeleteAll={onDeleteAll}
    />
  );
}

/** @param {SettingsRootProps} props */
export function renderSettingsDialog(props) {
  render(<SettingsRoot {...props} />, props.dom.settingsRoot);
}

export { SettingsRoot };
