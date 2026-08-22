import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { TasksSection } from "./views/TasksSection.jsx";
import { nowMs } from "../../time.js";

/** @typedef {import("../../types/appTypes.js").DomRefs} DomRefs */
/** @typedef {import("../../types/appTypes.js").TaskHandlers} TasksHandlers */
/** @typedef {import("../../types/appTypes.js").AppTaskState} TasksState */

/**
 * @typedef RenderTasksArgs
 * @property {TasksState} state
 * @property {DomRefs} dom
 * @property {TasksHandlers} handlers
 * @property {number} now
 * @property {string} todayKey
 */

/** @param {RenderTasksArgs} params */
export function renderTasks({ state, dom, handlers, now, todayKey }) {
  render(
    <TasksRoot state={state} handlers={handlers} now={now} todayKey={todayKey} />,
    dom.tasksRoot,
  );
}

/**
 * Keeps the live timer inside Preact. The parent still controls full renders,
 * while this root refreshes its clock only while a task is running.
 */
function TasksRoot({ state, handlers, now, todayKey }) {
  const [clockNow, setClockNow] = useState(now);

  useEffect(() => {
    setClockNow(now);
    if (!state.running) return undefined;

    const intervalId = window.setInterval(() => setClockNow(nowMs()), 1000);
    return () => window.clearInterval(intervalId);
  }, [now, state.running, todayKey]);

  return <TasksSection state={state} handlers={handlers} now={clockNow} todayKey={todayKey} />;
}

/** @param {DomRefs} dom */
export function unmountTasks(dom) {
  render(null, dom.tasksRoot);
}
