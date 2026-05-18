import { useMutation, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import type { EventType } from '@/types/event';

export interface CreateEventData {
    type: EventType;
    title: string;
    description?: string;
    location?: string;
    startsAt: string;
    endsAt?: string;
}

async function createEvent(slug: string, data: CreateEventData): Promise<{ id: string }> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/events`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to create event');
    }
    return res.json();
}
export function useCreateEvent(slug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateEventData) => createEvent(slug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', slug] });
            queryClient.invalidateQueries({ queryKey: ['events', slug] });
        },
    });
}