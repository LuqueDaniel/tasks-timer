import { nowMs, toLocalDateKey } from "./time.js";
import { renderAddTask } from "./app/addTask/addTaskRoot.jsx";
import { renderSummary } from "./app/summary/summaryRoot.jsx";
import { updateRunningTaskCardLive } from "./components/taskCard.js";
import { renderTasks } from "./app/tasks/tasksRoot.jsx";

/** @typedef {import("./types/appTypes.js").DomRefs} DomRefs */
/** @typedef {import("./types/appTypes.js").AppTaskState} AppRenderState */
/** @typedef {import("./types/appTypes.js").RenderHandlers} RenderHandlers */

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
