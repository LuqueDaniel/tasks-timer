import { render } from "preact";
import { TaskList } from "./views/TaskList.jsx";

export function renderTasks({ state, dom, handlers, now, todayKey }) {
  render(
    <TaskList state={state} handlers={handlers} now={now} todayKey={todayKey} />,
    dom.tasksList,
  );
}

export function unmountTasks(dom) {
  render(null, dom.tasksList);
}
