"use client";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    // Re-sync when a background tab regains focus
    document.addEventListener("visibilitychange", callback);

    return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
        document.removeEventListener("visibilitychange", callback);
    };
}

function getSnapshot(): boolean {
    return navigator.onLine;
}

function getServerSnapshot(): boolean {
    return true;// Always show "Online" for server-generated HTML

}

export function useOnline(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}