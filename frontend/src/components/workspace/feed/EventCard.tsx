'use client';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Download, MapPin, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { EventItem } from '@/types/event';
import { env } from '@/lib/env';
import { useDateFormat } from '@/lib/utils/date';
import { useDownloadEventIcs } from '@/lib/hooks/event-hooks';
import { Button } from '@/components/ui/button';

const EVENT_TYPE_COLORS = {
    meeting:  'text-primary border-primary',
    deadline: 'text-warning border-warning',
    exam:     'text-error border-error',
};

export function EventCard({ slug, event }: { slug: string, event: EventItem }) {
    const t = useTranslations('event');
    const { formatEventDateRange } = useDateFormat();
    const { mutate: downloadIcs, isPending: isDownloading } = useDownloadEventIcs(slug, event.id);

    const colorClass = EVENT_TYPE_COLORS[event.eventType] ?? EVENT_TYPE_COLORS.meeting;

    return (
        <div className="bg-bg border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <Link
                    href={`/workspaces/${slug}/events/${event.id}`}
                    className="text-sm font-semibold text-text hover:text-primary hover:underline"
                    >
                        {event.title}
                    </Link>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${colorClass}`}>
                    {t(`type.${event.eventType}`)}
                </span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatEventDateRange(event.startsAt, event.endsAt)}
                </span>
                {event.location && (
                    <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                    </span>
                )}
            </div>

            {event.description && (
                <p className="text-sm text-text-secondary line-clamp-2">{event.description}</p>
            )}

            <div className="flex items-center justify-between pt-1">
                <Link
                href={`/workspaces/${slug}/events/${event.id}`}
                className="text-xs text-primary hover:underline"
                >
                    {t('details')}
                </Link>
                <Button
                variant="outline"
                size="sm"
                className='text-text hover:text-text-contrast cursor-pointer'
                disabled={isDownloading}
                onClick={() => downloadIcs(`${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`)}
                >
                    {isDownloading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4" />
                    }
                    {t('downloadIcs')}
                </Button>
            </div>
        </div>
    );
}