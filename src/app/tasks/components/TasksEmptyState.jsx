import { t } from "../../../i18n.js";

/** @returns {import("preact").ComponentChildren} */
export function TasksEmptyState() {
  return (
    <div className="empty-state">
      <p>
        <strong>{t("tasks.emptyTitle")}</strong>
      </p>
      <p className="muted">{t("tasks.emptyBody", { start: t("task.start") })}</p>
    </div>
  );
}
