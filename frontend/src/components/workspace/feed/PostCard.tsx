'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Pin, Trash2 } from 'lucide-react';
import type { PostItem } from '@/types/post';
import { useDeletePost } from '@/lib/hooks/post-hooks';
import { PostComments } from './PostComments';
import Avatar from '@/components/shared/Avatar';
import { FilePreviewList } from '@/components/shared/FilePreview';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface PostCardProps {
    slug: string;
    post: PostItem;
    canModerate: boolean;
    canParticipate: boolean;
    workspaceActive: boolean;
}

export function PostCard({ slug, post, canModerate, canParticipate, workspaceActive }: PostCardProps) {
    const t = useTranslations('dashboard.workspace.post');
    const { data: session } = authClient.useSession();
    const [commentsOpen, setCommentsOpen] = useState(false);
    const deletePost = useDeletePost(slug);

    const canDelete = canModerate || post.userId === session?.user.id;

    return (
        <div className="bg-bg border border-border rounded-xl p-4 space-y-3">

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Avatar avatarUrl={post.userAvatar} name={post.userName} size={8} />
                    <div>
                        <p className="text-sm font-medium text-text">
                            {post.userName ?? t('unknownUser')}
                        </p>
                        <p className="text-xs text-text-muted">{formatDate(post.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {post.pinned && (
                        <Pin className="w-4 h-4 text-accent m-1" />
                    )}
                    {canDelete && (
                        <Button
                        variant="ghost"
                        onClick={() => deletePost.mutate(post.id)}
                        disabled={deletePost.isPending}
                        className="text-text-muted hover:text-error"
                        title={t('delete')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <p className="text-sm text-text whitespace-pre-wrap break-words">{post.content}</p>

            {/* Attachments */}
            {post.attachments.length > 0 && (
                <FilePreviewList files={post.attachments} />
            )}

            {/* Footer */}
            {workspaceActive && (
                <div className="flex items-center pt-1">
                    <Button
                    variant="ghost"
                    onClick={() => setCommentsOpen(v => !v)}
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-primary hover:bg-bg-muted"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>{commentsOpen ? t('hideComments') : t('showComments')}</span>
                    </Button>
                </div>
            )}

            {/* Comments */}
            {workspaceActive && commentsOpen && (
                <PostComments
                slug={slug}
                postId={post.id}
                canParticipate={canParticipate}
                canModerate={canModerate}
                />
            )}
        </div>
    );
}