import { formatHMS } from "../../../time.js";
import { taskTodaySeconds, taskTotalSecondsLive } from "../../../model.js";
import { t } from "../../../i18n.js";
import { useCallback } from "preact/hooks";
import { TaskHistory } from "./TaskHistory.jsx";

export function TaskCard({ state, task, now, todayKey, handlers }) {
  const todaySecs = taskTodaySeconds(state, task, todayKey, now);
  const totalSecs = taskTotalSecondsLive(state, task, now);
  const isRunning = state.running?.taskId === task.id;

  const expanded = Boolean(state.ui.expanded?.[task.id]);
  const showAll = Boolean(state.ui.showAllHistory?.[task.id]);
  const historyId = `history_${task.id}`;

  const requestRename = useCallback(() => {
    const next = prompt(t("dialogs.renamePrompt"), task.name);
    if (next == null) return;
    handlers.renameTask(task.id, next);
  }, [handlers, task.id, task.name]);

  const requestDeleteTask = useCallback(() => {
    const ok = confirm(t("dialogs.confirmDeleteTask", { name: task.name }));
    if (ok) handlers.deleteTask(task.id);
  }, [handlers, task.id, task.name]);

  const onRunClick = useCallback(() => {
    if (isRunning) handlers.stopRunning();
    else handlers.startTask(task.id);
  }, [handlers, isRunning, task.id]);

  const onToggleHistory = useCallback(() => {
    handlers.toggleHistory(task.id);
  }, [handlers, task.id]);

  return (
    <article className="task" data-task-id={task.id}>
      <div className="task__top">
        <div className="task__title">
          <h3 className="task__name">{task.name}</h3>
          <div className="task__sub muted">
            <span className="task__today" hidden={todaySecs <= 0} title={t("task.timeTodayTitle")}>
              {todaySecs <= 0 ? "" : t("task.today", { time: formatHMS(todaySecs) })}
            </span>
            <span className="dot" hidden={todaySecs <= 0}>
              •
            </span>
            <span className="task__total" title={t("task.timeTotalTitle")}>
              {t("task.total", { time: formatHMS(totalSecs) })}
            </span>
          </div>
        </div>

        <div className="task__actions">
          <button
            className="btn btn--ghost btn--icon task__edit"
            type="button"
            aria-label={t("task.rename")}
            title={t("task.rename")}
            onClick={requestRename}
          >
            <span className="icon icon--edit" aria-hidden="true" />
          </button>
          <button
            className="btn btn--danger btn--icon task__delete"
            type="button"
            aria-label={t("task.delete")}
            title={t("task.delete")}
            onClick={requestDeleteTask}
          >
            <span className="icon icon--trash" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="task__controls">
        <div className="task__controlsRow">
          <button
            className={
              isRunning ? "btn btn--stop btn--icon task__run" : "btn btn--start btn--icon task__run"
            }
            type="button"
            aria-label={isRunning ? t("task.stop") : t("task.start")}
            title={isRunning ? t("task.stop") : t("task.start")}
            onClick={onRunClick}
          >
            <span
              className={isRunning ? "icon icon--stop" : "icon icon--play"}
              aria-hidden="true"
            />
          </button>

          <button
            className="btn btn--ghost task__toggle"
            type="button"
            aria-expanded={expanded ? "true" : "false"}
            aria-controls={historyId}
            onClick={onToggleHistory}
          >
            <span>{t("task.history")}</span>
          </button>
        </div>

        <div className="task__running muted" hidden={!isRunning} aria-live="polite">
          {isRunning
            ? t("task.running", {
                time: formatHMS(Math.max(0, Math.round((now - state.running.startedAt) / 1000))),
              })
            : ""}
        </div>
      </div>

      <TaskHistory
        state={state}
        task={task}
        expanded={expanded}
        showAll={showAll}
        handlers={handlers}
      />
    </article>
  );
}
