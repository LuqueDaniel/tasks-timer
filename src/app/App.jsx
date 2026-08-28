import { useEffect, useRef, useState } from "preact/hooks";
import { AddTaskRoot } from "./addTask/addTaskRoot.jsx";
import { SettingsRoot } from "./settings/settingsRoot.jsx";
import { renderSummary } from "./summary/summaryRoot.jsx";
import { TasksRoot } from "./tasks/tasksRoot.jsx";
import { ToastHost } from "../components/ToastHost.jsx";
import { t } from "../i18n.js";
import { formatDateKeyForUser, nowMs, toLocalDateKey } from "../time.js";

/** @param {{ store: object, handlers: object, settings: object, toastController: object }} props */
export function App({ store, handlers, settings, toastController }) {
  const [, refresh] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const dialogRef = useRef(null);
  const state = store.getState();
  const now = nowMs();
  const todayKey = toLocalDateKey(now);

  useEffect(() => store.subscribe(() => refresh((value) => value + 1)), [store]);

  useEffect(() => {
    if (!state.running) return undefined;
    const intervalId = window.setInterval(() => refresh((value) => value + 1), 1000);
    return () => window.clearInterval(intervalId);
  }, [store, state.running]);

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

  const summary = renderSummary({ state, now, todayKey });

  return (
    <>
      <header className="app-header">
        <div className="app-header__title">
          <h1>Task Timer</h1>
        </div>
        <div className="app-header__meta">
          <div className="meta-chip" id="todayChip" aria-label={t("header.todayAria")}>
            {t("summary.todayChip", { date: formatDateKeyForUser(todayKey) })}
          </div>
          <button
            className="btn btn--ghost btn--icon"
            id="settingsButton"
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
        <section className="summary" aria-labelledby="summaryTitle">
          <h2 id="summaryTitle">{t("summary.title")}</h2>
          <div className="summary__grid">
            <div className="summary-card">
              <div className="summary-card__label">{t("summary.totalToday")}</div>
              <div className="summary-card__value" id="totalToday">
                {summary.total}
              </div>
              <div className="summary-card__hint muted" id="runningHint">
                {summary.hint}
              </div>
            </div>
          </div>
        </section>
        <section className="add-task" aria-labelledby="addTaskTitle">
          <div id="addTaskRoot">
            <AddTaskRoot handlers={handlers} />
          </div>
        </section>
        <section>
          <div id="tasksRoot">
            <TasksRoot state={state} handlers={handlers} now={now} todayKey={todayKey} />
          </div>
        </section>
      </main>

      <dialog className="modal" id="settingsDialog" ref={dialogRef} aria-labelledby="settingsTitle">
        <div className="modal__header">
          <h2 id="settingsTitle">{t("settings.title")}</h2>
          <form method="dialog">
            <button
              className="btn btn--ghost btn--icon"
              id="settingsClose"
              value="cancel"
              type="submit"
              aria-label={t("header.close")}
              title={t("header.close")}
            >
              <span className="icon icon--close" aria-hidden="true" />
            </button>
          </form>
        </div>
        <div id="settingsRoot">
          <SettingsRoot state={state} resetToken={resetToken} settings={settings} />
        </div>
      </dialog>

      <div id="toastHost" className="toast-host" aria-live="polite" aria-atomic="true">
        <ToastHost controller={toastController} />
      </div>
    </>
  );
}
