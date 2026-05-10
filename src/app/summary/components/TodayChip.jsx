import { formatDateKeyForUser } from "../../../time.js";
import { t } from "../../../i18n.js";

/**
 * @typedef TodayChipProps
 * @property {string} todayKey
 */

/** @param {TodayChipProps} props */
export function TodayChip({ todayKey }) {
  return t("summary.todayChip", { date: formatDateKeyForUser(todayKey) });
}
