import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { HomeworkItem, UpcomingHomework } from '@/types/homework';
import { PostItem } from '@/types/post';
import { EventItem, EventType, UpcomingEvent } from '@/types/event';
import { FeedItem } from '@/types/feed';

async function fetchFeed(slug: string, cursor?: string): Promise<FeedItem[]> {
    const params = new URLSearchParams({ limit: '20' });
    if (cursor) params.set('cursor', cursor);
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/feed?${params}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch feeds: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
}
export function useFeed(slug: string) {
    return useInfiniteQuery({
        queryKey: ['feed', slug],
        queryFn: ({ pageParam }) => fetchFeed(slug, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (lastPage.length < 20) return undefined;
            const last = lastPage[lastPage.length - 1];
            return last?.createdAt;
        },
    });
}

async function fetchUpcomingEvents(slug: string): Promise<UpcomingEvent[]> {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();// 14 days
    const res = await fetch(
        `${env.apiUrl}/api/workspaces/${slug}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { credentials: 'include' },
    );
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch events: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
}
export function useUpcomingEvents(slug: string) {
    return useQuery({
        queryKey: ['events', slug, 'upcoming'],
        queryFn: () => fetchUpcomingEvents(slug),
        enabled: !!slug,
    });
}

async function fetchUpcomingHomeworks(slug: string): Promise<UpcomingHomework[]> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/homeworks`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch homeworks: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
}
export function useUpcomingHomeworks(slug: string) {
    return useQuery({
        queryKey: ['homeworks', slug, 'list'],
        queryFn: () => fetchUpcomingHomeworks(slug),
        enabled: !!slug,
    });
}