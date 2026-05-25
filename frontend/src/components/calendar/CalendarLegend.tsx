'use client';
import { useTranslations } from 'next-intl';

const LEGEND_ITEMS = [
    { key: 'typeMeeting',      color: 'bg-primary' },
    { key: 'typeDeadline',     color: 'bg-warning' },
    { key: 'typeExam',         color: 'bg-error' },
    { key: 'homeworkDeadline', color: 'bg-accent' },
] as const;

export function CalendarLegend() {
    const t = useTranslations('calendar');
    return (
        <div className="flex items-center gap-6 text-xs text-text-secondary flex-wrap">
            {LEGEND_ITEMS.map(({ key, color }) => (
                <span key={key} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    {t(key)}
                </span>
            ))}
        </div>
    );
}