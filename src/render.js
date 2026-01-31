import { nowMs, toLocalDateKey } from "./time.js";
import { updateSummary } from "./components/summary.js";
import { updateRunningTaskCardLive } from "./components/taskCard.js";
import { renderTasks, unmountTasks } from "./app/tasks/tasksRoot.jsx";

/**
 * Full render: rebuilds the tasks list (used on mutations and day changes).
 */
export function renderApp(state, dom, handlers) {
  const now = nowMs();
  const todayKey = toLocalDateKey(now);

  updateSummary(state, dom, now, todayKey);

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
 */
export function renderLive(state, dom) {
  const now = nowMs();
  const todayKey = toLocalDateKey(now);
  updateSummary(state, dom, now, todayKey);
  updateRunningTaskCardLive(state, dom, now, todayKey);
}
