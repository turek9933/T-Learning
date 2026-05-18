'use client';
import { useTranslations } from 'next-intl';
import { ClipboardList, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { HomeworkItem } from '@/types/homework';

function formatDueDate(dueAt: string | null, t: (key: string) => string): { label: string; urgent: boolean } {
    if (!dueAt) return { label: t('noDue'), urgent: false };

    const due = new Date(dueAt);
    const now = new Date();

    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const dateStr = due.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    if (diffMs < 0) return { label: t('overdue'), urgent: true };
    if (diffDays <= 1) return { label: `${t('dueIn')} < 1 ${t('day')}`, urgent: true };
    if (diffDays <= 3) return { label: `${t('dueIn')} ${diffDays} ${t('days')}`, urgent: true };
    return { label: dateStr, urgent: false };
}

export function HomeworkCard({ slug, homework }: { slug: string, homework: HomeworkItem }) {
    const t = useTranslations('homework');
    const { label: dueLabel, urgent } = formatDueDate(homework.dueAt, t);

    return (
        <div className="bg-bg border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-accent shrink-0" />
                    <Link
                    href={`/workspaces/${slug}/homeworks/${homework.id}`}
                    className="text-sm font-semibold text-text hover:text-primary hover:underline"
                    >
                        {homework.title}
                    </Link>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${urgent ? 'text-warning' : 'text-text-muted'}`}>
                    <Clock className="w-4 h-4" />
                    {dueLabel}
                </span>
            </div>

            {homework.description && (
                <p className="text-sm text-text-secondary line-clamp-3">{homework.description}</p>
            )}

            <div className="pt-1">
                <Link
                href={`/workspaces/${slug}/homeworks/${homework.id}`}
                className="text-xs text-primary hover:underline"
                >
                    {t('details')}
                </Link>
            </div>
        </div>
    );
}