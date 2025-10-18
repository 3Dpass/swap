import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type SupportedLanguage =
  | "en"
  | "zh"
  | "de"
  | "fr"
  | "ru"
  | "it"
  | "es"
  | "ja"
  | "pt"
  | "hi"
  | "ar"
  | "tr"
  | "ko";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  availableLanguages: Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // Get current language from i18n or fallback to English
    return (i18n.language as SupportedLanguage) || "en";
  });

  const availableLanguages: Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
  }> = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
  ];

  const setLanguage = (newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  useEffect(() => {
    // Listen for language changes from i18n
    const handleLanguageChange = (lng: string) => {
      setLanguageState(lng as SupportedLanguage);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
