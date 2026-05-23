'use client';
import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Clock, Loader2, Paperclip, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/lib/queries/workspaces';
import { useDateFormat } from '@/lib/utils/date';
import { useHomework, useMySubmission, useSubmitHomework, useUpdateSubmission } from '@/lib/hooks/homework-hooks';
import { useMultiFileUpload, MAX_FILE_SIZE, MAX_FILE_COUNT, formatFileSize } from '@/lib/hooks/file-hooks';
import { FilePreview, FilePreviewList } from '@/components/shared/FilePreview';
import { customToast } from '@/components/CustomToast';

interface PendingFile { file: File; preview: string | null; }

function DueLabel({ dueAt, t }: { dueAt: string | null; t: ReturnType<typeof useTranslations> }) {
    const { formatDateTime } = useDateFormat();
    if (!dueAt) return <span className="text-xs text-text-muted">{t('noDueDate')}</span>;
    const diff = new Date(dueAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return (
        <span className="flex items-center gap-1 text-xs text-error font-medium">
            <AlertCircle className="w-3 h-3" />
            {t('overdue')} · {formatDateTime(dueAt)}
        </span>
    );
    if (days === 0) return (
        <span className="flex items-center gap-1 text-xs text-warning font-medium">
            <AlertCircle className="w-3 h-3" />
            {t('dueToday')} · {formatDateTime(dueAt)}
        </span>
    );
    return (
        <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="w-3 h-3" />
            {t('dueAt')}: {formatDateTime(dueAt)}
        </span>
    );
}

export default function HomeworkDetailPage() {
    const t = useTranslations('homework.detail');
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const { formatDateTime } = useDateFormat();

    const { data: workspace } = useWorkspace(slug);
    const canModerate   = workspace?.role === 'owner' || workspace?.role === 'admin';
    const canParticipate = workspace?.role === 'owner' || workspace?.role === 'admin' || workspace?.role === 'member';

    const { data: homework,   isPending: hwLoading,  isError: hwError  } = useHomework(slug, id);
    const { data: submission, isPending: subLoading, refetch: refetchSub } = useMySubmission(slug, id);

    const submitHw     = useSubmitHomework(slug, id);
    const updateSub    = useUpdateSubmission(slug, id, submission?.id ?? '');
    const uploadFiles  = useMultiFileUpload();

    const [content, setContent]     = useState('');
    const [pendingFiles, setFiles]  = useState<PendingFile[]>([]);
    const [isEditing, setEditing]   = useState(false);
    const fileInputRef              = useRef<HTMLInputElement>(null);

    const MAX_FILES = MAX_FILE_COUNT.submission;
    const MAX_SIZE  = MAX_FILE_SIZE.submission;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? []);
        e.target.value = '';

        const remaining = MAX_FILES - pendingFiles.length;
        if (remaining <= 0) { customToast.error(t('errorMaxFiles', { max: MAX_FILES })); return; }

        const valid = selected.slice(0, remaining).filter(f => {
            if (f.size > MAX_SIZE) {
                customToast.error(t('errorFileTooLarge', { name: f.name, max: formatFileSize(MAX_SIZE) }));
                return false;
            }
            return true;
        });

        setFiles(prev => [
            ...prev,
            ...valid.map(f => ({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null })),
        ]);
    }

    function removeFile(index: number) {
        setFiles(prev => {
            const updated = [...prev];
            const removed = updated.splice(index, 1)[0];
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return updated;
        });
    }

    function startEditing() {
        setContent(submission?.content ?? '');
        setFiles([]);
        setEditing(true);
    }

    function cancelEditing() {
        pendingFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
        setFiles([]);
        setContent('');
        setEditing(false);
    }

    const isSubmitting = uploadFiles.isPending || submitHw.isPending || updateSub?.isPending;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        let attachments: Array<{ storageKey: string; name: string; mimeType: string; size: number }> = [];

        if (pendingFiles.length > 0) {
            try {
                const keys = await uploadFiles.mutateAsync(
                    pendingFiles.map(pf => ({
                        context: 'submission' as const,
                        contextId: workspace!.id,
                        secondaryId: homework!.id,
                        file: pf.file,
                    }))
                );
                attachments = pendingFiles.map((pf, i) => ({
                    storageKey: keys[i]!,
                    name:       pf.file.name,
                    mimeType:   pf.file.type,
                    size:       pf.file.size,
                }));
            } catch {
                customToast.error(t('errorUpload'));
                return;
            }
        }

        const data = {
            content: content.trim() || undefined,
            attachments: pendingFiles.length > 0 ? attachments : undefined,
        };

        if (submission) {
            updateSub?.mutate(data, {
                onSuccess: () => {
                    customToast.success(t('successUpdate'));
                    setEditing(false);
                    setFiles([]);
                    setContent('');
                    refetchSub();
                },
                onError: () => customToast.error(t('error')),
            });
        } else {
            submitHw.mutate(data, {
                onSuccess: () => {
                    customToast.success(t('successSubmit'));
                    setEditing(false);
                    setFiles([]);
                    setContent('');
                    refetchSub();
                },
                onError: () => customToast.error(t('error')),
            });
        }
    }

    if (hwLoading || subLoading) {
        return (
            <PageContainer>
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </PageContainer>
        );
    }

    if (hwError || !homework) {
        return (
            <PageContainer>
                <div className="w-full max-w-4xl space-y-4">
                    <p className="text-sm text-error">{t('errorLoad')}</p>
                    <Link
                    href={`/workspaces/${slug}`}
                    className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('back')}
                    </Link>
                </div>
            </PageContainer>
        );
    }

    const showSubmitForm = canParticipate && !canModerate && (!submission || isEditing);

    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-6">

                {/* Back */}
                <Link
                href={`/workspaces/${slug}`}
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('back')}
                </Link>

                {/* Homework */}
                <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
                    <div className="space-y-2">
                        <h2>{homework.title}</h2>
                        <DueLabel dueAt={homework.dueAt} t={t} />
                    </div>

                    {homework.description && (
                        <p className="text-sm text-text whitespace-pre-wrap border-t border-border pt-4">
                            {homework.description}
                        </p>
                    )}

                    {homework.attachments.length > 0 && (
                        <div className="border-t border-border pt-4 space-y-2">
                            <p className="text-xs font-semibold text-text-muted tracking-wide">{t('attachments')}:</p>
                            <FilePreviewList files={homework.attachments.map(a => ({
                                storageKey: a.storageKey,
                                name:       a.name,
                                mimeType:   a.mimeType,
                                size:       a.size,
                            }))} />
                        </div>
                    )}
                </div>

                {/* Submission */}
                {canParticipate && !canModerate && (
                    <div className="rounded-xl border border-border bg-bg p-6 space-y-4">
                        {/* Resubmit button */}
                        <div className="flex items-center justify-between">
                            <h3>{t('mySubmission')}</h3>
                            {submission && !isEditing && (
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={startEditing}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {t('resubmit')}
                                </Button>
                            )}
                        </div>

                        {/* Existing submission display */}
                        {submission && !isEditing && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs text-success">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {t('submittedAt')} {formatDateTime(submission.submittedAt)}
                                    {submission.updatedAt !== submission.submittedAt && (
                                        <span className="text-text-muted">  {t('updated')} {formatDateTime(submission.updatedAt)}</span>
                                    )}
                                </div>
                                {submission.content && (
                                    <p className="text-sm text-text bg-bg-muted rounded-lg p-3 whitespace-pre-wrap">
                                        {submission.content}
                                    </p>
                                )}
                                {submission.attachments.length > 0 && (
                                    <FilePreviewList files={submission.attachments.map(a => ({
                                        storageKey: a.storageKey,
                                        name:       a.name,
                                        mimeType:   a.mimeType,
                                        size:       a.size,
                                    }))} />
                                )}
                            </div>
                        )}

                        {/* Submit / resubmit form */}
                        {showSubmitForm && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder={t('contentPlaceholder')}
                                rows={4}
                                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted"
                                />

                                {/* File upload */}
                                <div className="space-y-2">
                                    {isEditing && submission && (
                                        <p className="text-xs text-warning">{t('attachmentsNote')}</p>
                                    )}
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
                                            disabled={isSubmitting}
                                            onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Paperclip className="w-4 h-4" />
                                                {t('attachFiles')} ({pendingFiles.length}/{MAX_FILES})
                                            </Button>
                                        </>
                                    )}
                                    {pendingFiles.length > 0 && (
                                        <FilePreviewList files={pendingFiles.map((pf, i) => ({
                                            name:     pf.file.name,
                                            mimeType: pf.file.type,
                                            size:     pf.file.size,
                                            preview:  pf.preview || undefined,
                                            onRemove: () => removeFile(i),
                                        }))} />
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    {isEditing && (
                                        <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={cancelEditing}
                                        disabled={isSubmitting}
                                        >
                                            {t('cancel')}
                                        </Button>
                                    )}
                                    <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="text-text-contrast"
                                    >
                                        {isSubmitting
                                            ? <><Loader2 className="w-4 h-4 animate-spin" />{t('submitting')}</>
                                            : isEditing ? t('update') : t('submit')
                                        }
                                    </Button>
                                </div>
                            </form>
                        )}

                        {!submission && !showSubmitForm && !canModerate && (
                            <p className="text-sm text-text-muted">{t('viewerNoSubmit')}</p>
                        )}
                    </div>
                )}

                {/* Moderator sees all submissions */}
                {canModerate && (
                    <div className="rounded-xl border border-border bg-bg p-6 space-y-3">
                        <h3 className="font-semibold text-text">{t('submissions')}</h3>
                        <p className="text-sm text-text-muted">{t('submissionsNote')}</p>
                        {/* //TODO Dodać funkcje moderatora */}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
