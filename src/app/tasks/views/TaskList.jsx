import { TaskCard } from "../components/TaskCard.jsx";

/**
 * @typedef TaskListProps
 * @property {{ tasks: Array<any> }} state
 * @property {object} handlers
 * @property {number} now
 * @property {string} todayKey
 */

/** @param {TaskListProps} props */
export function TaskList({ state, handlers, now, todayKey }) {
  return (
    <>
      {state.tasks.map((task) => (
        <TaskCard
          key={task.id}
          state={state}
          task={task}
          taskName={task.name}
          entries={task.entries}
          expanded={Boolean(state.ui.expanded?.[task.id])}
          showAll={Boolean(state.ui.showAllHistory?.[task.id])}
          isRunning={state.running?.taskId === task.id}
          runningStartedAt={state.running?.taskId === task.id ? state.running.startedAt : null}
          language={state.ui.language}
          handlers={handlers}
          now={now}
          todayKey={todayKey}
        />
      ))}
    </>
  );
}
