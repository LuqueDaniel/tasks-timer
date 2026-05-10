import { getTask } from "../../../model.js";
import { t } from "../../../i18n.js";

/**
 * @typedef RunningState
 * @property {{ taskId: string, startedAt: number } | null} [running]
 */

/**
 * @typedef RunningHintProps
 * @property {RunningState} state
 */

/** @param {RunningHintProps} props */
export function RunningHint({ state }) {
  if (!state.running) return "";

  const task = getTask(state, state.running.taskId);
  return task ? t("summary.runningTask", { task: task.name }) : t("summary.runningGeneric");
}
