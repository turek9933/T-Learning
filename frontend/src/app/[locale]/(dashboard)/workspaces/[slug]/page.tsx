'use client';
import { useTranslations } from 'next-intl';
import { usePathname, useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useWorkspace } from '@/lib/queries/workspaces';
import { PageContainer } from '@/components/ui/PageContainer';
import { customToast } from '@/lib/customToast';
import { Calendar, CalendarPlus, Clock, FileText, NotebookPen, Plus, SquarePen, User, Users, Video } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import WorkspacePending from '@/components/WorkspacePending';
import WorkspaceError from '@/components/WorkspaceError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

function WorkspaceTabs({ slug }: { slug: string }) {
    const t = useTranslations('dashboard.workspace.tabs');

    const pathname = usePathname();
    const isActive = (href: string) => {
        const path = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
        const result = path === href || path.startsWith(href + '/');
        console.log('[isActive]:', path, href, result);
        return result;
    }

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

const mockUpcoming = [
    {
        id: '1', type: 'event', createdAt: '2022-01-01',
        title: 'Lekcja online',
        eventType: 'meeting',
        startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: null,
        meetingUrl: 'https://meet.google.com/abc',
    },
    {
        id: '2', type: 'homework', createdAt: '',
        title: 'Termin oddania pracy',
        eventType: 'deadline',
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: null,
        meetingUrl: null,
    }
];

function eventTypeIcon(type: any) {
    if (type === 'event') return <Video className="w-3 h-3" />;
    if (type === 'homework') return <NotebookPen className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
}

function UpcomingSection({ slug, upcoming }: { slug: string, upcoming: string }) {
    // TODO: zastąpić useUpcoming(slug)
    const items = mockUpcoming;
    if (items.length === 0) return null;

    return (
        <div className="bg-bg rounded-xl border border-border my-2 p-1">
            <div className="flex items-center justify-center py-1 border-b border-border">
                <Link
                href={`/workspaces/${slug}/calendar`}
                className="text-primary font-semibold hover:underline flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    {upcoming}
                </Link>
            </div>
            <div>
                {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-3 items-center">
                        <span className={`flex items-center gap-1 font-normal text-sm text-text-secondary px-2 py-1`}>
                            {eventTypeIcon(item.type)}
                            {/* TODO: zastąpić eventType */}
                            {item.eventType === 'meeting' ? 'Spotkanie' : item.eventType === 'deadline' ? 'Deadline' : 'Egzamin'}
                        </span>
                        {/* TODO: Dodać link do szczegółów wydarzenia */}
                        <p className="text-sm font-medium text-text text-center">{item.title}</p>
                        <span className="text-sm text-text-secondary text-right px-2 py-1">{item.createdAt}</span>
                    </div>
                ))}
            </div>  
        </div>
    );
}

export default function WorkspacePage() {
    const t = useTranslations('dashboard.workspace.main');
    const { slug } = useParams<{ slug: string }>();
    const { data: workspace, isPending, isError } = useWorkspace(slug);
    const canModerate = workspace?.role === 'owner' || workspace?.role === 'admin';
    const items = [];

    const avatarColor: Record<string, string> = {
        owner:  'text-accent',
        admin:  'text-accent',
        member: 'text-primary',
        viewer: 'text-text-muted',
    };

    // Workspace activation
    const queryClient = useQueryClient();
    const activateMutation = useMutation({
        mutationFn: async () => {
            const res = await authClient.organization.update({
                organizationId: workspace?.id,
                data: {
                    status: 'active'
                }
            });
            if (res?.error) {
                throw new Error(res.error.message);
            }
            return res.data;
        },
        onSuccess: (_, data) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug] });
            queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
            customToast.success(t(`successStatusActive`));
        },
        onError: () => customToast.error(t('errorStatus')),
    });
    function activateWorkspace() {
        activateMutation.mutate();
    }

    if (isPending)
        return <WorkspacePending />;
    if (isError || !workspace)
        return <WorkspaceError errorMessage={t('errorLoad')} />

    return (
        <PageContainer>
            <WorkspaceTabs slug={slug} />

            {/* Header in the center*/}
            <div className="flex flex-row w-full flex-auto gap-4 items-center justify-center">
                {workspace.type === 'group' ? 
                    <Users className={`w-6 h-6 ${avatarColor[workspace.role]}`} /> :
                    <User className={`w-6 h-6 ${avatarColor[workspace.role]}`} />
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
                {/* Adding new content and workspace members */}
                <div className="flex flex-row w-full flex-auto gap-4 items-center justify-center my-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="cursor-pointer gap-2">
                                <p>{t("addContent")}</p>
                                <Plus className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* //TODO Add real buttons, currently just placeholders */}
                            <DropdownMenuItem asChild className='cursor-pointer'>
                                <div className="flex items-center gap-2 hover:text-text-contrast hover:bg-bg-hover"> 
                                    <SquarePen className="w-4 h-4" />
                                    <span className="ml-2">{t("addPost")}</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className='cursor-pointer'>
                                <div className="flex items-center gap-2 hover:text-text-contrast hover:bg-bg-hover"> 
                                    <CalendarPlus className="w-4 h-4" />
                                    <span className="ml-2">{t("addEvent")}</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className='cursor-pointer'>
                                <div className="flex items-center gap-2 hover:text-text-contrast hover:bg-bg-hover"> 
                                    <NotebookPen className="w-4 h-4" />
                                    <span className="ml-2">{t("addHomework")}</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className='cursor-pointer'>
                                <div className="flex items-center gap-2 hover:text-text-contrast hover:bg-bg-hover"> 
                                    <FileText className="w-4 h-4" />
                                    <span className="ml-2">{t("addFile")}</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button asChild variant="ghost" className="text-text">
                        <Link href={`/workspaces/${slug}/members`}>
                            {t("addMember")}
                            <Plus className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                {/* Information about workspace status */}
                {workspace.status === "draft" && (
                    <div className="text-center max-w-md border border-warning rounded-lg p-4 space-y-2">
                        <h3 className="text-text-secondary">{t("workspaceDraft")}</h3>
                        <p className="text-text-secondary">{t("workspaceDraftInfo")}</p>
                        <Button
                        className="text-text-contrast"
                        onClick={() => activateWorkspace()}
                        disabled={activateMutation.isPending}
                        >
                            {activateMutation.isPending ? t("activating") : t("activate")}
                        </Button>
                    </div>
                )}
                </>
            )}

            {/* Upcoming events */}
            <UpcomingSection slug={slug} upcoming={t('upcoming')} />

            {/* Wall */}
            <div>
                {items.length === 0 ? (
                    <div className="text-center max-w-md">
                        <h3 className="text-text m-4">
                            {t('noContent')}
                        </h3>
                        <p>{t('noContentInfo')}</p>
                    </div>
                ) : (
                    items.map((item) => <p>{item.title}</p>)
                )}
            </div>
        </PageContainer>
    );
}