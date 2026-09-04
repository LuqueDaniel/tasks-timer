import { useCallback } from "preact/hooks";
import { t } from "../../../i18n.js";

/**
 * @typedef AddTaskHandlers
 * @property {(name: string) => unknown} addTask
 */

/**
 * @typedef AddTaskFieldsProps
 * @property {AddTaskHandlers} handlers
 * @property {import("preact").RefObject<HTMLInputElement>} inputRef
 */

/** @param {AddTaskFieldsProps} props */
export function AddTaskFields({ handlers, inputRef }) {
  const onSubmit = useCallback(
    /** @param {SubmitEvent} event */
    (event) => {
      event.preventDefault();

      const input = inputRef.current;
      if (!input) return;

      handlers.addTask(input.value);
      input.value = "";
      input.focus();
    },
    [handlers, inputRef],
  );

  return (
    <>
      <h2 id="addTaskTitle">{t("tasks.title")}</h2>
      <form className="add-task__form" autoComplete="off" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="taskName">
          {t("tasks.addTaskLabel")}
        </label>
        <input
          ref={inputRef}
          id="taskName"
          name="taskName"
          type="text"
          inputMode="text"
          placeholder={t("tasks.addPlaceholder")}
          maxLength={80}
          required
        />
        <button
          className="btn btn--primary btn--icon"
          type="submit"
          aria-label={t("tasks.addAria")}
          title={t("tasks.addAria")}
        >
          <span className="icon icon--plus" aria-hidden="true" />
        </button>
      </form>
    </>
  );
}
