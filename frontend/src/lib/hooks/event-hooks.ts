import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import type { EventDetail, EventType, MyEvent } from '@/types/event';

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

async function fetchEvent(slug: string, id: string): Promise<EventDetail> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/events/${id}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch event');
    }
    return res.json();
}
export function useEvent(slug: string, id: string) {
    return useQuery({
        queryKey: ['events', slug, id],
        queryFn: () => fetchEvent(slug, id),
        enabled: !!slug && !!id,
    });
}

async function fetchMyEvents(from?: string, to?: string): Promise<MyEvent[]> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to', to);
    const res = await fetch(`${env.apiUrl}/api/events/me?${params}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch my events');
    }
    return res.json();
}
export function useMyEvents(from?: string, to?: string) {
    return useQuery({
        queryKey: ['events', 'me', from, to],
        queryFn: () => fetchMyEvents(from, to),
    });
}