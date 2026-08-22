/**
 * Collects and validates the DOM elements the app relies on.
 * Throws if `index.html` is missing expected IDs.
 */
export function getDom() {
  const todayChip = document.getElementById("todayChip");
  const totalToday = document.getElementById("totalToday");
  const runningHint = document.getElementById("runningHint");
  const addTaskRoot = document.getElementById("addTaskRoot");
  const tasksRoot = document.getElementById("tasksRoot");
  const toastHost = document.getElementById("toastHost");
  const settingsButton = document.getElementById("settingsButton");
  const settingsDialog = document.getElementById("settingsDialog");
  const settingsRoot = document.getElementById("settingsRoot");

  if (
    !todayChip ||
    !totalToday ||
    !runningHint ||
    !addTaskRoot ||
    !tasksRoot ||
    !toastHost ||
    !settingsButton ||
    !settingsDialog ||
    !settingsRoot
  ) {
    throw new Error("Incomplete DOM: check index.html IDs");
  }

  return {
    todayChip,
    totalToday,
    runningHint,
    addTaskRoot,
    tasksRoot,
    toastHost,
    settingsButton,
    settingsDialog,
    settingsRoot,
  };
}
