'use client';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Download, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { useEvent, useDownloadEventIcs } from '@/lib/hooks/event-hooks';
import { useDateFormat } from '@/lib/utils/date';
import type { EventType } from '@/types/event';

const EVENT_TYPE_STYLES: Record<EventType, string> = {
    meeting:  'border-primary text-primary',
    deadline: 'border-warning text-warning',
    exam:     'border-error text-error',
};

export default function EventDetailPage() {
    const t = useTranslations('event.detail');
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const { formatDateTime } = useDateFormat();
    const { data: event, isPending, isError } = useEvent(slug, id);
    const { mutate: downloadIcs, isPending: isDownloading } = useDownloadEventIcs(slug, id);

    if (isPending) {
        return (
            <PageContainer>
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </PageContainer>
        );
    }

    if (isError || !event) {
        return (
            <PageContainer>
                <div className="w-full max-w-4xl space-y-4">
                    <p className="text-sm text-error">{t('errorLoad')}</p>
                    <Link
                    href={`/workspaces/${slug}`}
                    className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('back')}
                    </Link>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-6">
                {/* Back */}
                <Link
                href={`/workspaces/${slug}`}
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('back')}
                </Link>

                {/* Card */}
                <div 
                className={`rounded-xl border-l-4 p-6 space-y-4 bg-bg-card border text-red
                    ${EVENT_TYPE_STYLES[event.type] ?? 'border-border text-text'}
                `}>

                    {/* Type + title */}
                    <div className="space-y-2">
                        <span
                        className={`inline-block text-xs font-semibold px-2 py-1 rounded-full bg-bg hover:bg-bg-hover border
                        ${EVENT_TYPE_STYLES[event.type] ?? 'border-border text-text'}`}>
                            {t(`type.${event.type}`)}
                        </span>
                        <h2>{event.title}</h2>
                    </div>

                    {/* Meta */}
                    <div className="space-y-2 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>{formatDateTime(event.startsAt)}</span>
                        </div>
                        {event.endsAt && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>{t('until')} {formatDateTime(event.endsAt)}</span>
                            </div>
                        )}
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="pt-2 border-t border-border">
                            <p className="text-md text-text whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}

                    {/* ICS download */}
                    <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-text-secondary">
                            {t('createdBy')}: {event.userName ?? t('unknownUser')}
                        </p>
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
            </div>
        </PageContainer>
    );
}
