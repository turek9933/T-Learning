import { useQuery } from "@tanstack/react-query";
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
        throw new Error(`Failed to search users: ${res.status}`);
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