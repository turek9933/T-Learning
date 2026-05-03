'use client';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/layout/PageContainer';
import { useParams } from 'next/navigation';
import { MemberItem, useWorkspace, useWorkspaceMembers, WorkspaceRole } from '@/lib/queries/workspaces';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customToast } from '@/lib/customToast';
import { UserPlus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import Avatar from '@/components/shared/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserSearch } from '@/components/shared/UserSearch';

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
    const t = useTranslations('dashboard.workspace.members');
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
    const t = useTranslations('dashboard.workspace.members');
    const queryClient = useQueryClient();
    const { slug } = useParams<{ slug: string }>();
    const { data: workspace, isPending: workspaceIsPending, isError: workspaceIsError } = useWorkspace(slug);
    const { data: members = [], isPending: membersIsPending, isError: membersIsError } = useWorkspaceMembers(slug);


    class AuthError extends Error {
        code?: string;

        constructor(message: string | undefined, code?: string) {
            super(message);
            this.code = code;
        }
    }
    const inviteMutation = useMutation({
        mutationFn: async ({ email, role }: { email: string, role: 'admin' | 'member' | 'viewer'}) => {
                const res = await authClient.organization.inviteMember({ email, role, organizationId: workspace!.id });
                if (res?.error) {
                   throw new AuthError(res.error.message, res.error.code);
                }
                return res.data;
            },

            onSuccess: (_, { email }) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug] });
            customToast.success(t('successInvite', { email: email }));
        },
        onError: (err: AuthError) => {
            console.error(err);
            if (err.code) {
                switch (err.code) {
                    case "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION":
                        customToast.error(t('errorUserAlreadyInvited'));
                        break;
                    case "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION":
                        customToast.error(t('errorUserAlreadyMember'));
                        break;
                    default:
                        customToast.error(t('errorInvite'));
                        break;
                }
            } else {
                customToast.error(t('error'))}
            }
    });
    
    if (workspaceIsPending || membersIsPending)
        return <WorkspacePending />;
    if (workspaceIsError || !workspace || membersIsError || !members)
        return <WorkspaceError errorMessage={t('errorLoad')} />

    const isOwnerOrAdmin = workspace.role === 'owner' || workspace.role === 'admin';
    // TODO: add invited members
    const invitedMembers = members.filter((member) => member.expiresAt !== null);

    return (
        <PageContainer>
            <section className="flex flex-col w-full max-w-lg items-center space-y-4">
                <h2 className="flex flex row gap-2 text-text mb-2">
                    {t('title')}
                    <p className="font-medium text-md text-text-muted">{members.length}</p>
                </h2>
                <p className="text-text-secondary">
                    {t('subtitle')}
                </p>
   
                {/* Search section */}
                {isOwnerOrAdmin && (
                    <UserSearch onSelect={(user) => inviteMutation.mutate({ email: user.email, role: 'member' })} actionLabel={t('invite') } actionIcon={<UserPlus className="w-4 h-4" />} />
                )}
   
                {/* Members list section */}
                {members.length === 0 ? (
                    <p className="text-text-secondary text-center mt-4">
                        {t('noMembers')}
                    </p>
                ) : (
                    <div className="flex flex-col w-full border border-border rounded-lg">
                    {members.map((member) => (
                        <MemberRow key={member.memberId} member={member} isOwner={workspace.role === 'owner'} isOwnerOrAdmin={isOwnerOrAdmin} workspaceId={workspace.id} workspaceSlug={slug} />
                    ))}
                    </div>
                )}
            </section>
        </PageContainer>
    )
}