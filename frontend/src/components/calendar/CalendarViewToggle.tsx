'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { CalendarView } from '@ilamy/calendar';

interface CalendarViewToggleProps {
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
}

export function CalendarViewToggle({ view, onViewChange }: CalendarViewToggleProps) {
    const t = useTranslations('calendar');
    return (
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-card p-1">
            <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('month')}
            >
                {t('monthView')}
            </Button>
            <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('week')}
            >
                {t('weekView')}
            </Button>
        </div>
    );
}
