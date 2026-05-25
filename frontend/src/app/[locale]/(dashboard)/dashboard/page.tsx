'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Plus, Users, User, BookOpen, Activity, PencilLine, LibraryBig, ChessKing, ChessQueen, GraduationCap, HatGlasses } from 'lucide-react';
import { useMyWorkspaces, WorkspaceItem } from '@/lib/queries/workspaces';
import { PageContainer } from '@/components/layout/PageContainer';
import StatusBadge from '@/components/StatusBadge';

function WorkspaceRow({ workspace }: { workspace: WorkspaceItem }) {
    const avatarColor: Record<string, string> = {
        owner:  'text-accent',
        admin:  'text-accent',
        member: 'text-primary',
        viewer: 'text-text-muted',
    };
    return (
        <Link
        href={`/workspaces/${workspace.slug}`}
        className="flex items-center justify-between px-3 py-3 rounded-lg border-2 border-border bg-bg hover:bg-bg-hover text-text hover:text-text-contrast transition-all duration-400"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex w-8 h-8 rounded-lg items-center justify-center bg-primary-subtle">
                    {workspace.type === 'group'
                        ? <Users className={`w-4 h-4 ${avatarColor[workspace.role]}`} />
                        : <User className={`w-4 h-4 ${avatarColor[workspace.role]}`} />
                    }
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{workspace.name}</p>
                </div>
            </div>
            <StatusBadge status={workspace.status} />
        </Link>
    );
}

function WorkspaceSection({
    title,
    icon: Icon,
    workspaces,
}: {
    title: string;
    icon: React.ElementType;
    workspaces: WorkspaceItem[];
}) {
    if (workspaces.length === 0) return null;

    return (
        <section>
            <div className="flex items-center gap-2 mb-2 px-1 text-text-secondary">
                <Icon className="w-4 h-4" />
                <h4 className="uppercase">
                    {title}
                </h4>
                <span className="ml-auto text-sm ">{workspaces.length}</span>
            </div>
            <div className="rounded-xl border-y border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto p-2">
                    {workspaces.map((w) => (
                        <WorkspaceRow key={w.id} workspace={w} />
                    ))}
                </div>
            </div>
        </section>
    );
}


export default function DashboardPage() {
    const t = useTranslations('workspace.list');
    const { data: workspaces = [], isPending, isError } = useMyWorkspaces();

    const workspacesOwner  = workspaces.filter((w) => w.role === 'owner');
    const workspacesAdmin  = workspaces.filter((w) => w.role === 'admin');
    const workspacesMember = workspaces.filter((w) => w.role === 'member');
    const workspacesViewer = workspaces.filter((w) => w.role === 'viewer');

    return (
        <PageContainer>
            <div className="flex flex-col w-full flex-auto">
                <div className="flex justify-between mb-8 gap-4">
                    <div>
                        <h2 className="font-title font-bold text-text">{t('title')}</h2>
                        <p className="text-text-muted text-sm">{t('subtitle')}</p>
                    </div>
                    <Button
                    asChild
                    className="bg-primary hover:bg-primary-hover text-text-contrast gap-2">
                        <Link href="/workspaces/new">
                            <Plus className="w-5 h-5" />
                            {t('createNew')}
                        </Link>
                    </Button>
                </div>

                {isPending && (
                    <div className="space-y-4">
                        {[0, 1].map((i) => (
                            <div key={i} className="bg-bg rounded-xl border border-border p-3 space-y-3 animate-pulse">
                                {[0, 1, 2].map((j) => (
                                    <div key={j} className="h-8 bg-bg-muted rounded-lg" />
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="text-center py-10 px-4">
                        <p className="text-error text-md">{t('errorLoad')}</p>
                    </div>
                )}

            {!isPending && !isError && workspaces.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <BookOpen className="w-12 h-12 text-text-muted mb-4" />
                    <p className="text-text-secondary text-lg font-medium">{t('emptyTitle')}</p>
                    <p className="text-text-muted mt-1 mb-4">{t('emptySubtitle')}</p>
                    <Button
                    asChild
                    className="bg-primary hover:bg-primary-hover text-text-contrast">
                        <Link href="/workspaces/new">
                            <Plus className="w-4 h-4" />
                            {t('createNew')}
                        </Link>
                    </Button>
                </div>
            )}

            {!isPending && !isError && workspaces.length > 0 && (
                <div className="space-y-8">
                    <WorkspaceSection title={t('owner')} icon={ChessKing} workspaces={workspacesOwner} />
                    <WorkspaceSection title={t('admin')} icon={ChessQueen} workspaces={workspacesAdmin} />
                    <WorkspaceSection title={t('member')} icon={GraduationCap} workspaces={workspacesMember} />
                    <WorkspaceSection title={t('viewer')} icon={HatGlasses} workspaces={workspacesViewer} />
                </div>
            )}
            </div>
        </PageContainer>
    );
}