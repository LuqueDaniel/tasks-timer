import { useRef } from "preact/hooks";
import { AddTaskFields } from "./components/AddTaskFields.jsx";

/** @typedef {ReturnType<import("../../dom.js").getDom>} DomRefs */

/**
 * @typedef AddTaskRenderArgs
 * @property {DomRefs} dom
 * @property {{ addTask: (name: string) => unknown }} handlers
 */

/**
 * @typedef AddTaskRootProps
 * @property {{ addTask: (name: string) => unknown }} handlers
 */

/** @param {AddTaskRootProps} props */
function AddTaskRoot({ handlers }) {
  const inputRef = useRef(null);
  return <AddTaskFields handlers={handlers} inputRef={inputRef} />;
}

/** @param {AddTaskRenderArgs} params */
export { AddTaskRoot };
