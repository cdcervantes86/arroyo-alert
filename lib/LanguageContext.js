"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("arroyo-lang");
      if (saved === "en" || saved === "es") setLang(saved);
    } catch (e) {}
  }, []);

  const toggleLang = () => {
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    try { localStorage.setItem("arroyo-lang", next); } catch (e) {}
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
