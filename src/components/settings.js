import { renderSettingsDialog } from "../app/settings/settingsRoot.jsx";

/**
 * Wires the settings modal: export/import/delete-all.
 */
export function setupSettingsDialog({ store, dom, invalidatePendingUndo }) {
  renderSettingsDialog({ dom, store, invalidatePendingUndo });
}
