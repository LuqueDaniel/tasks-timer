import { TaskCard } from "../components/TaskCard.jsx";

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
