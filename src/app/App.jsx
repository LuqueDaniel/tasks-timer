import { useEffect, useRef, useState } from "preact/hooks";
import { AddTaskFields } from "./addTask/components/AddTaskFields.jsx";
import { SettingsRoot } from "./settings/settingsRoot.jsx";
import { SummaryRoot } from "./summary/summaryRoot.jsx";
import { TasksSection } from "./tasks/views/TasksSection.jsx";
import { ToastHost } from "../components/ToastHost.jsx";
import { setLanguage as setI18nLanguage, t } from "../i18n.js";
import { applyThemePreference } from "../theme.js";
import { formatDateKeyForUser, nowMs, startOfNextLocalDayMs, toLocalDateKey } from "../time.js";

/** @param {{ store: object, handlers: object, settings: object, toastController: object }} props */
export function App({ store, handlers, settings, toastController }) {
  const [, refresh] = useState(0);
  const [todayKey, setTodayKey] = useState(() => toLocalDateKey(nowMs()));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const dialogRef = useRef(null);
  const state = store.getState();
  useEffect(() => store.subscribe(() => refresh((value) => value + 1)), [store]);

  useEffect(() => {
    const updateDay = () => setTodayKey(toLocalDateKey(nowMs()));
    const dayTimeoutId = window.setTimeout(
      updateDay,
      Math.max(0, startOfNextLocalDayMs(nowMs()) - nowMs() + 1),
    );
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") updateDay();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(dayTimeoutId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [todayKey]);

  useEffect(() => {
    applyThemePreference(state.ui?.theme ?? "system");
    const language = state.ui?.language === "es" ? "es" : "en";
    setI18nLanguage(language);
    refresh((value) => value + 1);
  }, [state.ui?.theme, state.ui?.language]);

  useEffect(() => {
    const onBeforeUnload = () => store.persist();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [store]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (settingsOpen && !dialog.open) dialog.showModal();
    if (!settingsOpen && dialog.open) dialog.close();
    const onClose = () => {
      setSettingsOpen(false);
      setResetToken((value) => value + 1);
    };
    const closeOnBackdrop = (event) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("click", closeOnBackdrop);
    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("click", closeOnBackdrop);
    };
  }, [settingsOpen]);

  const addTaskInputRef = useRef(null);

  return (
    <>
      <header className="app-header">
        <div className="app-header__title">
          <h1>Task Timer</h1>
        </div>
        <div className="app-header__meta">
          <div className="meta-chip" aria-label={t("header.todayAria")}>
            {t("summary.todayChip", { date: formatDateKeyForUser(todayKey) })}
          </div>
          <button
            className="btn btn--ghost btn--icon"
            type="button"
            aria-label={t("header.settings")}
            title={t("header.settings")}
            onClick={() => setSettingsOpen(true)}
          >
            <span className="icon icon--settings" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="app">
        <SummaryRoot state={state} todayKey={todayKey} />
        <section className="add-task" aria-labelledby="addTaskTitle">
          <AddTaskFields handlers={handlers} inputRef={addTaskInputRef} />
        </section>
        <section>
          <TasksSection state={state} handlers={handlers} todayKey={todayKey} />
        </section>
      </main>

      <dialog className="modal" ref={dialogRef} aria-labelledby="settingsTitle">
        <div className="modal__header">
          <h2 id="settingsTitle">{t("settings.title")}</h2>
          <form method="dialog">
            <button
              className="btn btn--ghost btn--icon"
              value="cancel"
              type="submit"
              aria-label={t("header.close")}
              title={t("header.close")}
            >
              <span className="icon icon--close" aria-hidden="true" />
            </button>
          </form>
        </div>
        <SettingsRoot
          state={state}
          resetToken={resetToken}
          settings={{
            ...settings,
            onImportFile: async (file) => {
              if (await settings.onImportFile(file)) setSettingsOpen(false);
            },
            onDeleteAll: () => {
              settings.onDeleteAll();
              setSettingsOpen(false);
            },
          }}
        />
      </dialog>

      <div className="toast-host" aria-live="polite" aria-atomic="true">
        <ToastHost controller={toastController} />
      </div>
    </>
  );
}
