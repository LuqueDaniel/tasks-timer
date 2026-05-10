import { render } from "preact";
import { TasksSection } from "./views/TasksSection.jsx";

/** @typedef {import("../../types/appTypes.js").DomRefs} DomRefs */
/** @typedef {import("../../types/appTypes.js").TaskHandlers} TasksHandlers */
/** @typedef {import("../../types/appTypes.js").AppTaskState} TasksState */

/**
 * @typedef RenderTasksArgs
 * @property {TasksState} state
 * @property {DomRefs} dom
 * @property {TasksHandlers} handlers
 * @property {number} now
 * @property {string} todayKey
 */

/** @param {RenderTasksArgs} params */
export function renderTasks({ state, dom, handlers, now, todayKey }) {
  render(
    <TasksSection state={state} handlers={handlers} now={now} todayKey={todayKey} />,
    dom.tasksRoot,
  );
}

/** @param {DomRefs} dom */
export function unmountTasks(dom) {
  render(null, dom.tasksRoot);
}
