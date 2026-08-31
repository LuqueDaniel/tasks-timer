import { useRef } from "preact/hooks";
import { AddTaskFields } from "./components/AddTaskFields.jsx";

/**
 * @typedef AddTaskRootProps
 * @property {{ addTask: (name: string) => unknown }} handlers
 */

/** @param {AddTaskRootProps} props */
function AddTaskRoot({ handlers }) {
  const inputRef = useRef(null);
  return <AddTaskFields handlers={handlers} inputRef={inputRef} />;
}

export { AddTaskRoot };
