"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "accessible";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as Theme | null;

        if (savedTheme && ["light", "dark", "accessible"].includes(savedTheme)) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        } else {
            applyTheme("light");
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement;

        root.classList.remove("light", "dark", "accessible");

        root.classList.add(theme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}