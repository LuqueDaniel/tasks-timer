import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { t } from "../../../i18n.js";

/**
 * @typedef SettingsDialogContentProps
 * @property {"system" | "light" | "dark"} theme
 * @property {"en" | "es"} language
 * @property {number} resetToken
 * @property {(theme: string) => void} onThemeChange
 * @property {(language: string) => void} onLanguageChange
 * @property {() => void} onExport
 * @property {(file: File) => Promise<boolean> | boolean} onImportFile
 * @property {() => void} onDeleteAll
 */

/** @param {SettingsDialogContentProps} props */
export function SettingsDialogContent({
  theme,
  language,
  resetToken,
  onThemeChange,
  onLanguageChange,
  onExport,
  onImportFile,
  onDeleteAll,
}) {
  const fileInputRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setDeleteConfirm("");
  }, [resetToken]);

  const locale = language === "es" ? "es-ES" : "en-US";
  const requiredWord = t("settings.deleteConfirmWord");
  const canDelete = useMemo(() => {
    const typed = String(deleteConfirm).trim().toLocaleUpperCase(locale);
    const required = String(requiredWord).toLocaleUpperCase(locale);
    return typed === required;
  }, [deleteConfirm, locale, requiredWord]);

  const confirmLabelParts = t("settings.deleteConfirmLabel", { word: "__WORD__" }).split(
    "__WORD__",
  );

  return (
    <div className="modal__body">
      <section className="modal__section">
        <h3 className="modal__sectionTitle">{t("settings.appearanceTitle")}</h3>
        <p className="muted">{t("settings.appearanceHint")}</p>

        <label className="modal__label" htmlFor="settingsThemeSelect">
          {t("settings.themeLabel")}
        </label>
        <select
          id="settingsThemeSelect"
          name="settingsTheme"
          value={theme}
          onChange={(e) => onThemeChange(e.currentTarget.value)}
        >
          <option value="system">{t("settings.themeSystem")}</option>
          <option value="light">{t("settings.themeLight")}</option>
          <option value="dark">{t("settings.themeDark")}</option>
        </select>

        <label className="modal__label" htmlFor="settingsLanguageSelect">
          {t("settings.languageLabel")}
        </label>
        <select
          id="settingsLanguageSelect"
          name="settingsLanguage"
          value={language}
          onChange={(e) => onLanguageChange(e.currentTarget.value)}
        >
          <option value="en">{t("settings.languageEnglish")}</option>
          <option value="es">{t("settings.languageSpanish")}</option>
        </select>
      </section>

      <section className="modal__section">
        <h3 className="modal__sectionTitle">{t("settings.backupTitle")}</h3>
        <p className="muted">{t("settings.backupHint")}</p>

        <div className="modal__row">
          <button className="btn btn--primary" type="button" onClick={onExport}>
            {t("settings.exportJson")}
          </button>

          <input
            className="sr-only"
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              if (!file) return;
              await onImportFile(file);
            }}
          />

          <button
            className="btn"
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            {t("settings.importJson")}
          </button>
        </div>

        <p className="muted modal__note">{t("settings.backupNote")}</p>
      </section>

      <section className="modal__section modal__section--danger">
        <h3 className="modal__sectionTitle">{t("settings.dangerTitle")}</h3>
        <p className="muted">{t("settings.dangerHint")}</p>

        <label className="modal__label" htmlFor="settingsDeleteConfirm">
          {confirmLabelParts[0]}
          <strong>{requiredWord}</strong>
          {confirmLabelParts[1]}
        </label>
        <input
          id="settingsDeleteConfirm"
          name="settingsDeleteConfirm"
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder={t("settings.deleteConfirmPlaceholder")}
          value={deleteConfirm}
          onInput={(e) => setDeleteConfirm(e.currentTarget.value)}
        />

        <div className="modal__row">
          <button
            className="btn btn--danger"
            type="button"
            disabled={!canDelete}
            onClick={onDeleteAll}
          >
            {t("settings.deleteAll")}
          </button>
        </div>
      </section>
    </div>
  );
}
