import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "dark" }: { children: React.ReactNode; defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme: () => setThemeState(p => p === "light" ? "dark" : "light"),
      setTheme: (t: Theme) => setThemeState(t),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
