import { useMemo } from "preact/hooks";
import { sortedHistoryEntries } from "../../../model.js";

export function useSortedHistoryEntries(task) {
  return useMemo(() => sortedHistoryEntries(task), [task]);
}
