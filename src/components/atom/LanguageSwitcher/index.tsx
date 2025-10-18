import React, { useState } from "react";
import { useLanguage } from "../../../app/contexts/LanguageContext";

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = availableLanguages.find((lang) => lang.code === language);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as any);
    setIsOpen(false);
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  const handleBackdropKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-pink dark:text-dark-text-secondary dark:hover:bg-dark-bg-tertiary dark:hover:text-pink"
        aria-label="Select language"
      >
        <span>{currentLanguage?.nativeName || "English"}</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Close language menu"
          />

          {/* Dropdown */}
          <div className="absolute bottom-full right-0 z-20 mb-2 max-h-64 w-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-dark-border-primary dark:bg-dark-bg-secondary">
            <div className="py-1">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors duration-200 ${
                    language === lang.code
                      ? "bg-pink/10 text-pink dark:bg-pink/20 dark:text-pink"
                      : "text-gray-700 hover:bg-gray-50 dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-gray-500 dark:text-dark-text-secondary">{lang.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
