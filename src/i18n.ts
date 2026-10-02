import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const LANGUAGE_STORAGE_KEY = "retrolosa-language";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    supportedLngs: ["en", "fr"],
    fallbackLng: "en",
    load: "languageOnly",
    initAsync: false,
    keySeparator: false,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: [],
    },
    interpolation: { escapeValue: false },
  });

function updateDocumentLanguage() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", i18n.t("description"));
}
i18n.on("languageChanged", updateDocumentLanguage);
updateDocumentLanguage();

export function selectLanguage(language: "en" | "fr") {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language selection still works when browser storage is unavailable.
  }
  void i18n.changeLanguage(language);
}

export default i18n;
