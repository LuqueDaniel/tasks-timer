import { safeUUID } from "./utils.js";
import {
  nowMs,
  addDurationSplitByLocalDay,
  secondsInDateKeyBetween,
  elapsedSeconds,
} from "./time.js";

function normalizeTaskName(raw) {
  const s = String(raw ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  return s;
}

function canonicalTaskName(name) {
  // "Visual duplicates": ignore case, whitespace, and diacritics.
  return normalizeTaskName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES");
}

function hasVisualDuplicate(state, name, excludeTaskId = null) {
  const cand = canonicalTaskName(name);
  if (!cand) return false;
  return state.tasks.some((t) => t.id !== excludeTaskId && canonicalTaskName(t.name) === cand);
}

export function getTask(state, taskId) {
  return state.tasks.find((t) => t.id === taskId) ?? null;
}

/**
 * Computes total recorded seconds for a task (does not include any currently running time).
 */
export function computeTaskTotalSeconds(task) {
  let total = 0;
  for (const secs of Object.values(task.entries ?? {})) {
    if (typeof secs === "number" && Number.isFinite(secs)) total += secs;
  }
  return total;
}

/**
 * Returns history entries sorted descending by date key.
 * Only includes positive seconds.
 */
export function sortedHistoryEntries(task) {
  const entries = task.entries ?? {};
  return Object.entries(entries)
    .filter(([, secs]) => typeof secs === "number" && secs > 0)
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0));
}

export function taskTodaySeconds(state, task, todayKey, now = nowMs()) {
  const base = task.entries?.[todayKey] ?? 0;
  if (state.running?.taskId !== task.id) return base;
  return base + secondsInDateKeyBetween(state.running.startedAt, now, todayKey);
}

export function taskTotalSecondsLive(state, task, now = nowMs()) {
  const recorded = computeTaskTotalSeconds(task);
  if (state.running?.taskId !== task.id) return recorded;
  return recorded + elapsedSeconds(state.running.startedAt, now);
}

export function computeTotalToday(state, todayKey, now = nowMs()) {
  return state.tasks.reduce((acc, task) => acc + taskTodaySeconds(state, task, todayKey, now), 0);
}

/**
 * Adds a new task.
 *
 * Returns `{ ok: false, error }` for empty/too-long/duplicate (visual) names.
 */
export function addTask(store, name) {
  const trimmed = normalizeTaskName(name);
  if (!trimmed) return { ok: false, error: "empty" };

  if (trimmed.length > 80) {
    return { ok: false, error: "too_long" };
  }

  if (hasVisualDuplicate(store.getState(), trimmed)) {
    return { ok: false, error: "duplicate" };
  }

  store.mutate((state) => {
    const task = {
      id: safeUUID(),
      name: trimmed,
      createdAt: nowMs(),
      entries: {},
    };

    state.tasks.unshift(task);
  });

  return { ok: true };
}

/**
 * Stops the currently running task (if any) and records its elapsed time
 * split by local day boundaries.
 */
export function stopRunning(store) {
  store.mutate((state) => {
    if (!state.running) return;

    const end = nowMs();
    const { taskId, startedAt } = state.running;
    state.running = null;

    const task = getTask(state, taskId);
    if (!task) return;

    if (end > startedAt) {
      const nextEntries = { ...(task.entries ?? {}) };
      addDurationSplitByLocalDay(nextEntries, startedAt, end);
      task.entries = nextEntries;
    }
  });
}

/**
 * Starts a task timer. If another task is running, it is first recorded and stopped.
 */
export function startTask(store, taskId) {
  store.mutate((state) => {
    const task = getTask(state, taskId);
    if (!task) return;

    const now = nowMs();

    // If another task was running, stop it and record its time.
    if (state.running && state.running.taskId !== taskId) {
      const prevTask = getTask(state, state.running.taskId);
      if (prevTask && now > state.running.startedAt) {
        const nextEntries = { ...(prevTask.entries ?? {}) };
        addDurationSplitByLocalDay(nextEntries, state.running.startedAt, now);
        prevTask.entries = nextEntries;
      }
    }

    // If the same task is already running, do nothing.
    if (state.running && state.running.taskId === taskId) return;

    state.running = { taskId, startedAt: now };
  });
}

/**
 * Deletes a task and clears any related UI flags.
 */
export function deleteTask(store, taskId) {
  store.mutate((state) => {
    if (state.running?.taskId === taskId) {
      state.running = null;
    }
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    delete state.ui.expanded[taskId];
    delete state.ui.showAllHistory[taskId];
  });
}

/**
 * Deletes a single history entry for a task.
 * This removes the whole recorded entry for a given `YYYY-MM-DD` key.
 */
export function deleteHistoryEntry(store, taskId, dateKey) {
  store.mutate((state) => {
    const task = getTask(state, taskId);
    if (!task?.entries) return;

    const nextEntries = { ...task.entries };
    delete nextEntries[dateKey];
    task.entries = nextEntries;
  });
}

/**
 * Restores a previously deleted history entry snapshot.
 * If new time was recorded after deletion, restoration adds to the current value.
 */
export function restoreHistoryEntry(store, snapshot) {
  const taskId = snapshot?.taskId;
  const dateKey = snapshot?.dateKey;
  const seconds = Math.floor(Number(snapshot?.seconds));
  if (!taskId || !dateKey || !Number.isFinite(seconds) || seconds <= 0) return;

  store.mutate((state) => {
    const task = getTask(state, taskId);
    if (!task) return;

    const nextEntries = { ...(task.entries ?? {}) };
    nextEntries[dateKey] = (nextEntries[dateKey] ?? 0) + seconds;
    task.entries = nextEntries;
  });
}

/**
 * Toggles the visibility of the per-task history section.
 */
export function toggleHistory(store, taskId) {
  store.mutate((state) => {
    if (state.ui.expanded[taskId]) delete state.ui.expanded[taskId];
    else state.ui.expanded[taskId] = true;
  });
}

/**
 * Toggles whether the full history is shown (vs last 7 days).
 */
export function toggleShowAll(store, taskId) {
  store.mutate((state) => {
    if (state.ui.showAllHistory[taskId]) delete state.ui.showAllHistory[taskId];
    else state.ui.showAllHistory[taskId] = true;
  });
}

/**
 * Renames a task.
 * Returns `{ ok: false, error }` for empty/too-long/duplicate (visual) names.
 */
export function renameTask(store, taskId, nextName) {
  const trimmed = normalizeTaskName(nextName);
  if (!trimmed) return { ok: false, error: "empty" };

  if (trimmed.length > 80) {
    return { ok: false, error: "too_long" };
  }

  if (hasVisualDuplicate(store.getState(), trimmed, taskId)) {
    return { ok: false, error: "duplicate" };
  }

  store.mutate((state) => {
    const task = getTask(state, taskId);
    if (!task) return;
    task.name = trimmed;
  });

  return { ok: true };
}

/**
 * Restores a previously deleted task snapshot (used by Undo).
 */
export function restoreDeletedTask(store, snapshot) {
  if (!snapshot || !snapshot.task || !snapshot.task.id) return;

  store.mutate((state) => {
    // If it already exists (e.g. double-undo), do nothing.
    if (getTask(state, snapshot.task.id)) return;

    const index = Math.min(
      Math.max(0, Number.isFinite(snapshot.index) ? snapshot.index : 0),
      state.tasks.length,
    );

    state.tasks.splice(index, 0, snapshot.task);

    if (snapshot.ui) {
      if (typeof snapshot.ui.expanded !== "undefined") {
        if (snapshot.ui.expanded) state.ui.expanded[snapshot.task.id] = true;
        else delete state.ui.expanded[snapshot.task.id];
      }
      if (typeof snapshot.ui.showAllHistory !== "undefined") {
        if (snapshot.ui.showAllHistory) state.ui.showAllHistory[snapshot.task.id] = true;
        else delete state.ui.showAllHistory[snapshot.task.id];
      }
    }

    // Only restore the timer if nothing else is currently running.
    if (!state.running && snapshot.running && snapshot.running.taskId === snapshot.task.id) {
      state.running = snapshot.running;
    }
  });
}

export function setTheme(store, theme) {
  const t = String(theme ?? "").toLowerCase();
  const next = t === "light" || t === "dark" || t === "system" ? t : "system";

  store.mutate((state) => {
    state.ui ??= {};
    state.ui.theme = next;
  });
}

export function setLanguage(store, language) {
  const raw = String(language ?? "")
    .trim()
    .toLowerCase();
  const base = raw.split("-")[0];
  const next = base === "es" || base === "en" ? base : "en";

  store.mutate((state) => {
    state.ui ??= {};
    state.ui.language = next;
  });
}
