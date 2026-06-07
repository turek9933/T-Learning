import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";

export type UserSearchItem = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

async function fetchUserSearch(q: string): Promise<UserSearchItem[]> {
    const res = await fetch(`${env.apiUrl}/api/users/search?q=${q}`, {
        credentials: 'include',
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to search users: ${res.status} ${res.statusText} - ${text}`);
    }

    return res.json();
}


export function useUserSearch(q: string) {
    return useQuery({
        queryKey: ['users', 'search', q],
        queryFn: () => fetchUserSearch(q),
        enabled: q.length >= 2,
        placeholderData: (prev) => prev,
        staleTime: 5 * 60 * 1000,// 5 min
    });
}


export function useUpdateName() {
    const queryClient = useQueryClient();
    return useMutation({

        mutationFn: async (name: string) => {
            const res = await fetch(`${env.apiUrl}/api/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to update name: ${res.status} ${res.statusText} - ${text}`);
            }
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session'] }),
    });
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
    const res = await fetch(`${env.apiUrl}/api/users/email-available?email=${encodeURIComponent(email)}`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to check email availability');
    const data = await res.json() as { available: boolean };
    return data.available;
}

export async function fetchAvatarUploadUrl(): Promise<{ uploadUrl: string; publicUrl: string }> {
    const res = await fetch(`${env.apiUrl}/api/users/me/avatar/upload-url`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch avatar upload URL: ${res.status} ${res.statusText} - ${text}`);
    }

    return res.json();
}

export async function confirmAvatarUpload(publicUrl: string): Promise<void> {
    const res = await fetch(`${env.apiUrl}/api/users/me/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicUrl }),
        credentials: 'include',
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to confirm avatar upload: ${res.status} ${res.statusText} - ${text}`);
    }
}