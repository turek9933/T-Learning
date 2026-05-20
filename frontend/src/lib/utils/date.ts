'use client';
import { useLocale } from 'next-intl';

export function formatDateTime(iso: string, locale: string): string {
    return new Date(iso).toLocaleString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatShortDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatTime(iso: string, locale: string): string {
    return new Date(iso).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDayMonth(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
    });
}

export function formatEventDateRange(startsAt: string, endsAt: string | null, locale: string): string {
    const dateStartStr = formatShortDate(startsAt, locale);
    const timeStartStr = formatTime(startsAt, locale);
    if (!endsAt) return `${dateStartStr}, ${timeStartStr}`;
    const dateEndStr = formatShortDate(endsAt, locale);
    const timeEndStr = formatTime(endsAt, locale);
    return `${dateStartStr}, ${timeStartStr} – ${dateEndStr === dateStartStr ? '' : dateEndStr + ', '} ${timeEndStr}`;
}

export function useDateFormat() {
    const locale = useLocale();
    return {
        formatDateTime:       (iso: string) => formatDateTime(iso, locale),
        formatShortDate:      (iso: string) => formatShortDate(iso, locale),
        formatTime:           (iso: string) => formatTime(iso, locale),
        formatDayMonth:       (iso: string) => formatDayMonth(iso, locale),
        formatEventDateRange: (startsAt: string, endsAt: string | null) => formatEventDateRange(startsAt, endsAt, locale),
        locale,
    };
}
