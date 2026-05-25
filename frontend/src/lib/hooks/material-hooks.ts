import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import type { Material } from '@/types/material';

async function fetchMaterials(slug: string): Promise<Material[]> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/materials`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to fetch materials');
    }
    return res.json();
}
export function useMaterials(slug: string) {
    return useQuery({
        queryKey: ['materials', slug],
        queryFn: () => fetchMaterials(slug),
        enabled: !!slug,
    });
}

interface CreateMaterialData {
    name: string;
    description?: string;
    storageKey: string;
    mimeType: string;
    size: number;
}
async function createMaterial(slug: string, data: CreateMaterialData): Promise<Material> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/materials`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to create material');
    }
    return res.json();
}
export function useCreateMaterial(slug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMaterialData) => createMaterial(slug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', slug] });
        },
    });
}

async function deleteMaterial(slug: string, id: string): Promise<void> {
    const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/materials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Failed to delete material');
    }
}
export function useDeleteMaterial(slug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMaterial(slug, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', slug] });
        },
    });
}
