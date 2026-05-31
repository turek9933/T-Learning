"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useOnline } from "@/lib/hooks/use-online";
import { customToast } from "@/components/CustomToast";

export function ConnectionIndicator() {
    const t = useTranslations("components.indicator");
    const isOnline = useOnline();
    const previousRef = useRef<boolean | null>(null);

    useEffect(() => {
        // Skip toast on first mount
        if (previousRef.current === null) {
            previousRef.current = isOnline;
            return;
        }
        if (previousRef.current === isOnline) return;
        previousRef.current = isOnline;

        if (isOnline) {
            customToast.success(t("successOnline"), { id: "connection-status" });
        } else {
            customToast.warning(t("warningOffline"), { id: "connection-status" });
        }
    }, [isOnline, t]);

    return (
        <span
        role="status"
        className="inline-flex items-center justify-center"
        title={isOnline ? t("online") : t("offline")}
        aria-label={isOnline ? t("online") : t("offline")}
        >
            <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
                isOnline ? "bg-success" : "bg-warning"
            }`}
            />
        </span>
    );
}
