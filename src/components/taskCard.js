import { formatDateKeyForUser, formatDecimalHours, formatHMS } from "../time.js";
import {
  sortedHistoryEntries,
  taskTodaySeconds,
  taskTotalSecondsLive,
} from "../model.js";
import { applyTranslations, t } from "../i18n.js";

function setRunButtonState($btnRun, isRunning) {
  const $runIcon = $btnRun.querySelector(".icon");
  if (!$runIcon) return;

  if (isRunning) {
    $btnRun.classList.remove("btn--start");
    $btnRun.classList.add("btn--stop");
    $btnRun.setAttribute("aria-label", t("task.stop"));
    $btnRun.setAttribute("title", t("task.stop"));
    $runIcon.classList.remove("icon--play");
    $runIcon.classList.add("icon--stop");
  } else {
    $btnRun.classList.remove("btn--stop");
    $btnRun.classList.add("btn--start");
    $btnRun.setAttribute("aria-label", t("task.start"));
    $btnRun.setAttribute("title", t("task.start"));
    $runIcon.classList.remove("icon--stop");
    $runIcon.classList.add("icon--play");
  }
}

function renderHistory({
  state,
  task,
  expanded,
  node,
  handlers,
}) {
  const $historyWrap = node.querySelector(".task__history");
  const $historyList = node.querySelector(".history__list");
  const $btnShowAll = node.querySelector(".task__showAll");
  const $btnToggle = node.querySelector(".task__toggle");

  if (!$historyWrap || !$historyList || !$btnShowAll || !$btnToggle) return;

  const historyId = `history_${task.id}`;
  $historyWrap.id = historyId;
  $historyWrap.setAttribute("aria-label", t("task.historyAria", { task: task.name }));
  $btnToggle.setAttribute("aria-controls", historyId);

  $btnToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  $historyWrap.hidden = !expanded;
  $btnToggle.addEventListener("click", () => handlers.toggleHistory(task.id));

  if (!expanded) return;

  const all = sortedHistoryEntries(task);
  const showAll = Boolean(state.ui.showAllHistory[task.id]);
  const visible = showAll ? all : all.slice(0, 7);

  $btnShowAll.textContent = showAll ? t("task.showLess") : t("task.showAll");
  $btnShowAll.hidden = all.length <= 7;
  $btnShowAll.addEventListener("click", () => handlers.toggleShowAll(task.id));

  $historyList.innerHTML = "";
  if (visible.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = t("task.noTimeYet");
    $historyList.appendChild(p);
    return;
  }

  for (const [dateKey, secs] of visible) {
    const row = document.createElement("div");
    row.className = "history-row";

    const left = document.createElement("div");
    left.className = "history-row__date";
    left.textContent = formatDateKeyForUser(dateKey);

    const actions = document.createElement("div");
    actions.className = "history-row__actions";

    const right = document.createElement("div");
    right.className = "history-row__time";
    right.textContent = `${formatHMS(secs)} (${formatDecimalHours(secs)}h)`;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn--danger btn--icon history-row__delete";
    del.setAttribute("aria-label", t("task.deleteHistoryEntryAria"));
    del.setAttribute("title", t("task.deleteTitle"));
    del.innerHTML = '<span class="icon icon--trash" aria-hidden="true"></span>';
    del.addEventListener("click", () => handlers.deleteHistoryEntry(task.id, dateKey));

    actions.appendChild(right);
    actions.appendChild(del);

    row.appendChild(left);
    row.appendChild(actions);
    $historyList.appendChild(row);
  }
}

export function createTaskCard({
  state,
  task,
  now,
  todayKey,
  handlers,
  template,
}) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.taskId = task.id;

  // Translate any static bits from the template (e.g. History header).
  applyTranslations(node);

  const $name = node.querySelector(".task__name");
  const $today = node.querySelector(".task__today");
  const $total = node.querySelector(".task__total");

  const $btnToggle = node.querySelector(".task__toggle");
  const $btnEdit = node.querySelector(".task__edit");
  const $btnDelete = node.querySelector(".task__delete");
  const $btnRun = node.querySelector(".task__run");
  const $running = node.querySelector(".task__running");

  if (!$name || !$today || !$total || !$btnRun || !$btnDelete || !$btnToggle || !$running) {
    return node;
  }

  $name.textContent = task.name;

  const requestRename = () => {
    const next = prompt(t("dialogs.renamePrompt"), task.name);
    if (next == null) return;
    handlers.renameTask(task.id, next);
  };

  if ($btnEdit) $btnEdit.addEventListener("click", requestRename);

  const todaySecs = taskTodaySeconds(state, task, todayKey, now);
  const totalSecs = taskTotalSecondsLive(state, task, now);

  $today.textContent = t("task.today", { time: formatHMS(todaySecs) });
  $total.textContent = t("task.total", { time: formatHMS(totalSecs) });

  const isRunning = state.running?.taskId === task.id;
  $running.hidden = !isRunning;

  setRunButtonState($btnRun, isRunning);

  if (isRunning) {
    const elapsedSecs = Math.max(0, Math.round((now - state.running.startedAt) / 1000));
    $running.textContent = t("task.running", { time: formatHMS(elapsedSecs) });
  }

  $btnRun.addEventListener("click", () => {
    if (isRunning) handlers.stopRunning();
    else handlers.startTask(task.id);
  });

  $btnDelete.addEventListener("click", () => {
    const ok = confirm(t("dialogs.confirmDeleteTask", { name: task.name }));
    if (ok) handlers.deleteTask(task.id);
  });

  const expanded = Boolean(state.ui.expanded[task.id]);
  renderHistory({ state, task, expanded, node, handlers });

  return node;
}

/**
 * Updates only the currently running task card (used on the 1s tick).
 */
export function updateRunningTaskCardLive(state, dom, now, todayKey) {
  if (!state.running) return;

  const taskId = state.running.taskId;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const node = dom.tasksList.querySelector(`[data-task-id="${CSS.escape(task.id)}"]`);
  if (!node) return;

  const $today = node.querySelector(".task__today");
  const $total = node.querySelector(".task__total");
  const $running = node.querySelector(".task__running");

  if ($today) {
    const todaySecs = taskTodaySeconds(state, task, todayKey, now);
    $today.textContent = t("task.today", { time: formatHMS(todaySecs) });
  }

  if ($total) {
    const totalSecs = taskTotalSecondsLive(state, task, now);
    $total.textContent = t("task.total", { time: formatHMS(totalSecs) });
  }

  if ($running) {
    $running.hidden = false;
    const elapsedSecs = Math.max(0, Math.round((now - state.running.startedAt) / 1000));
    $running.textContent = t("task.running", { time: formatHMS(elapsedSecs) });
  }
}
