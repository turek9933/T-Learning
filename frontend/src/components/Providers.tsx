"use client"

import { ThemeProvider } from "@/components/ThemeProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
    <ThemeProvider>
        {children}
    </ThemeProvider>
  );
}