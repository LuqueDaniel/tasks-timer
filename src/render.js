import { nowMs, toLocalDateKey } from "./time.js?v=20260111-3";
import { updateSummary } from "./components/summary.js?v=20260111-3";
import { createTaskCard, updateRunningTaskCardLive } from "./components/taskCard.js?v=20260111-3";

/**
 * Full render: rebuilds the tasks list (used on mutations and day changes).
 */
export function renderApp(state, dom, handlers) {
  const now = nowMs();
  const todayKey = toLocalDateKey(now);

  updateSummary(state, dom, now, todayKey);

  dom.tasksList.innerHTML = "";

  if (state.tasks.length === 0) {
    dom.tasksEmpty.hidden = false;
    return;
  }
  dom.tasksEmpty.hidden = true;

  for (const task of state.tasks) {
    const node = createTaskCard({
      state,
      task,
      now,
      todayKey,
      handlers,
      template: dom.taskTemplate,
    });
    dom.tasksList.appendChild(node);
  }
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
