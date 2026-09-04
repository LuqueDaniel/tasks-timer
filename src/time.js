/** Returns current time in ms since epoch. */
export function nowMs() {
  return Date.now();
}

/** Left-pads a number to 2 digits. */
export function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Converts a timestamp to a local-date key used for storage.
 * Format: YYYY-MM-DD (local time).
 */
export function toLocalDateKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Parses a YYYY-MM-DD local-date key into a Date at local midnight.
 * Returns null if the key is invalid.
 */
export function dateFromLocalDateKey(dateKey) {
  const s = String(dateKey ?? "");
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  const date = new Date(year, monthIndex, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }
  return date;
}

/**
 * Formats a YYYY-MM-DD date key using the user's browser locale.
 * Storage keys remain YYYY-MM-DD; this is display-only.
 */
export function formatDateKeyForUser(
  dateKey,
  options = { year: "numeric", month: "2-digit", day: "2-digit" },
) {
  const d = dateFromLocalDateKey(dateKey);
  if (!d) return String(dateKey ?? "");
  try {
    return new Intl.DateTimeFormat(undefined, options).format(d);
  } catch (err) {
    console.warn("[Task Timer] Failed to format date for user", err);
    // Very old environments: fallback to YYYY-MM-DD
    return String(dateKey ?? "");
  }
}

/**
 * Returns the timestamp (ms) for the start of the next local day.
 */
export function startOfNextLocalDayMs(ms) {
  const d = new Date(ms);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/** Formats seconds as HH:MM:SS (zero-padded). */
export function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

/**
 * Formats seconds as decimal hours, rounded to 2 decimals (trim trailing zeros).
 * Example: 01:30:00 => "1.5"
 */
export function formatDecimalHours(totalSeconds) {
  const secs = Math.max(0, Number(totalSeconds) || 0);
  const hours = secs / 3600;
  const rounded = Math.round((hours + Number.EPSILON) * 100) / 100;
  let s = rounded.toFixed(2);
  s = s.replace(/\.00$/, "").replace(/(\.[0-9])0$/, "$1");
  return s;
}

/**
 * Adds elapsed time into `entries` splitting across local day boundaries.
 * Mutates `entries` in-place.
 */
export function addDurationSplitByLocalDay(entries, startMs, endMs) {
  let cursor = startMs;
  while (cursor < endMs) {
    const dateKey = toLocalDateKey(cursor);
    const segmentEnd = Math.min(endMs, startOfNextLocalDayMs(cursor));
    const deltaSeconds = Math.max(0, Math.round((segmentEnd - cursor) / 1000));
    if (deltaSeconds > 0) {
      entries[dateKey] = (entries[dateKey] ?? 0) + deltaSeconds;
    }
    cursor = segmentEnd;
  }
}

/**
 * Returns how many seconds of [startMs, endMs] fall within the given local date key.
 */
export function secondsInDateKeyBetween(startMs, endMs, dateKey) {
  if (endMs <= startMs) return 0;
  let cursor = startMs;
  let acc = 0;
  while (cursor < endMs) {
    const curKey = toLocalDateKey(cursor);
    const segmentEnd = Math.min(endMs, startOfNextLocalDayMs(cursor));
    const deltaSeconds = Math.max(0, Math.round((segmentEnd - cursor) / 1000));
    if (curKey === dateKey) acc += deltaSeconds;
    cursor = segmentEnd;
  }
  return acc;
}

/** Returns elapsed seconds between two timestamps (rounded, non-negative). */
export function elapsedSeconds(startMs, endMs) {
  if (endMs <= startMs) return 0;
  return Math.max(0, Math.round((endMs - startMs) / 1000));
}
