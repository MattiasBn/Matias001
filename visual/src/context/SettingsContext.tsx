"use client";

import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import React from "react";
import { useAuth } from "@/context/AuthContext"; // ← sincronização com auth

// --- Tipos ---
type Theme = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";

interface Settings {
  theme: Theme;
  font_size: FontSize;
  timezone: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

// Defaults
const INITIAL_SETTINGS_DEFAULTS: Settings = {
  theme: "system",
  font_size: "medium",
  timezone: "Africa/Luanda",
  language: "pt",
  email_notifications: true,
  push_notifications: false,
};

const LOCAL_STORAGE_KEY = "userSettings";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// --- Aplicadores ---
const applyTheme = (theme: Theme) => {
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
};

const applyFontSize = (font_size: FontSize) => {
  document.documentElement.style.fontSize =
    font_size === "small" ? "14px" : font_size === "medium" ? "16px" : "18px";
};

// --- Provider ---
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth(); // ← só carrega settings quando user existir

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 1️⃣ Load inicial — somente após login completo
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const load = async () => {
      setLoading(true);

      try {
        // 1. pega localStorage
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          setSettings(parsed);
          applyTheme(parsed.theme);
          applyFontSize(parsed.font_size);
        }

        // 2. pega do backend
        const res = await api.get("/settings");

        const backend = res.data || {};
        const finalSettings = {
          ...INITIAL_SETTINGS_DEFAULTS,
          ...backend,
        };

        // atualiza state
        setSettings(finalSettings);

        // aplica estilos
        applyTheme(finalSettings.theme);
        applyFontSize(finalSettings.font_size);

        // salva no localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalSettings));

      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, user]); // ← sincronizado com Auth

  // --- 2️⃣ Atualizar configuração
  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };

    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));

    // aplica estilo
    if (key === "theme") applyTheme(value as Theme);
    if (key === "font_size") applyFontSize(value as FontSize);

    try {
      await api.put("/settings", { [key]: value });
    } catch (err) {
      console.error("Erro ao salvar no backend:", err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

// hook
export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
