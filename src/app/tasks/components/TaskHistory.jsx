import { t } from "../../../i18n.js";
import { useCallback, useMemo } from "preact/hooks";
import { useSortedHistoryEntries } from "../hooks/useSortedHistoryEntries.js";
import { TaskHistoryRow } from "./TaskHistoryRow.jsx";

export function TaskHistory({ state, task, expanded, showAll, handlers }) {
  const allEntries = useSortedHistoryEntries(task);
  const visibleEntries = useMemo(
    () => (showAll ? allEntries : allEntries.slice(0, 7)),
    [showAll, allEntries],
  );
  const historyId = `history_${task.id}`;

  const onToggleShowAll = useCallback(() => {
    handlers.toggleShowAll(task.id);
  }, [handlers, task.id]);

  return (
    <div
      className="task__history"
      id={historyId}
      hidden={!expanded}
      aria-label={t("task.historyAria", { task: task.name })}
    >
      <div className="history__header">
        <div className="muted">{t("task.historyByDay")}</div>
        <button
          className="btn btn--ghost task__showAll"
          type="button"
          hidden={allEntries.length <= 7}
          onClick={onToggleShowAll}
        >
          {showAll ? t("task.showLess") : t("task.showAll")}
        </button>
      </div>

      <div className="history__list">
        {visibleEntries.length === 0 ? (
          <p className="muted">{t("task.noTimeYet")}</p>
        ) : (
          visibleEntries.map(([dateKey, secs]) => (
            <TaskHistoryRow
              key={dateKey}
              taskId={task.id}
              dateKey={dateKey}
              seconds={secs}
              handlers={handlers}
            />
          ))
        )}
      </div>
    </div>
  );
}
