import { defaultState, loadState, saveState } from "./storage.js";

/**
 * Creates the app store.
 *
 * Responsibilities:
 * - Holds the in-memory state.
 * - Persists to localStorage on each mutation.
 * - Notifies subscribers after changes.
 */
export function createStore() {
  let state = loadState();
  const listeners = new Set();

  function getState() {
    return state;
  }

  function persist() {
    saveState(state);
  }

  function emit() {
    for (const listener of listeners) listener(state);
  }

  /**
   * Replaces the entire state object.
   * Useful for import/reset flows.
   */
  function replaceState(nextState, { persist = true } = {}) {
    state = nextState;
    if (persist) saveState(state);
    emit();
  }

  /**
   * Resets the store to the default empty state.
   */
  function reset({ persist = true } = {}) {
    replaceState(defaultState(), { persist });
  }

  function mutate(mutator) {
    mutator(state);
    saveState(state);
    emit();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getState,
    mutate,
    replaceState,
    reset,
    subscribe,
    persist,
  };
}
