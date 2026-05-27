'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/layout/PageContainer';
import { useParams } from 'next/navigation';
import { MemberItem, useWorkspace, useWorkspaceMembers, WorkspaceRole } from '@/lib/queries/workspaces';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customToast } from '@/components/CustomToast';
import { UserPlus, MoreHorizontal, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { canModerate } from '@/lib/permissions/client';
import Avatar from '@/components/shared/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserSearch } from '@/components/shared/UserSearch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { env } from '@/lib/env';

const VIEWER_LIMIT = 3;

type InviteRole = 'admin' | 'member' | 'viewer';

function MemberRow({
    member,
    isOwner,
    isOwnerOrAdmin,
    workspaceId,
    workspaceSlug
}: {
    member: MemberItem;
    isOwner: boolean;
    isOwnerOrAdmin: boolean;
    workspaceId: string;
    workspaceSlug: string;
}) {
    const t = useTranslations('workspace.members');
    const queryClient = useQueryClient();

    const roleMutation = useMutation({
        mutationFn: async (role: WorkspaceRole) => {
            const res = await authClient.organization.updateMemberRole({
                memberId: member.memberId,
                role,
                organizationId: workspaceId
            })
            if (res?.error) {
                throw new Error(res.error.message);
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceSlug, 'members'] });
            customToast.success(t('successUpdateRole'));
        },
        onError: () => {
            customToast.error(t('errorUpdateRole'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await authClient.organization.removeMember({
                memberIdOrEmail: member.memberId,
                organizationId: workspaceId
            });
            if (res?.error) {
                throw new Error(res.error.message);
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceSlug, 'members'] });
            customToast.success(t('successDelete'));
        },
        onError: () => {
            customToast.error(t('errorDelete'));
        }
    });

    // TODO: add mutation
    const paymentMutation = useMutation({
    });

    return (
        <div className="flex justify-between items-center gap-3 p-2 hover:bg-bg rounded-lg transition-colors">
            <Avatar {...member} />
            {/* Name, email and membership info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-stretch gap-2">
                    <p className="text-sm font-medium text-text">{member.name}</p>

                    {member.hasPaid && (
                        <span className="text-xs bg-success-subtle text-success px-2 rounded-lg font-medium">
                            {t('hasPaid')}
                        </span>
                    )}

                    {member.expiresAt && new Date(member.expiresAt) < new Date() && (
                        <span className="text-xs bg-error-subtle text-error px-2 py-0.5 rounded-lg font-medium">
                            {t('expired')}
                        </span>
                    )}
                </div>
                <p className="text-xs text-text-secondary shrink">{member.email}</p>
            </div>

            <span className="text-xs text-text-muted shrink-1">{t('role' + member.role.charAt(0).toUpperCase() + member.role.slice(1))}</span>

            {isOwnerOrAdmin && member.role !== 'owner' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {/* Role change */}
                        {WorkspaceRole.filter(r => r !== member.role && r !== 'owner').map(role => (
                            <DropdownMenuItem
                            key={role}
                            disabled={roleMutation.isPending}
                            onClick={() => roleMutation.mutate(role)}
                            className="cursor-pointer"
                            >
                                {t('changeRole', { newRole: t('role' + role.charAt(0).toUpperCase() + role.slice(1)) })}
                            </DropdownMenuItem>
                        ))}

                        {/* Owner change */}
                        {isOwner && (
                            <DropdownMenuItem
                            key="owner"
                            disabled={roleMutation.isPending}
                            onClick={() => roleMutation.mutate('owner')}
                            className="cursor-pointer text-error"
                            >
                                {t('changeOwner')}
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className='bg-text'/>

                        {/* Toggle hasPaid */}
                        <DropdownMenuItem
                        disabled={paymentMutation.isPending}
                        onClick={() => paymentMutation.mutate()}
                        className="cursor-pointer"
                        >
                            {member.hasPaid ? t('changeHasNotPaid') : t('changeHasPaid')}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className='bg-text'/>

                        {/* Delete */}
                        <DropdownMenuItem
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate()}
                        className="cursor-pointer text-error focus:text-error"
                        >
                            {t('deleteMember')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

export default function WorkspaceMembersPage() {
    const t = useTranslations('workspace.members');
    const queryClient = useQueryClient();
    const { slug } = useParams<{ slug: string }>();
    const { data: workspace, isPending: workspaceIsPending, isError: workspaceIsError } = useWorkspace(slug);
    const { data: members = [], isPending: membersIsPending, isError: membersIsError } = useWorkspaceMembers(slug);
    const [inviteRole, setInviteRole] = useState<InviteRole>('member');

    // Expose 'Resend', if an invite is already pending.
    const [resendEmail, setResendEmail] = useState<string | null>(null);

    // Fetch member counts for limit display
    const { data: limits } = useQuery({
        queryKey: ['workspaces', slug, 'limits'],
        queryFn: async () => {
            const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/members/limits`, { credentials: 'include' });
            if (!res.ok) return null;
            return res.json() as Promise<{
                counts: Record<InviteRole | 'owner', number>;
                limits: Record<InviteRole | 'owner', number> | null;
                type: string;
            }>;
        },
        enabled: !!workspace,
    });

    const inviteMutation = useMutation({
        mutationFn: async ({ email }: { email: string }) => {
            const res = await fetch(`${env.apiUrl}/api/auth/organization/invite-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, role: inviteRole, organizationId: workspace!.id }),
            });
            const data = await res.json();
            if (!res.ok) throw {
                code: data.code as string | undefined,
                message: data.message as string | undefined
            };
            return data;
        },
        onSuccess: (_, { email }) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug] });
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug, 'limits'] });
            setResendEmail(null);
            customToast.success(t('successInvite', { email }));
        },
        onError: (err: any, { email }) => {
            console.error(err);

            const code: string = err?.code ?? '';
            const msg: string  = err?.message ?? '';

            if (code === 'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION') {
                setResendEmail(email);
                customToast.warning(t('errorUserAlreadyInvited'));
            } else if (code === 'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION') {
                customToast.error(t('errorUserAlreadyMember'));
            } else if (msg === 'SINGLE_WORKSPACE_LIMIT_MEMBER') {
                customToast.error(t('errorSingleMemberLimit'));
            } else if (msg.startsWith('SINGLE_WORKSPACE_LIMIT_')) {
                customToast.error(t('errorSingleViewerLimit', { max: VIEWER_LIMIT }));
            } else {
                customToast.error(t('errorInvite'));
            }
        }
    });

    const resendMutation = useMutation({
        mutationFn: async (email: string) => {
            const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/invitations/resend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw {
                code: data.code as string | undefined,
                message: data.message as string | undefined
            };
            return data;
        },
        onSuccess: (_, email) => {
            setResendEmail(null);
            customToast.success(t('successResend', { email }));
        },
        onError: () => {
            customToast.error(t('errorResend'));
        },
    });

    if (workspaceIsPending || membersIsPending)
        return <WorkspacePending />;
    if (workspaceIsError || !workspace || membersIsError || !members)
        return <WorkspaceError errorMessage={t('errorLoad')} />

    const isOwnerOrAdmin = canModerate(workspace.role);
    const isSingle = workspace.type === 'single';

    // Calculate if invite button should be disabled for current role selection
    const isRoleLimitReached = isSingle 
        && limits?.limits
            ? (limits.counts[inviteRole] ?? 0) >= (limits.limits[inviteRole] ?? 0)
            : false;

    return (
        <PageContainer>
            <section className="flex flex-col w-full max-w-4xl items-center space-y-4">
                <h2 className="flex flex row gap-2 text-text mb-2">
                    {t('title')}
                    <p className="font-medium text-md text-text-muted">{members.length}</p>
                </h2>
                <p className="text-text-secondary">
                    {t('subtitle')}
                </p>

                {/* Invite section */}
                {isOwnerOrAdmin && (
                    <div className="flex flex-col w-full gap-2">
                        <div className="flex flex-col items-center gap-2">
                            {/* Role select */}
                            <Select
                            value={inviteRole}
                            onValueChange={(v) => setInviteRole(v as InviteRole)}
                            >
                                <SelectTrigger className="min-w-16 shrink-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {!isSingle && (
                                        <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                                    )}
                                    <SelectItem value="member" disabled={isSingle && (limits?.counts.member ?? 0) >= 1}>
                                        {t('roleMember')} {isSingle && `(${limits?.counts.member ?? 0}/1)`}
                                    </SelectItem>
                                    <SelectItem value="viewer" disabled={isSingle && (limits?.counts.viewer ?? 0) >= VIEWER_LIMIT}>
                                        {t('roleViewer')} {isSingle && `(${limits?.counts.viewer ?? 0}/${VIEWER_LIMIT})`}
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* User search */}
                            <div className="flex-1">
                                <UserSearch
                                onSelect={(user) => {
                                    if (isRoleLimitReached) return;
                                    inviteMutation.mutate({ email: user.email });
                                }}
                                actionLabel={t('invite')}
                                actionIcon={<UserPlus className="w-4 h-4" />}
                                disabled={isRoleLimitReached || inviteMutation.isPending}
                                />
                            </div>
                        </div>

                        {isRoleLimitReached && (
                            <p className="text-xs text-warning">
                                {inviteRole === 'member'
                                    ? t('errorSingleMemberLimit')
                                    : t('errorSingleViewerLimit', { max: VIEWER_LIMIT })
                                }
                            </p>
                        )}

                        {resendEmail && (
                            <div className="flex items-center justify-between px-3 py-2 gap-2 border border-border rounded-lg">
                                <span className="text-sm text-text-secondary truncate">
                                    {t('resendPrompt', { email: resendEmail })}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={resendMutation.isPending}
                                    onClick={() => setResendEmail(null)}
                                    >
                                        {t('resendCancel')}
                                    </Button>
                                    <Button
                                    size="sm"
                                    disabled={resendMutation.isPending}
                                    onClick={() => resendMutation.mutate(resendEmail)}
                                    className="text-text-contrast"
                                    >
                                        <Send className="w-4 h-4" />
                                        {t('resendInvite')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Members list */}
                {members.length === 0 ? (
                    <p className="text-text-secondary text-center mt-4">
                        {t('noMembers')}
                    </p>
                ) : (
                    <div className="flex flex-col w-full border border-border rounded-lg">
                    {members.map((member) => (
                        <MemberRow
                        key={member.memberId}
                        member={member}
                        isOwner={workspace.role === 'owner'}
                        isOwnerOrAdmin={isOwnerOrAdmin}
                        workspaceId={workspace.id}
                        workspaceSlug={slug}
                        />
                    ))}
                    </div>
                )}
            </section>
        </PageContainer>
    )
}