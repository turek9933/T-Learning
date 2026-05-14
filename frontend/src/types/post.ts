export type PostItem = {
    type: 'post';
    id: string;
    content: string;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    userName: string | null;
    userAvatar: string | null;
    attachments: PostAttachment[];
};

export type PostAttachment = {
    id: string;
    postId: string;
    storageKey: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
};

export interface CreatePostData {
    content: string;
    pinned?: boolean;
    attachments?: Array<{ storageKey: string; name: string; mimeType: string; size: number }>;
}

export type Comment = {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    userName: string | null;
    userAvatarUrl: string | null;
};