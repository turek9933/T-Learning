import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { PostItem, PostAttachment, CreatePostData, Comment } from '@/types/post';


async function createPost(slug: string, data: CreatePostData): Promise<{ id: string }> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/posts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to create post');
    }
    return res.json();
}
export function useCreatePost(slug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePostData) => createPost(slug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', slug] });
        },
    });
}

async function deletePost(slug: string, postId: string): Promise<void> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to delete post');
    }
}
export function useDeletePost(slug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (postId: string) => deletePost(slug, postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', slug] });
        },
    });
}

async function fetchComments(slug: string, postId: string): Promise<Comment[]> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/posts/${postId}/comments`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Comment error response:', err);
        throw new Error((err as any).message ?? `Failed to fetch comment: ${res.status}`);
    }
    return res.json();
}
export function useComments(slug: string, postId: string, enabled: boolean) {
    return useQuery({
        queryKey: ['comments', slug, postId],
        queryFn: () => fetchComments(slug, postId),
        enabled,
    });
}

async function addComment(slug: string, postId: string, content: string): Promise<Comment> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/posts/${postId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Comment error response:', err);
        throw new Error((err as any).message ?? `Failed to add comment: ${res.status}`);
    }
    return res.json();
}
export function useAddComment(slug: string, postId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (content: string) => addComment(slug, postId, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', slug, postId] });
            queryClient.invalidateQueries({ queryKey: ['feed', slug] });
        },
    });
}

async function deleteComment(slug: string, postId: string, commentId: string): Promise<void> {
    const res = await fetch(
        `${env.apiUrl}/api/workspaces/${slug}/posts/${postId}/comments/${commentId}`,
        { method: 'DELETE', credentials: 'include' },
    );
    if (!res.ok) throw new Error('Failed to delete comment');
}
export function useDeleteComment(slug: string, postId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId: string) => deleteComment(slug, postId, commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', slug, postId] });
            queryClient.invalidateQueries({ queryKey: ['feed', slug] });
        },
    });
}