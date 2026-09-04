import { useMemo } from "preact/hooks";
import { sortedHistoryEntries } from "../../../model.js";

export function useSortedHistoryEntries(task) {
  // Task objects are updated in place by the store. Track the entries object
  // itself so a newly recorded stop is reflected in the history immediately.
  const entries = task.entries;
  return useMemo(() => sortedHistoryEntries({ entries }), [entries]);
}
