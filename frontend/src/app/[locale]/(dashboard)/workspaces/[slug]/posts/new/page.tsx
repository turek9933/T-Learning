'use client';
import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { FileText, Loader2, Paperclip, Pin, X } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/lib/queries/workspaces';
import { useCreatePost } from '@/lib/hooks/post-hooks';
import { useMultiFileUpload, MAX_FILE_SIZE, MAX_FILE_COUNT, formatFileSize } from '@/lib/hooks/file-hooks';
import { customToast } from '@/components/CustomToast';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';

interface PendingFile {
    file: File;
    preview: string | null;
}

export default function NewPostPage() {
    const t = useTranslations('dashboard.workspace.post.new');
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();

    const { data: workspace, isPending: wsLoading, isError: wsError } = useWorkspace(slug);
    const canModerate = workspace?.role === 'owner' || workspace?.role === 'admin';

    const createPost = useCreatePost(slug);
    const uploadFiles = useMultiFileUpload();

    const [content, setContent] = useState('');
    const [pinned, setPinned] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (wsLoading) return <WorkspacePending />;
    if (wsError || !workspace) return <WorkspaceError errorMessage={t('errorLoad')} />;
    if (!canModerate) {
        router.replace(`/workspaces/${slug}`);
        return null;
    }

    const MAX_FILES = MAX_FILE_COUNT.post;
    const MAX_SIZE = MAX_FILE_SIZE.post;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? []);
        e.target.value = '';

        const remaining = MAX_FILES - pendingFiles.length;
        if (remaining <= 0) {
            customToast.error(t('errorMaxFiles', { max: MAX_FILES }));
            return;
        }

        const valid = selected.slice(0, remaining).filter(file => {
            if (file.size > MAX_SIZE) {
                customToast.error(t('errorFileTooLarge', { name: file.name, max: formatFileSize(MAX_SIZE) }));
                return false;
            }
            return true;
        });

        const newFiles: PendingFile[] = valid.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        }));

        setPendingFiles(prev => [...prev, ...newFiles]);
    }

    function removeFile(index: number) {
        setPendingFiles(prev => {
            const updated = [...prev];
            const removed = updated.splice(index, 1)[0];
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return updated;
        });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!content.trim() || !workspace) return;

        const draftId = crypto.randomUUID();
        let attachments: Array<{ storageKey: string; name: string; mimeType: string; size: number }> = [];

        if (pendingFiles.length > 0) {
            try {
                const storageKeys = await uploadFiles.mutateAsync(
                    pendingFiles.map(pendingFile => ({
                        context: 'post' as const,
                        contextId: workspace.id,
                        secondaryId: draftId,
                        file: pendingFile.file,
                    }))
                );
                attachments = pendingFiles.map((pendingFile, i) => ({
                    storageKey: storageKeys[i]!,
                    name: pendingFile.file.name,
                    mimeType: pendingFile.file.type,
                    size: pendingFile.file.size,
                }));
            } catch {
                customToast.error(t('errorUpload'));
                return;
            }
        }

        createPost.mutate(
            { content: content.trim(), pinned, attachments },
            {
                onSuccess: () => {
                    customToast.success(t('success'));
                    router.push(`/workspaces/${slug}`);
                },
                onError: () => customToast.error(t('error')),
            }
        );
    }

    const isSubmitting = uploadFiles.isPending || createPost.isPending;

    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-4">
                <h2 className="text-text">{t('title')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={t('contentPlaceholder')}
                    rows={6}
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-border-focus resize-none break-words"
                    />

                    {/* Pending files preview */}
                    {pendingFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {pendingFiles.map((pf, i) => (
                                <div key={i} className="relative group">
                                    {pf.preview ? (
                                        <img
                                        src={pf.preview}
                                        alt={pf.file.name}
                                        className="w-24 h-20 object-cover rounded-lg border border-border"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-bg-muted border border-border rounded-lg">
                                            <FileText className="w-4 h-4 text-text-muted" />
                                            <span className="text-xs text-text truncate max-w-28">{pf.file.name}</span>
                                        </div>
                                    )}
                                    <Button
                                    variant="ghost"
                                    onClick={() => removeFile(i)}
                                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-bg border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-hover hover:text-error"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {pendingFiles.length < MAX_FILES && (
                                <>
                                    <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                    />
                                    <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        {t('attachFiles')} ({pendingFiles.length}/{MAX_FILES})
                                    </Button>
                                </>
                            )}
                            <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPinned(v => !v)}
                            className={pinned ? 'text-accent' : 'text-text-muted'}
                            >
                                <Pin className="w-4 h-4" />
                                {pinned ? t('pinned') : t('pin')}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.push(`/workspaces/${slug}`)}
                            disabled={isSubmitting}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                            type="submit"
                            disabled={!content.trim() || isSubmitting}
                            className="text-text-contrast"
                            >
                                {isSubmitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('publishing')}</>
                                    : t('publish')
                                }
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </PageContainer>
    );
}
