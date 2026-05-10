import { nowMs, toLocalDateKey } from "./time.js";
import { renderAddTask } from "./app/addTask/addTaskRoot.jsx";
import { renderSummary } from "./app/summary/summaryRoot.jsx";
import { updateRunningTaskCardLive } from "./components/taskCard.js";
import { renderTasks, unmountTasks } from "./app/tasks/tasksRoot.jsx";

/** @typedef {ReturnType<import("./dom.js").getDom>} DomRefs */

/**
 * @typedef AppRenderState
 * @property {Array<unknown>} tasks
 * @property {unknown} running
 */

/**
 * @typedef RenderHandlers
 * @property {(name: string) => unknown} addTask
 * @property {(taskId: string) => unknown} startTask
 * @property {() => unknown} stopRunning
 * @property {(taskId: string) => unknown} deleteTask
 * @property {(taskId: string, dateKey: string) => unknown} deleteHistoryEntry
 * @property {(taskId: string) => unknown} toggleHistory
 * @property {(taskId: string) => unknown} toggleShowAll
 * @property {(taskId: string, nextName: string) => unknown} renameTask
 */

/**
 * Full render: rebuilds the tasks list (used on mutations and day changes).
 *
 * @param {AppRenderState} state
 * @param {DomRefs} dom
 * @param {RenderHandlers} handlers
 */
export function renderApp(state, dom, handlers) {
  const now = nowMs();
  const todayKey = toLocalDateKey(now);

  renderAddTask({ dom, handlers });
  renderSummary({ state, dom, now, todayKey });

  if (state.tasks.length === 0) {
    dom.tasksEmpty.hidden = false;
    unmountTasks(dom);
    return;
  }
  dom.tasksEmpty.hidden = true;

  renderTasks({ state, dom, handlers, now, todayKey });
}

/**
 * Lightweight 1s tick update: avoids rebuilding the full task list.
 *
 * @param {AppRenderState} state
 * @param {DomRefs} dom
 */
export function renderLive(state, dom) {
  const now = nowMs();
  const todayKey = toLocalDateKey(now);
  renderSummary({ state, dom, now, todayKey });
  updateRunningTaskCardLive(state, dom, now, todayKey);
}
