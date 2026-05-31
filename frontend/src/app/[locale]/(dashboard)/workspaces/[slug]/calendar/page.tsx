'use client';
import '@/components/calendar/calendar.css';
import { useState, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import plLocale from '@fullcalendar/core/locales/pl';
import itLocale from '@fullcalendar/core/locales/it';

import { PageContainer } from '@/components/layout/PageContainer';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { useWorkspaceEvents } from '@/lib/hooks/event-hooks';
import { useWorkspaceHomeworks } from '@/lib/hooks/homework-hooks';
import { useRouter } from '@/i18n/routing';

const EVENT_STYLE: Record<string, { bg: string; fg: string }> = {
    meeting:  { bg: 'var(--color-primary-subtle)', fg: 'var(--color-primary)'  },
    deadline: { bg: 'var(--color-warning-subtle)', fg: 'var(--color-warning)'  },
    exam:     { bg: 'var(--color-error-subtle)',   fg: 'var(--color-error)'    },
};
const HW_STYLE = { bg: 'var(--color-accent-subtle)', fg: 'var(--color-accent)' };
const HW_PREFIX = 'hw:';
const EV_PREFIX = 'ev:';
const FC_LOCALES = [plLocale, itLocale];

function initialRange() {
    const now = new Date();
    return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        to:   new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString(),
    };
}

export default function WorkspaceCalendarPage() {
    const t = useTranslations('calendar');
    const router = useRouter();
    const locale = useLocale();
    const { slug } = useParams<{ slug: string }>();

    const calendarRef = useRef<FullCalendar>(null);
    const [view, setView]   = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');
    const [title, setTitle] = useState('');
    const [{ from, to }, setRange] = useState(initialRange);

    const { data: events    = [] } = useWorkspaceEvents(slug, from, to);
    const { data: homeworks = [] } = useWorkspaceHomeworks(slug, from, to);

    const calendarEvents = useMemo<EventInput[]>(() => [
        ...events.map(ev => {
            const style = EVENT_STYLE[ev.type] ?? EVENT_STYLE.meeting;
            return {
                id:    `${EV_PREFIX}${ev.id}`,
                title: ev.title,
                start: ev.startsAt,
                end:   ev.endsAt ?? ev.startsAt,
                extendedProps: {
                    kind:       'event',
                    originalId: ev.id,
                    bg:         style.bg,
                    fg:         style.fg,
                },
            };
        }),
        ...homeworks
            .filter(hw => hw.dueAt)
            .map(hw => ({
                id:     `${HW_PREFIX}${hw.id}`,
                title:  hw.title,
                start:  hw.dueAt!,
                end:    hw.dueAt!,
                allDay: true,
                extendedProps: {
                    kind:       'homework',
                    originalId: hw.id,
                    bg:         HW_STYLE.bg,
                    fg:         HW_STYLE.fg,
                },
            })),
    ], [events, homeworks]);

    function handleDatesSet(arg: DatesSetArg) {
        setTitle(arg.view.title);
        setRange({
            from: new Date(arg.view.activeStart.getFullYear(), arg.view.activeStart.getMonth() - 1, 1).toISOString(),
            to:   new Date(arg.view.activeEnd.getFullYear(), arg.view.activeEnd.getMonth() + 1, 0, 23, 59, 59).toISOString(),
        });
    }

    function handleEventClick(arg: EventClickArg) {
        const id = arg.event.id;
        if (id.startsWith(HW_PREFIX)) {
            const hwId = id.slice(HW_PREFIX.length);
            router.push(`/workspaces/${slug}/homeworks/${hwId}`);
        } else {
            const evId = id.slice(EV_PREFIX.length);
            router.push(`/workspaces/${slug}/events/${evId}`);
        }
    }

    function handleViewChange(newView: 'dayGridMonth' | 'timeGridWeek') {
        setView(newView);
        calendarRef.current?.getApi().changeView(newView);
    }

    return (
        <PageContainer>
            <div className="w-full space-y-4">
                <h2>{t('pageTitle')}</h2>

                <div className="rounded-xl border border-border bg-bg">
                    <CalendarHeader
                    calendarRef={calendarRef}
                    title={title}
                    view={view}
                    onViewChange={handleViewChange}
                    />
                    <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin]}
                    initialView="dayGridMonth"
                    locales={FC_LOCALES}
                    locale={locale}
                    headerToolbar={false}
                    events={calendarEvents}
                    datesSet={handleDatesSet}
                    eventClick={handleEventClick}
                    editable={false}
                    selectable={false}
                    firstDay={1}
                    height="auto"
                    slotMinTime="07:00:00"
                    slotMaxTime="21:00:00"
                    dayMaxEvents={3}
                    eventBackgroundColor="transparent"
                    eventBorderColor="transparent"
                    eventContent={(arg) => {
                        const bg = arg.event.extendedProps.bg as string;
                        const fg = arg.event.extendedProps.fg as string;
                        return (
                            <div
                            style={{ backgroundColor: bg, color: fg, borderLeft: `2px solid ${fg}` }}
                            className="px-2 py-0.5 text-xs font-medium truncate leading-tight w-full rounded-sm cursor-pointer"
                            >
                                {arg.event.title}
                            </div>
                        );
                    }}
                    />
                </div>

                <CalendarLegend />
            </div>
        </PageContainer>
    );
}
