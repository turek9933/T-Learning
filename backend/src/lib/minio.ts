import { env } from '@/config/env';
import * as minio from 'minio';

function parseEnpoint(endpoint: string): { host: string; port: number; useSSL: boolean } {
    const url = new URL(endpoint);
    const useSSL = url.protocol === 'https:';
    const host = url.hostname;
    const port = url.port ? parseInt(url.port) : useSSL ? 443 : 80;
    return { host, port, useSSL };
}

const { host, port, useSSL } = parseEnpoint(env.minioEndpoint);

export const minioClient = new minio.Client({
    endPoint: host,
    port: port,
    useSSL: useSSL,
    accessKey: env.minioRootUser,
    secretKey: env.minioRootPassword,
    // pathStyle: env.minioForcePathStyle
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

// Generates a presigned URL for a file that expires in minioPresignedExpiry seconds
export async function getPresignedGetUrl(storageKey: string): Promise<string> {
    return minioClient.presignedGetObject(
        env.minioBucket,
        storageKey,
        Number(env.minioPresignedExpiry)
    );
}

// Generates a presigned URL for a file that expires in minioPresignedExpiry seconds and is limited to maxSizeBytes
export async function getPresignedPutUrl(storageKey: string, maxSizeBytes: number = 20 * 1024 * 1024): Promise<string> {
    return minioClient.presignedPutObject(
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

