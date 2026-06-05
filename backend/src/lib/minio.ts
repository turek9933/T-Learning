import { env } from '@/config/env';
import * as minio from 'minio';

export const AVATARS_BUCKET = 'avatars';

function parseEnpoint(endpoint: string): { host: string; port: number; useSSL: boolean } {
    const url = new URL(endpoint);
    const useSSL = url.protocol === 'https:';
    const host = url.hostname;
    const port = url.port ? parseInt(url.port) : useSSL ? 443 : 80;
    return { host, port, useSSL };
}

// internalEndpoint is not recognized by browser, used for backend <-> MinIO communication
const internalEndpoint = parseEnpoint(env.minioEndpoint);
// publicEndpoint is recognized by browser, used for presigned URL generation
const publicEndpoint = parseEnpoint(env.minioPublicUrl);

// Explicit region prevents the SDK from doing GetBucketLocation HTTP lookup
const REGION = 'us-east-1';

// Internal client: backend <-> MinIO (e.g. minio:9000).
export const minioClient = new minio.Client({
    endPoint: internalEndpoint.host,
    port: internalEndpoint.port,
    useSSL: internalEndpoint.useSSL,
    accessKey: env.minioRootUser,
    secretKey: env.minioRootPassword,
    region: REGION,
});

// Public client: used ONLY for presigned URL generation. URLs must be browser-resolvable.
const minioPublicClient = new minio.Client({
    endPoint: publicEndpoint.host,
    port: publicEndpoint.port,
    useSSL: publicEndpoint.useSSL,
    accessKey: env.minioRootUser,
    secretKey: env.minioRootPassword,
    region: REGION,
});

export const storageKeys = {
    postAttachment:         (workspaceId: string, postId: string, fileId: string) => 
        `workspaces/${workspaceId}/posts/${postId}/${fileId}`,
    homeworkAttachment:     (workspaceId: string, homeworkId: string, fileId: string) => 
        `workspaces/${workspaceId}/homeworks/${homeworkId}/${fileId}`,
    submissionAttachment:   (workspaceId: string, homeworkId: string, userId: string, fileId: string) => 
        `workspaces/${workspaceId}/homeworks/${homeworkId}/submissions/${userId}/${fileId}`,
    material:               (workspaceId: string, fileId: string) => 
        `workspaces/${workspaceId}/materials/${fileId}`,
    chatAttachment:         (conversationId: string, fileId: string) => 
        `conversations/${conversationId}/${fileId}`,
};

// Generates a presigned URL for a file that expires in minioPresignedExpiry seconds.
// Uses minioPublicClient so the URL is browser-resolvable.
export async function getPresignedGetUrl(storageKey: string): Promise<string> {
    return minioPublicClient.presignedGetObject(
        env.minioBucket,
        storageKey,
        Number(env.minioPresignedExpiry)
    );
}

// Generates a presigned URL for a file that expires in minioPresignedExpiry seconds and is limited to maxSizeBytes
export async function getPresignedPutUrl(storageKey: string, maxSizeBytes: number = 20 * 1024 * 1024): Promise<string> {
    return minioPublicClient.presignedPutObject(
        env.minioBucket,
        storageKey,
        Number(env.minioPresignedExpiry)
    );
}

export async function deleteObject(storageKey: string): Promise<void> {
    await minioClient.removeObject(env.minioBucket, storageKey);
}

export async function deleteMultipleObjects(storageKey: string[]): Promise<void> {
    if (!storageKey.length || storageKey.length === 0) return;
    await minioClient.removeObjects(env.minioBucket, storageKey);
}

export function getAvatarPublicUrl(userId: string): string {
    const base = env.minioPublicUrl.replace(/\/$/, '');
    return `${base}/${AVATARS_BUCKET}/${userId}.webp`;
}

export async function getAvatarPresignedPutUrl(userId: string): Promise<string> {
    return minioPublicClient.presignedPutObject(
        AVATARS_BUCKET,
        `${userId}.webp`,
        Number(env.minioPresignedExpiry)
    );
}