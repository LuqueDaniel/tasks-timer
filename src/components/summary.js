import { formatDateKeyForUser, formatHMS } from "../time.js";
import { computeTotalToday, getTask } from "../model.js";
import { t } from "../i18n.js";

/**
 * Updates the summary UI (today chip, total today, and running hint).
 * Used by both full render and the 1s tick.
 */
export function updateSummary(state, dom, now, todayKey) {
  dom.todayChip.textContent = t("summary.todayChip", { date: formatDateKeyForUser(todayKey) });

  const totalSecs = computeTotalToday(state, todayKey, now);
  dom.totalToday.textContent = formatHMS(totalSecs);

  if (state.running) {
    const task = getTask(state, state.running.taskId);
    dom.runningHint.textContent = task
      ? t("summary.runningTask", { task: task.name })
      : t("summary.runningGeneric");
  } else {
    dom.runningHint.textContent = "";
  }
}
