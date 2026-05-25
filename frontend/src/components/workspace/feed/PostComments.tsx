'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useComments, useAddComment, useDeleteComment } from '@/lib/hooks/post-hooks';
import Avatar from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

function formatRelativeDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();

    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;

    const days = Math.floor(hours / 24);
    return `${days} d`;
}

interface PostCommentsProps {
    slug: string;
    postId: string;
    canParticipate: boolean;
    canModerate: boolean;
}

export function PostComments({ slug, postId, canParticipate, canModerate }: PostCommentsProps) {
    const t = useTranslations('post');
    const { data: session } = authClient.useSession();
    const { data: comments, isPending } = useComments(slug, postId, true);
    const addComment = useAddComment(slug, postId);
    const deleteComment = useDeleteComment(slug, postId);
    const [text, setText] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim()) return;
        addComment.mutate(text.trim(), { onSuccess: () => setText('') });
    }

    return (
        <div className="border-t border-border pt-3 mt-1 space-y-3">
            {isPending ? (
                <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                </div>
            ) : comments && comments.length > 0 ? (
                <div className="space-y-2">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex gap-2 group">
                            <div className="shrink-0 mt-0.5">
                                <Avatar avatarUrl={comment.userAvatarUrl} name={comment.userName} size={6} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium text-text">
                                        {comment.userName ?? t('unknownUser')}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        {formatRelativeDate(comment.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary break-words">{comment.content}</p>
                            </div>
                            {(canModerate || comment.userId === session?.user.id) && (
                                <Button
                                variant="ghost"
                                onClick={() => deleteComment.mutate(comment.id)}
                                disabled={deleteComment.isPending}
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-error"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-text-muted text-center py-1">{t('emptyComments')}</p>
            )}

            {canParticipate && (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={t('commentPlaceholder')}
                    className="flex-1 text-sm bg-bg-muted border border-border rounded-lg px-3 py-1 text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus"
                    />
                    <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    disabled={!text.trim() || addComment.isPending}
                    className="shrink-0"
                    >
                        {addComment.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                        }
                    </Button>
                </form>
            )}
        </div>
    );
}