'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Loader2, MapPin } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/lib/queries/workspaces';
import { canModerate } from '@/lib/permissions/client';
import { useCreateEvent, type CreateEventData } from '@/lib/hooks/event-hooks';
import { customToast } from '@/components/CustomToast';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';
import type { EventType } from '@/types/event';

const EVENT_TYPES: EventType[] = ['meeting', 'deadline', 'exam'];

const EVENT_TYPE_STYLES: Record<EventType, string> = {
    meeting:  'border-primary text-primary',
    deadline: 'border-warning text-warning',
    exam:     'border-error text-error',
};

function toISOIfSet(local: string): string | undefined {
    if (!local) return undefined;
    return new Date(local).toISOString();
}

export default function NewEventPage() {
    const t = useTranslations('event.new');
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();

    const { data: workspace, isPending: wsLoading, isError: wsError } = useWorkspace(slug);
    const canMod = canModerate(workspace?.role);
    const createEvent = useCreateEvent(slug);

    const [type, setType]             = useState<EventType>('meeting');
    const [title, setTitle]           = useState('');
    const [description, setDesc]      = useState('');
    const [location, setLocation]     = useState('');
    const [startsAt, setStartsAt]     = useState('');
    const [endsAt, setEndsAt]         = useState('');

    if (wsLoading) return <WorkspacePending />;
    if (wsError || !workspace) return <WorkspaceError errorMessage={t('errorLoad')} />;

    if (!canMod) {
        router.replace(`/workspaces/${slug}`);
        return null;
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!title.trim() || !startsAt) return;

        const data: CreateEventData = {
            type,
            title:          title.trim(),
            description:    description.trim() || undefined,
            location:       location.trim()    || undefined,
            startsAt:       new Date(startsAt).toISOString(),
            endsAt:         toISOIfSet(endsAt),
        };

        createEvent.mutate(data, {
            onSuccess: () => {
                customToast.success(t('success'));
                router.push(`/workspaces/${slug}`);
            },
            onError: () => customToast.error(t('error')),
        });
    }

    const isSubmitting = createEvent.isPending;

    return (
        <PageContainer>
            <div className="w-full max-w-2xl space-y-6">
                <h2>{t('title')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Type selector */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('type')}</label>
                        <div className="flex gap-2 flex-wrap">
                            {EVENT_TYPES.map(et => (
                                <Button
                                key={et}
                                variant="outline"
                                onClick={() => setType(et)}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                                    ${type === et
                                        ? EVENT_TYPE_STYLES[et]
                                        : 'border-border text-text-muted bg-bg-muted hover:border-border-hover hover:text-text hover:bg-bg-hover'
                                    }`}
                                >
                                    {t(`type${et.charAt(0).toUpperCase() + et.slice(1)}`)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('eventTitle')}</label>
                        <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t('eventTitlePlaceholder')}
                        required
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('description')}</label>
                        <Textarea
                        value={description}
                        onChange={e => setDesc(e.target.value)}
                        placeholder={t('descriptionPlaceholder')}
                        rows={3}
                        className="w-full bg-bg border border-border rounded-md px-4 py-2 text-sm text-text placeholder:text-muted"
                        />
                    </div>

                    {/* Location */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('location')}</label>
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <InputGroupText>
                                    <MapPin className="w-4 h-4" />
                                </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder={t('locationPlaceholder')}
                            />
                        </InputGroup>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-col space-y-2 gap-2">
                        <div>
                            <label className="text-sm font-medium text-text">{t('startsAt')} *</label>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <InputGroupText>
                                        <Calendar className="w-4 h-4" />
                                    </InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                type="datetime-local"
                                value={startsAt}
                                onChange={e => setStartsAt(e.target.value)}
                                required
                                />
                            </InputGroup>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text">{t('endsAt')}</label>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <InputGroupText>
                                        <Clock className="w-4 h-4" />
                                    </InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                type="datetime-local"
                                value={endsAt}
                                onChange={e => setEndsAt(e.target.value)}
                                min={startsAt || undefined}
                                />
                            </InputGroup>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push(`/workspaces/${slug}`)}
                        disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                        type="submit"
                        disabled={!title.trim() || !startsAt || isSubmitting}
                        className="text-text-contrast"
                        >
                            {isSubmitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" />{t('publishing')}</>
                                : t('publish')
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </PageContainer>
    );
}
