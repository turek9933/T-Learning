"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

// Cache last-known user id, used as a fallback when `useSession` returns null offline
const STORAGE_KEY = "last-known-user-id";

export function useCurrentUserId(): string | null {
    const { data: session } = authClient.useSession();
    const [cached, setCached] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setCached(stored);
    }, []);
    
    useEffect(() => {
        if (typeof window === "undefined") return;
        const userId = session?.user?.id;
        if (userId) {
            window.localStorage.setItem(STORAGE_KEY, userId);
            setCached(userId);
        }
    }, [session?.user?.id]);

    return session?.user?.id ?? cached;
}