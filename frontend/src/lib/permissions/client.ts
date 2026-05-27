import type { WorkspaceRole } from '@/lib/queries/workspaces';

export const canModerate = (role: WorkspaceRole | null | undefined): boolean =>
    role === 'owner' || role === 'admin';

export const canParticipate = (role: WorkspaceRole | null | undefined): boolean =>
    canModerate(role) || role === 'member';