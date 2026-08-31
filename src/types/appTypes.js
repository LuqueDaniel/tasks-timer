/**
 * Shared JSDoc types for JavaScript modules (no TypeScript .d.ts needed).
 */

/** @typedef {{ taskId: string, startedAt: number } | null} RunningTimer */

/**
 * @typedef TaskModel
 * @property {string} id
 * @property {string} name
 * @property {Record<string, number>} entries
 */

/**
 * @typedef TaskUiState
 * @property {Record<string, boolean>} expanded
 * @property {Record<string, boolean>} showAllHistory
 * @property {"system" | "light" | "dark"} [theme]
 * @property {string | null} [language]
 */

/**
 * @typedef AppTaskState
 * @property {TaskModel[]} tasks
 * @property {RunningTimer} running
 * @property {TaskUiState} ui
 */

/**
 * @typedef TaskHandlers
 * @property {(taskId: string) => unknown} startTask
 * @property {() => unknown} stopRunning
 * @property {(taskId: string) => unknown} deleteTask
 * @property {(taskId: string, dateKey: string) => unknown} deleteHistoryEntry
 * @property {(taskId: string) => unknown} toggleHistory
 * @property {(taskId: string) => unknown} toggleShowAll
 * @property {(taskId: string, nextName: string) => unknown} renameTask
 */

/**
 * @typedef AppHandlers
 * @property {(name: string) => unknown} addTask
 * @property {(taskId: string) => unknown} startTask
 * @property {() => unknown} stopRunning
 * @property {(taskId: string) => unknown} deleteTask
 * @property {(taskId: string, dateKey: string) => unknown} deleteHistoryEntry
 * @property {(taskId: string) => unknown} toggleHistory
 * @property {(taskId: string) => unknown} toggleShowAll
 * @property {(taskId: string, nextName: string) => unknown} renameTask
 */

export {};
