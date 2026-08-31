import { TasksSection } from "./views/TasksSection.jsx";

/** @typedef {import("../../types/appTypes.js").TaskHandlers} TasksHandlers */
/** @typedef {import("../../types/appTypes.js").AppTaskState} TasksState */

/**
 * @typedef TasksRootProps
 * @property {TasksState} state
 * @property {TasksHandlers} handlers
 * @property {number} now
 * @property {string} todayKey
 */

/** @param {TasksRootProps} params */
export { TasksRoot };

/**
 * Renders the task section using the clock managed by the application root.
 */
function TasksRoot({ state, handlers, now, todayKey }) {
  return <TasksSection state={state} handlers={handlers} now={now} todayKey={todayKey} />;
}
