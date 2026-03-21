import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';

export type WorkspaceItem = {
    id: string;
    name: string;
    slug: string;
    logo: string;
    type: 'single' | 'group' | null;
    status: 'draft' | 'active' | 'archived' | null;
    metadata: string | null;
    createdAt: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    hasPaid: boolean | null;
    expiresAt: string | null;
};

async function fetchMyWorkspaces(): Promise<WorkspaceItem[]> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/me`, {
        credentials: 'include',
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch workspaces: ${res.status}`);
    }

    return res.json();
}

export function useMyWorkspaces() {
    return useQuery({
        queryKey: ['workspaces', 'me'],
        queryFn: fetchMyWorkspaces,
    });
}