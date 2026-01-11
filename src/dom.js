/**
 * Collects and validates the DOM elements the app relies on.
 * Throws if `index.html` is missing expected IDs.
 */
export function getDom() {
  const todayChip = document.getElementById("todayChip");
  const totalToday = document.getElementById("totalToday");
  const runningHint = document.getElementById("runningHint");
  const addTaskForm = document.getElementById("addTaskForm");
  const taskName = document.getElementById("taskName");
  const tasksList = document.getElementById("tasksList");
  const tasksEmpty = document.getElementById("tasksEmpty");
  const taskTemplate = document.getElementById("taskTemplate");
  const toastHost = document.getElementById("toastHost");
  const settingsButton = document.getElementById("settingsButton");
  const settingsDialog = document.getElementById("settingsDialog");
  const settingsClose = document.getElementById("settingsClose");
  const settingsExport = document.getElementById("settingsExport");
  const settingsImportInput = document.getElementById("settingsImportInput");
  const settingsImport = document.getElementById("settingsImport");
  const settingsTheme = document.getElementById("settingsTheme");
  const settingsDeleteConfirm = document.getElementById("settingsDeleteConfirm");
  const settingsDelete = document.getElementById("settingsDelete");

  if (!todayChip || !totalToday || !runningHint || !addTaskForm || !taskName || !tasksList || !tasksEmpty || !taskTemplate || !toastHost || !settingsButton || !settingsDialog || !settingsClose || !settingsExport || !settingsImportInput || !settingsImport || !settingsTheme || !settingsDeleteConfirm || !settingsDelete) {
    throw new Error("Incomplete DOM: check index.html IDs");
  }

  return {
    todayChip,
    totalToday,
    runningHint,
    addTaskForm,
    taskName,
    tasksList,
    tasksEmpty,
    taskTemplate,
    toastHost,
    settingsButton,
    settingsDialog,
    settingsClose,
    settingsExport,
    settingsImportInput,
    settingsImport,
    settingsTheme,
    settingsDeleteConfirm,
    settingsDelete,
  };
}
