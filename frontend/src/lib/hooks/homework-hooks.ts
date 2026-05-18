import { useMutation, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';

export interface CreateHomeworkData {
    title: string;
    description?: string;
    dueAt?: string;
    attachments?: Array<{ storageKey: string; name: string; mimeType: string; size: number }>;
}

async function createHomework(slug: string, data: CreateHomeworkData): Promise<{ id: string }> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/homeworks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to create homework');
    }
    return res.json();
}
export function useCreateHomework(slug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateHomeworkData) => createHomework(slug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', slug] });
            queryClient.invalidateQueries({ queryKey: ['homeworks', slug] });
        },
    });
}