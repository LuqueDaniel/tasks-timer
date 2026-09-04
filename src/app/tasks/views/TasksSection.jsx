import { t } from "../../../i18n.js";
import { TaskList } from "./TaskList.jsx";
import { TasksEmptyState } from "../components/TasksEmptyState.jsx";

/**
 * @typedef TasksSectionProps
 * @property {{ tasks: Array<unknown> }} state
 * @property {object} handlers
 * @property {string} todayKey
 */

/** @param {TasksSectionProps} props */
export function TasksSection({ state, handlers, todayKey }) {
  return (
    <section aria-label={t("tasks.listAria")}>
      {state.tasks.length === 0 ? (
        <TasksEmptyState />
      ) : (
        <div className="tasks">
          <TaskList state={state} handlers={handlers} todayKey={todayKey} />
        </div>
      )}
    </section>
  );
}
