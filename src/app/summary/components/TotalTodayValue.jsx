import { formatHMS } from "../../../time.js";
import { computeTotalToday } from "../../../model.js";

/**
 * @typedef TotalTodayValueProps
 * @property {object} state
 * @property {string} todayKey
 * @property {number} now
 */

/** @param {TotalTodayValueProps} props */
export function TotalTodayValue({ state, todayKey, now }) {
  const totalSecs = computeTotalToday(state, todayKey, now);
  return formatHMS(totalSecs);
}
