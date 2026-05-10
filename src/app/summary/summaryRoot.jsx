import { render } from "preact";
import { TodayChip } from "./components/TodayChip.jsx";
import { TotalTodayValue } from "./components/TotalTodayValue.jsx";
import { RunningHint } from "./components/RunningHint.jsx";

/** @typedef {ReturnType<import("../../dom.js").getDom>} DomRefs */

/**
 * @typedef SummaryRenderArgs
 * @property {object} state
 * @property {DomRefs} dom
 * @property {number} now
 * @property {string} todayKey
 */

/** @param {SummaryRenderArgs} params */
export function renderSummary({ state, dom, now, todayKey }) {
  render(<TodayChip todayKey={todayKey} />, dom.todayChip);
  render(<TotalTodayValue state={state} todayKey={todayKey} now={now} />, dom.totalToday);
  render(<RunningHint state={state} />, dom.runningHint);
}
