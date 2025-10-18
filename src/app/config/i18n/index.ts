import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import all translation files
import translationEN from "../../translations/en.json";
import translationZH from "../../translations/zh.json";
import translationDE from "../../translations/de.json";
import translationFR from "../../translations/fr.json";
import translationRU from "../../translations/ru.json";
import translationIT from "../../translations/it.json";
import translationES from "../../translations/es.json";
import translationJA from "../../translations/ja.json";
import translationPT from "../../translations/pt.json";
import translationHI from "../../translations/hi.json";
import translationAR from "../../translations/ar.json";
import translationTR from "../../translations/tr.json";
import translationKO from "../../translations/ko.json";

// Language detection utility
const detectLanguage = (): string => {
  // Check localStorage first for user preference
  const savedLanguage = localStorage.getItem("language");
  if (savedLanguage) {
    return savedLanguage;
  }

  // Get browser language
  const browserLanguage = navigator.language || navigator.languages?.[0] || "en";

  // Map browser language to supported language codes
  const languageMap: Record<string, string> = {
    // English variants
    en: "en",
    "en-US": "en",
    "en-GB": "en",
    "en-CA": "en",
    "en-AU": "en",

    // Chinese variants
    zh: "zh",
    "zh-CN": "zh",
    "zh-TW": "zh",
    "zh-HK": "zh",
    "zh-SG": "zh",

    // German variants
    de: "de",
    "de-DE": "de",
    "de-AT": "de",
    "de-CH": "de",

    // French variants
    fr: "fr",
    "fr-FR": "fr",
    "fr-CA": "fr",
    "fr-BE": "fr",
    "fr-CH": "fr",

    // Russian variants
    ru: "ru",
    "ru-RU": "ru",

    // Italian variants
    it: "it",
    "it-IT": "it",
    "it-CH": "it",

    // Spanish variants
    es: "es",
    "es-ES": "es",
    "es-MX": "es",
    "es-AR": "es",
    "es-CO": "es",
    "es-PE": "es",
    "es-VE": "es",
    "es-CL": "es",
    "es-EC": "es",
    "es-UY": "es",
    "es-PY": "es",
    "es-BO": "es",
    "es-SV": "es",
    "es-HN": "es",
    "es-NI": "es",
    "es-CR": "es",
    "es-PA": "es",
    "es-CU": "es",
    "es-DO": "es",
    "es-PR": "es",
    "es-GT": "es",

    // Japanese
    ja: "ja",
    "ja-JP": "ja",

    // Portuguese variants
    pt: "pt",
    "pt-BR": "pt",
    "pt-PT": "pt",

    // Hindi
    hi: "hi",
    "hi-IN": "hi",

    // Arabic variants
    ar: "ar",
    "ar-SA": "ar",
    "ar-EG": "ar",
    "ar-AE": "ar",
    "ar-JO": "ar",
    "ar-LB": "ar",
    "ar-SY": "ar",
    "ar-IQ": "ar",
    "ar-MA": "ar",
    "ar-TN": "ar",
    "ar-DZ": "ar",
    "ar-LY": "ar",
    "ar-SD": "ar",
    "ar-KW": "ar",
    "ar-BH": "ar",
    "ar-QA": "ar",
    "ar-OM": "ar",
    "ar-YE": "ar",

    // Turkish
    tr: "tr",
    "tr-TR": "tr",

    // Korean
    ko: "ko",
    "ko-KR": "ko",
  };

  // Get the base language code (e.g., "en" from "en-US")
  const baseLanguage = browserLanguage.split("-")[0];

  // Return mapped language or fallback to base language if supported, otherwise English
  return languageMap[browserLanguage] || languageMap[baseLanguage] || "en";
};

const detectedLanguage = detectLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      zh: { translation: translationZH },
      de: { translation: translationDE },
      fr: { translation: translationFR },
      ru: { translation: translationRU },
      it: { translation: translationIT },
      es: { translation: translationES },
      ja: { translation: translationJA },
      pt: { translation: translationPT },
      hi: { translation: translationHI },
      ar: { translation: translationAR },
      tr: { translation: translationTR },
      ko: { translation: translationKO },
    },
    lng: detectedLanguage,
    fallbackLng: "en",
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "language",
    },
  });

// Save detected language to localStorage
localStorage.setItem("language", detectedLanguage);

export default i18n;
