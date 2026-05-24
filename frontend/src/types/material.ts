export type Material = {
    id: string;
    uploaderId: string;
    uploaderName: string | null;
    uploaderAvatarUrl: string | null;
    name: string;
    description: string | null;
    storageKey: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
};