import { render } from "preact";
import { SettingsDialogContent } from "./components/SettingsDialogContent.jsx";

/** @typedef {import("../../types/appTypes.js").DomRefs} DomRefs */

/**
 * @typedef RenderSettingsArgs
 * @property {DomRefs} dom
 * @property {"system" | "light" | "dark"} theme
 * @property {"en" | "es"} language
 * @property {number} resetToken
 * @property {(theme: string) => void} onThemeChange
 * @property {(language: string) => void} onLanguageChange
 * @property {() => void} onExport
 * @property {(file: File) => Promise<void> | void} onImportFile
 * @property {() => void} onDeleteAll
 */

/** @param {RenderSettingsArgs} params */
export function renderSettingsDialog({
  dom,
  theme,
  language,
  resetToken,
  onThemeChange,
  onLanguageChange,
  onExport,
  onImportFile,
  onDeleteAll,
}) {
  render(
    <SettingsDialogContent
      theme={theme}
      language={language}
      resetToken={resetToken}
      onThemeChange={onThemeChange}
      onLanguageChange={onLanguageChange}
      onExport={onExport}
      onImportFile={onImportFile}
      onDeleteAll={onDeleteAll}
    />,
    dom.settingsRoot,
  );
}
