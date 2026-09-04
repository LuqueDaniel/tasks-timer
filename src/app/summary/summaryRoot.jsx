import { TotalTodayValue } from "./components/TotalTodayValue.jsx";
import { RunningHint } from "./components/RunningHint.jsx";
import { t } from "../../i18n.js";
import { useLiveNow } from "../hooks/useLiveNow.js";

/** @param {{ state: object, todayKey: string }} props */
export function SummaryRoot({ state, todayKey }) {
  const now = useLiveNow(Boolean(state.running));
  return (
    <section className="summary" aria-labelledby="summaryTitle">
      <h2 id="summaryTitle">{t("summary.title")}</h2>
      <div className="summary__grid">
        <div className="summary-card">
          <div className="summary-card__label">{t("summary.totalToday")}</div>
          <div className="summary-card__value">
            <TotalTodayValue state={state} todayKey={todayKey} now={now} />
          </div>
          <div className="summary-card__hint muted">
            <RunningHint state={state} />
          </div>
        </div>
      </div>
    </section>
  );
}
