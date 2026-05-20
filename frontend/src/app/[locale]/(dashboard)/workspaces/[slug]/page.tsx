'use client';
import { useTranslations } from 'next-intl';
import { usePathname, useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useWorkspace, useActivateWorkspace } from '@/lib/queries/workspaces';
import { useFeed, useUpcomingEvents, useUpcomingHomeworks } from '@/lib/hooks/feed-hooks';
import type { FeedItem } from '@/types/feed';
import type { UpcomingEvent } from '@/types/event';
import type { UpcomingHomework } from '@/types/homework';
import { PageContainer } from '@/components/layout/PageContainer';
import { customToast } from '@/components/CustomToast';
import {
    Calendar, CalendarPlus, Clock, FileText, Loader2,
    NotebookPen, Plus, SquarePen, User, Users,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';
import { useQueryClient } from '@tanstack/react-query';
import { PostCard } from '@/components/workspace/feed/PostCard';
import { EventCard } from '@/components/workspace/feed/EventCard';
import { HomeworkCard } from '@/components/workspace/feed/HomeworkCard';
import { useDateFormat } from '@/lib/utils/date';

function WorkspaceTabs({ slug }: { slug: string }) {
    const t = useTranslations('workspace.tabs');
    const pathname = usePathname();

    const isActive = (href: string) => {
        const path = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
        return path === href || path.startsWith(href + '/');
    };

    const tabs = [
        { key: 'main',     href: `/workspaces/${slug}`,          label: t('main') },
        { key: 'members',  href: `/workspaces/${slug}/members`,  label: t('members') },
        { key: 'settings', href: `/workspaces/${slug}/settings`, label: t('settings') },
        { key: 'files',    href: `/workspaces/${slug}/files`,    label: t('files') },
    ];

    return (
        <div className='md:hidden flex items-center gap-2 mb-4'>
            {tabs.map(({ key, href, label }) => (
                <Link
                key={key}
                href={href}
                className={`hover:text-text px-2 hover:border-b-2 hover:border-border-hover
                    ${isActive(href) ? 'text-text border-b-2 border-border-focus' : 'text-text-muted'}`}
                >
                    {label}
                </Link>
            ))}
        </div>
    );
}

type UpcomingItem =
    | { type: 'event'; data: UpcomingEvent }
    | { type: 'homework'; data: UpcomingHomework };

function UpcomingSection({ slug }: { slug: string }) {
    const t = useTranslations('workspace.upcoming');
    const { formatDayMonth } = useDateFormat();
    const { data: events = [] } = useUpcomingEvents(slug);
    const { data: homeworks = [] } = useUpcomingHomeworks(slug);

    const now = Date.now();
    const twoWeeks = now + 14 * 24 * 60 * 60 * 1000;

    // Filter out events and homeworks that have already happened
    // Sort by event date and homework due date
    // Take first 5 upcoming items
    const eventItems: UpcomingItem[] = events
        .filter(e => new Date(e.startsAt).getTime() >= now)
        .map(e => ({ type: 'event', data: e }));

    const homeworkItems: UpcomingItem[] = homeworks
        .filter(h => h.dueAt && !h.submittedAt && new Date(h.dueAt).getTime() <= twoWeeks)
        .map(h => ({ type: 'homework', data: h }));

    const items = [...eventItems, ...homeworkItems]
        .sort((a, b) => {
            const dateA = a.type === 'event'
                ? new Date(a.data.startsAt).getTime()
                : new Date(a.data.dueAt!).getTime();
            const dateB = b.type === 'event'
                ? new Date(b.data.startsAt).getTime()
                : new Date(b.data.dueAt!).getTime();
            return dateA - dateB;
        })
        .slice(0, 5);

    if (items.length === 0) return null;

    function formatUpcomingDate(dateStr: string): string {
        const diffDays = Math.ceil((new Date(dateStr).getTime() - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return t('today');
        if (diffDays === 1) return t('tomorrow');
        return formatDayMonth(dateStr);
    }

    return (
        <div className="bg-bg rounded-xl border border-border my-2 p-1 w-full">
            <div className="flex items-center justify-center py-1 border-b border-border">
                <Link
                href={`/workspaces/${slug}/calendar`}
                className="text-primary font-semibold hover:underline flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    {t('title')}
                </Link>
            </div>
            <div>
                {items.map((item, idx) => {
                    if (item.type === 'event') {
                        const e = item.data;
                        return (
                            <div
                            key={`e-${e.id}`}
                            className="grid grid-cols-3 items-center border-b border-border"
                            >
                                <span className="flex items-center gap-1 font-normal text-sm text-text-secondary px-2 py-1">
                                    <Calendar className="w-3 h-3" />
                                    {t(`upcomingType.${e.type}`)}
                                </span>
                                <Link
                                href={`/workspaces/${slug}/events/${e.id}`}
                                className="text-sm font-medium text-text text-center hover:text-primary hover:underline"
                                >
                                    {e.title}
                                </Link>
                                <span className="text-sm text-text-secondary text-right px-2 py-1">
                                    {formatUpcomingDate(e.startsAt)}
                                </span>
                            </div>
                        );
                    } else {
                        const h = item.data;
                        return (
                            <div
                            key={`h-${h.id}`}
                            className="grid grid-cols-3 items-center border-b border-border"
                            >
                                <span className="flex items-center gap-1 font-normal text-sm text-text-secondary px-2 py-1">
                                    <NotebookPen className="w-3 h-3" />
                                    {t('homework')}
                                </span>
                                <Link
                                href={`/workspaces/${slug}/homeworks/${h.id}`}
                                className="text-sm font-medium text-text text-center hover:text-primary hover:underline"
                                >
                                    {h.title}
                                </Link>
                                <span className="text-sm text-text-secondary text-right px-2 py-1">
                                    {h.dueAt ? formatUpcomingDate(h.dueAt) : '—'}
                                </span>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
}

function FeedList({ slug, canModerate, canParticipate, workspaceActive, items }: {
    slug: string;
    canModerate: boolean;
    canParticipate: boolean;
    workspaceActive: boolean;
    items: FeedItem[];
}) {
    // Separate non-pinned items and pinned items
    const nonPinnedItems = items.filter(item => !(item.type === 'post' && item.pinned));
    const pinnedItems = items.filter(item => item.type === 'post' && item.pinned);

    console.log(pinnedItems);

    // Pinned items at the end
    const orderedItems = [...nonPinnedItems, ...pinnedItems];

    return (
        <div className="space-y-3 w-full">
            {orderedItems.map(item => {
                if (item.type === 'post') {
                    return (
                        <PostCard
                        key={item.id}
                        slug={slug}
                        post={item}
                        canModerate={canModerate}
                        canParticipate={canParticipate}
                        workspaceActive={workspaceActive}
                        />
                    );
                }
                if (item.type === 'event') {
                    return <EventCard key={item.id} slug={slug} event={item} />;
                } else if (item.type === 'homework') {   
                    return <HomeworkCard key={item.id} slug={slug} homework={item} />;
                } else {
                    return null;
                }
            })}
        </div>
    );
}

export default function WorkspacePage() {
    const t = useTranslations('workspace.main');
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: workspace, isPending, isError } = useWorkspace(slug);
    const activateWorkspace = useActivateWorkspace(workspace?.slug!, workspace?.id!);
    const { data: feedData, isPending: feedLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(slug);

    const canModerate = workspace?.role === 'owner' || workspace?.role === 'admin';
    const canParticipate = canModerate || workspace?.role === 'member';

    const avatarColor: Record<string, string> = {
        owner:  'text-accent',
        admin:  'text-accent',
        member: 'text-primary',
        viewer: 'text-text-muted',
    };

    const handleActivate = () => {
        console.log('handleActivate\t', workspace);
        if (!workspace) {
            customToast.error(t('errorStatus'));
            return;
        }
        activateWorkspace.mutate(undefined, {
            onSuccess: () => {
                customToast.success(t('successStatusActive'));
            },
            onError: () => customToast.error(t('errorStatus')),
        });
    }

    if (isPending) return <WorkspacePending />;
    if (isError || !workspace) return <WorkspaceError errorMessage={t('errorLoad')} />;

    const feedItems = feedData?.pages.flat() ?? [];

    return (
        <PageContainer>
            <WorkspaceTabs slug={slug} />

            {/* Header */}
            <div className="flex flex-row w-full flex-auto gap-4 items-center justify-center">
                {workspace.type === 'group'
                    ? <Users className={`w-6 h-6 ${avatarColor[workspace.role]}`} />
                    : <User  className={`w-6 h-6 ${avatarColor[workspace.role]}`} />
                }
                <h2 className="text-text">{workspace.name}</h2>
                <StatusBadge status={workspace.status} size='6' />
            </div>
            {workspace.description && (
                <div className="text-center max-w-md">
                    <p className="text-text-secondary">{workspace.description}</p>
                </div>
            )}

            {/* Additional content for owner and admin */}
            {canModerate && (
                <>
                    <div className="flex flex-row w-full flex-auto gap-4 items-center justify-center my-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="cursor-pointer gap-2">
                                    <p>{t('addContent')}</p>
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/workspaces/${slug}/posts/new`)}
                                >
                                    <SquarePen className="w-4 h-4" />
                                    <span className="ml-2">{t("addPost")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/workspaces/${slug}/events/new`)}
                                >
                                    <CalendarPlus className="w-4 h-4" />
                                    <span className="ml-2">{t('addEvent')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/workspaces/${slug}/homeworks/new`)}
                                >
                                    <NotebookPen className="w-4 h-4" />
                                    <span className="ml-2">{t('addHomework')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`/workspaces/${slug}/materials`)}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="ml-2">{t('addFile')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                        variant="ghost"
                        className="text-text cursor-pointer gap-2"
                        onClick={() => router.push(`/workspaces/${slug}/members`)}
                        >
                            {t('addMember')}
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Information about workspace status */}
                    {workspace.status === 'draft' && (
                        <div className="text-center max-w-md border border-warning rounded-lg p-4 space-y-2">
                            <h3 className="text-text-secondary">{t("workspaceDraft")}</h3>
                            <p className="text-text-secondary">{t("workspaceDraftInfo")}</p>
                            <Button
                            className="text-text-contrast"
                            onClick={() => handleActivate()}
                            disabled={activateWorkspace.isPending}
                            >
                                {activateWorkspace.isPending ? t("activating") : t("activate")}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Upcoming events and homeworks */}
            <UpcomingSection slug={slug} />

            {/* Feed */}
            <div className="w-full mt-2">
                {feedLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="text-center max-w-md mx-auto py-8">
                        <h3 className="text-text m-4">{t('noContent')}</h3>
                        <p className="text-text-secondary">{t('noContentInfo')}</p>
                    </div>
                ) : (
                    <>
                        <FeedList
                        slug={slug}
                        canModerate={canModerate}
                        canParticipate={canParticipate}
                        workspaceActive={workspace.status === 'active'}
                        items={feedItems}
                        />
                        {hasNextPage && (
                            <div className="flex justify-center mt-4">
                                <Button
                                variant="ghost"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : t('loadMore')
                                    }
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageContainer>
    );
}