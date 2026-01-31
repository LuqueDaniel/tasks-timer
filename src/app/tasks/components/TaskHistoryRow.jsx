import { formatDateKeyForUser, formatDecimalHours, formatHMS } from "../../../time.js";
import { t } from "../../../i18n.js";
import { useCallback } from "preact/hooks";
import { memo } from "preact/compat";

function TaskHistoryRowBase({ taskId, dateKey, seconds, handlers }) {
  const onDelete = useCallback(() => {
    handlers.deleteHistoryEntry(taskId, dateKey);
  }, [handlers, taskId, dateKey]);

  return (
    <div className="history-row">
      <div className="history-row__date">{formatDateKeyForUser(dateKey)}</div>
      <div className="history-row__actions">
        <div className="history-row__time">
          {`${formatHMS(seconds)} (${formatDecimalHours(seconds)}h)`}
        </div>
        <button
          type="button"
          className="btn btn--danger btn--icon history-row__delete"
          aria-label={t("task.deleteHistoryEntryAria")}
          title={t("task.deleteTitle")}
          onClick={onDelete}
        >
          <span className="icon icon--trash" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export const TaskHistoryRow = memo(TaskHistoryRowBase);
