import { t } from "../../../i18n.js";
import { TaskList } from "./TaskList.jsx";
import { TasksEmptyState } from "../components/TasksEmptyState.jsx";

/**
 * @typedef TasksSectionProps
 * @property {{ tasks: Array<unknown> }} state
 * @property {object} handlers
 * @property {number} now
 * @property {string} todayKey
 */

/** @param {TasksSectionProps} props */
export function TasksSection({ state, handlers, now, todayKey }) {
  return (
    <section aria-label={t("tasks.listAria")}>
      {state.tasks.length === 0 ? (
        <TasksEmptyState />
      ) : (
        <div id="tasksList" className="tasks">
          <TaskList state={state} handlers={handlers} now={now} todayKey={todayKey} />
        </div>
      )}
    </section>
  );
}
