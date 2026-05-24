import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import type { HomeworkDetail, MyHomework, Submission } from '@/types/homework';

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

async function fetchHomework(slug: string, id: string): Promise<HomeworkDetail> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/homeworks/${id}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch homework');
    }
    return res.json();
}
export function useHomework(slug: string, id: string) {
    return useQuery({
        queryKey: ['homeworks', slug, id],
        queryFn: () => fetchHomework(slug, id),
        enabled: !!slug && !!id,
    });
}

async function fetchMyHomeworks(from?: string, to?: string): Promise<MyHomework[]> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to', to);
    const res = await fetch(`${env.apiUrl}/api/homeworks/me?${params}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch my homeworks');
    }
    return res.json();
}
export function useMyHomeworks(from?: string, to?: string) {
    return useQuery({
        queryKey: ['homeworks', 'me', from, to],
        queryFn:  () => fetchMyHomeworks(from, to),
    });
}

async function fetchMySubmission(slug: string, homeworkId: string): Promise<Submission | null> {
    const res = await fetch(
        `${env.apiUrl}/api/workspaces/${slug}/homeworks/${homeworkId}/submissions`,
        { credentials: 'include' }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch my submission');
    }
    const data: Submission[] = await res.json();
    return data[0] ?? null;
}
export function useMySubmission(slug: string, homeworkId: string) {
    return useQuery({
        queryKey: ['submissions', slug, homeworkId, 'me'],
        queryFn: () => fetchMySubmission(slug, homeworkId),
        enabled: !!slug && !!homeworkId,
        staleTime: 1000 * 60 * 5,
    });
}

export interface SubmitHomeworkData {
    content?: string;
    attachments?: Array<{ storageKey: string; name: string; mimeType: string; size: number }>;
}

async function submitHomework(slug: string, homeworkId: string, data: SubmitHomeworkData): Promise<Submission> {
    const res = await fetch(
        `${env.apiUrl}/api/workspaces/${slug}/homeworks/${homeworkId}/submissions`,
        {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to submit homework');
    }
    return res.json();
}
export function useSubmitHomework(slug: string, homeworkId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubmitHomeworkData) => submitHomework(slug, homeworkId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['submissions', slug, homeworkId, 'me'] });
            queryClient.invalidateQueries({ queryKey: ['homeworks', 'me'] });
        },
    });
}

async function fetchAllSubmissions(slug: string, homeworkId: string): Promise<Submission[]> {
    const res = await fetch(
        `${env.apiUrl}/api/workspaces/${slug}/homeworks/${homeworkId}/submissions`,
        { credentials: 'include' }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch submissions');
    }
    return res.json();
}
export function useAllSubmissions(slug: string, homeworkId: string) {
    return useQuery({
        queryKey: ['submissions', slug, homeworkId, 'all'],
        queryFn: () => fetchAllSubmissions(slug, homeworkId),
        enabled: !!slug && !!homeworkId,
    });
}

async function updateSubmission(
    slug: string,
    homeworkId: string,
    submissionId: string,
    data: SubmitHomeworkData
): Promise<Submission> {
    const res = await fetch(
        `${env.apiUrl}/api/workspaces/${slug}/homeworks/${homeworkId}/submissions/${submissionId}`,
        {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to update submission');
    }
    return res.json();
}
export function useUpdateSubmission(slug: string, homeworkId: string, submissionId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubmitHomeworkData) => updateSubmission(slug, homeworkId, submissionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['submissions', slug, homeworkId, 'me'] });
            queryClient.invalidateQueries({ queryKey: ['homeworks', 'me'] });
        },
    });
}