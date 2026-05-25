import { useQuery, useMutation } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';

export const WorkspaceRole = ['owner', 'admin', 'member', 'viewer'] as const
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type WorkspaceStatus = 'draft' | 'active' | 'archived';
export type WorkspaceType = 'single' | 'group';

export type WorkspaceItem = {
    id:          string;
    name:        string;
    slug:        string;
    logo:        string | null;
    type:        WorkspaceType | null;
    description: string | null;
    status:      WorkspaceStatus | null;
    price:       number | null;
    metadata:    string | null;
    createdAt:   string;
    role:        WorkspaceRole;
    hasPaid:     boolean | null;
    expiresAt:   string | null;
};

export type MemberItem = {
    userId:     string;
    name:       string;
    email:      string;
    avatarUrl:  string | null;
    memberId:   string;
    role:       WorkspaceRole;
    hasPaid:    boolean | null;
    expiresAt:  string | null;
    createdAt:  string;
}


async function fetchMyWorkspaces(): Promise<WorkspaceItem[]> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/me`, {
        credentials: 'include',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch workspaces: ${res.status} ${res.statusText} - ${text}`);
    }

    return res.json();
}

async function fetchWorkspace(slug: string): Promise<WorkspaceItem> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}`, {
        credentials: 'include',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch workspace: ${res.status} ${res.statusText} - ${text}`);
    }

    return res.json();
}

async function fetchWorkspaceMembers(slug: string): Promise<MemberItem[]> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/members`, {
        credentials: 'include',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch workspace members: ${res.status} ${res.statusText} - ${text}`);
    }

    return res.json();
}

export function useMyWorkspaces() {
    return useQuery({
        queryKey: ['workspaces', 'me'],
        queryFn: fetchMyWorkspaces,
    });
}

export function useWorkspace(slug: string) {
    return useQuery({
        queryKey: ['workspaces', slug],
        queryFn: () => fetchWorkspace(slug),
        enabled: !!slug,
    });
}

export function useWorkspaceMembers(slug: string) {
    return useQuery({
        queryKey: ['workspaces', slug, 'members'],
        queryFn: () => fetchWorkspaceMembers(slug),
        enabled: !!slug,
    });
}

export function useActivateWorkspace(slug: string, workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await authClient.organization.update({
                organizationId: workspaceId,
                data: { status: 'active' },
            });
            if (res?.error) throw new Error(res.error.message || 'Failed to activate workspace');
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces', slug] });
            queryClient.invalidateQueries({ queryKey: ['workspaces', 'me'] });
        },
    });
}