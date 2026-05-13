import { useMutation, useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';

type UploadContext = 'post' | 'homework' | 'submission' | 'material' | 'chat';

export const MAX_FILE_SIZE: Record<UploadContext, number> = {
    post:       10 * 1024 * 1024,// 10MB
    homework:   20 * 1024 * 1024,// 20MB
    submission: 20 * 1024 * 1024,// 20MB
    material:   50 * 1024 * 1024,// 50MB
    chat:       10 * 1024 * 1024,// 20MB
};


export const MAX_FILE_COUNT: Record<UploadContext, number> = {
    post:       5,
    homework:   10,
    submission: 5,
    material:   1,
    chat:       1,
};

// seconderyId can be undefined
// post:       contextId = workspaceId, secondaryId = postId
// homework:   contextId = workspaceId, secondaryId = homeworkId
// submission: contextId = workspaceId, secondaryId = homeworkId
// material:   contextId = workspaceId
// message:    contextId = conversationId
interface RequestUploadUrlParams {
    context: UploadContext;
    contextId: string;
    secondaryId?: string;
    file: File;
}

interface UploadUrlResponse {
    uploadUrl: string;
    storageKey: string;
    fileId: string;
}

// Downloads presigned URL, then uploads the file directly to MinIO.
// Returns storageKey ready to be saved in the database by the endpoint.
async function uploadFile(params: RequestUploadUrlParams): Promise<string> {
    const { context, contextId, secondaryId, file } = params;

    if (file.size > MAX_FILE_SIZE[context]) {
        const limitMB = MAX_FILE_SIZE[context] / 1024 / 1024;
        throw new Error(`File "${file.name}" exceeds the maximum size of ${limitMB} MB that can be uploaded for file in context "${context}"`);
    }

    // Download presigned PUT URL
    const urlRes = await fetch(`${env.apiUrl}/api/files/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            context,
            contextId,
            secondaryId,
            mimeType: file.type,
            size: file.size,
            fileName: file.name,
        }),
    });

    if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error((err as any).message ?? 'Could not get upload URL');
    }

    const { uploadUrl, storageKey }: UploadUrlResponse = await urlRes.json();

    // File upload directly to MinIO
    const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });

    if (!uploadRes.ok) {
        throw new Error('File transfer failed');
    }

    return storageKey;
}

export function useFileUpload() {
    return useMutation({
        mutationFn: uploadFile,
    });
}

// Uploads multiple files in parallel
// Returns table of storageKeys in given order
export function useMultiFileUpload() {
    return useMutation({
        mutationFn: async (uploads: RequestUploadUrlParams[]): Promise<string[]> => {
            return Promise.all(uploads.map(uploadFile));
        },
    });
}

// Downloads presigned GET URL
// Result is cached for 50 minutes, then garbage collected after 1 hour
export function useFileUrl(storageKey: string | null | undefined) {
    return useQuery({
        queryKey: ['file-url', storageKey],
        queryFn: async () => {
            const res = await fetch(
                `${env.apiUrl}/api/files/view?key=${encodeURIComponent(storageKey!)}`,
                { credentials: 'include' },
            );
            if (!res.ok) throw new Error('Could not get the file URL');
            const data: { url: string } = await res.json();
            return data.url;
        },
        enabled: !!storageKey,
        staleTime: 50 * 60 * 1000,
        gcTime:    60 * 60 * 1000,
    });
}


export function getFilePreviewType(mimeType: string): 'image' | 'pdf' | 'none' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'none';
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}