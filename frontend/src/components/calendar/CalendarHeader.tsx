'use client';
import type { RefObject } from 'react';
import type FullCalendar from '@fullcalendar/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface Props {
    calendarRef: RefObject<FullCalendar | null>;
    title: string;
    view: 'dayGridMonth' | 'timeGridWeek';
    onViewChange: (view: 'dayGridMonth' | 'timeGridWeek') => void;
}

export function CalendarHeader({ calendarRef, title, view, onViewChange }: Props) {
    const t = useTranslations('calendar');

    function api() {
        return calendarRef.current?.getApi();
    }

    return (
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border flex-wrap">
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => api()?.prev()}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => api()?.today()}>
                    {t('today')}
                </Button>
                <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => api()?.next()}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="ml-2 text-sm font-medium text-text capitalize">{title}</span>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-card p-1">
                <Button
                variant={view === 'dayGridMonth' ? 'default' : 'ghost'}
                size="sm"
                className={`cursor-pointer ${view === 'dayGridMonth' ? 'text-text-contrast' : ''}`}
                onClick={() => onViewChange('dayGridMonth')}
                >
                    {t('monthView')}
                </Button>
                <Button
                    variant={view === 'timeGridWeek' ? 'default' : 'ghost'}
                    size="sm"
                    className={`cursor-pointer ${view === 'timeGridWeek' ? 'text-text-contrast' : ''}`}
                    onClick={() => onViewChange('timeGridWeek')}
                >
                    {t('weekView')}
                </Button>
            </div>
        </div>
    );
}
