import { SettingsDialogContent } from "./components/SettingsDialogContent.jsx";

/** @param {{ state: object, resetToken: number, settings: object }} props */
export function SettingsRoot({ state, resetToken, settings }) {
  return (
    <SettingsDialogContent
      theme={state?.ui?.theme ?? "system"}
      language={state?.ui?.language === "es" ? "es" : "en"}
      resetToken={resetToken}
      onThemeChange={settings.onThemeChange}
      onLanguageChange={settings.onLanguageChange}
      onExport={settings.onExport}
      onImportFile={settings.onImportFile}
      onDeleteAll={settings.onDeleteAll}
    />
  );
}
