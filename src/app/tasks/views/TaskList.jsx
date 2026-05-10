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
          handlers={handlers}
          now={now}
          todayKey={todayKey}
        />
      ))}
    </>
  );
}
