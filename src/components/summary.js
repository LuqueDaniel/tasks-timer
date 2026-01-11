import { formatDateKeyForUser, formatHMS } from "../time.js?v=20260111-3";
import { computeTotalToday, getTask } from "../model.js?v=20260111-3";

/**
 * Updates the summary UI (today chip, total today, and running hint).
 * Used by both full render and the 1s tick.
 */
export function updateSummary(state, dom, now, todayKey) {
  dom.todayChip.textContent = `Hoy · ${formatDateKeyForUser(todayKey)}`;

  const totalSecs = computeTotalToday(state, todayKey, now);
  dom.totalToday.textContent = formatHMS(totalSecs);

  if (state.running) {
    const task = getTask(state, state.running.taskId);
    dom.runningHint.textContent = task ? `En marcha: ${task.name}` : "Temporizador en marcha";
  } else {
    dom.runningHint.textContent = "";
  }
}
