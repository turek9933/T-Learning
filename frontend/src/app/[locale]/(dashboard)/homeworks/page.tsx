'use client';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Circle, Clock, AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageContainer } from '@/components/layout/PageContainer';
import { useMyHomeworks } from '@/lib/hooks/homework-hooks';
import type { MyHomework } from '@/types/homework';
import { useDateFormat } from '@/lib/utils/date';

type DueStatus = 'submitted' | 'overdue' | 'today' | 'soon' | 'upcoming' | 'noduedate';

function getDueStatus(hw: MyHomework): DueStatus {
    if (hw.submittedAt) return 'submitted';
    if (!hw.dueAt) return 'noduedate';

    const now = new Date();
    const due = new Date(hw.dueAt);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'overdue';
    if (diffDays < 1) return 'today';
    if (diffDays < 3) return 'soon';
    return 'upcoming';
}
const STATUS_ORDER: DueStatus[] = ['overdue', 'today', 'soon', 'upcoming', 'noduedate', 'submitted'];

function HomeworkRow({ hw }: { hw: MyHomework }) {
    const t = useTranslations('homework');
    const { formatShortDate } = useDateFormat();
    const status = getDueStatus(hw);

    const statusConfig = {
        submitted:  { icon: CheckCircle2, color: 'text-success',      label: t('submitted') },
        overdue:    { icon: AlertCircle,  color: 'text-error',        label: t('overdue') },
        today:      { icon: AlertCircle,  color: 'text-warning',      label: t('dueToday') },
        soon:       { icon: Clock,        color: 'text-text',         label: '' },
        upcoming:   { icon: Circle,       color: 'text-text-muted',   label: '' },
        noduedate:  { icon: Circle,       color: 'text-text-muted',   label: t('noDueDate') },
    }[status];

    const Icon = statusConfig.icon;

    const dueLabel = (() => {
        if (statusConfig.label) return statusConfig.label;
        if (!hw.dueAt) return '';
        const now = new Date();
        const due = new Date(hw.dueAt);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return t('dueInDays', { days: diffDays });
    })();

    const dueDate = hw.dueAt ? formatShortDate(hw.dueAt) : null;

    return (
        <Link
        href={`/workspaces/${hw.workspaceSlug}/homeworks/${hw.id}`}
        className={`
        flex items-center gap-4 p-3 rounded-lg border border-border bg-bg
        hover:bg-bg-card transition-colors
        ${status === 'submitted' ? 'opacity-80' : ''}
        `}
        >
            <Icon className={`w-5 h-5 shrink-0 ${statusConfig.color}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${status === 'submitted' ? 'line-through text-text-muted' : 'text-text'}`}>
                    {hw.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {hw.workspaceName}
                    </span>
                    {dueDate && (
                        <span className={`text-xs ${statusConfig.color}`}>
                            {dueLabel ? `${dueLabel}: ` : ''}{dueDate}
                        </span>
                    )}
                    {!dueDate && statusConfig.label && (
                        <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function HomeworkPage() {
    const t = useTranslations('homework.list');
    const { data: homeworks = [], isPending, isError } = useMyHomeworks();

    const sorted = useMemo(() => {
        return [...homeworks].sort((a, b) => {
            const sa = STATUS_ORDER.indexOf(getDueStatus(a));
            const sb = STATUS_ORDER.indexOf(getDueStatus(b));
            if (sa !== sb) return sa - sb;
            if (!a.dueAt && !b.dueAt) return 0;
            if (!a.dueAt) return 1;
            if (!b.dueAt) return -1;
            return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        });
    }, [homeworks]);

    const pending  = sorted.filter(hw => getDueStatus(hw) !== 'submitted');
    const done     = sorted.filter(hw => getDueStatus(hw) === 'submitted');

    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-6">
                <h2>{t('title')}</h2>

                {isPending && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                )}

                {isError && (
                    <p className="text-sm text-error">{t('errorLoad')}</p>
                )}

                {!isPending && !isError && (
                    <>
                        {pending.length === 0 && done.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
                                <CheckCircle2 className="w-8 h-8" />
                                <p className="text-sm">{t('empty')}</p>
                            </div>
                        )}

                        {pending.length > 0 && (
                            <section className="space-y-2">
                                <p className="text-xs font-semibold text-text-muted">{t('pending')} ({pending.length})</p>
                                {pending.map(hw => <HomeworkRow key={hw.id} hw={hw} />)}
                            </section>
                        )}

                        {done.length > 0 && (
                            <section className="space-y-2">
                                <p className="text-xs font-semibold text-text-muted">{t('done')} ({done.length})</p>
                                {done.map(hw => <HomeworkRow key={hw.id} hw={hw} />)}
                            </section>
                        )}
                    </>
                )}
            </div>
        </PageContainer>
    );
}