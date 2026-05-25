'use client';
import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
 import { Clock, Loader2, Paperclip } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/lib/queries/workspaces';
import { useCreateHomework, type CreateHomeworkData } from '@/lib/hooks/homework-hooks';
import { useMultiFileUpload, MAX_FILE_SIZE, MAX_FILE_COUNT, formatFileSize } from '@/lib/hooks/file-hooks';
import { FilePreviewList } from '@/components/shared/FilePreview';
import { customToast } from '@/components/CustomToast';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';

interface PendingFile {
    file: File;
    preview: string | null;
}

export default function NewHomeworkPage() {
    const t = useTranslations('homework.new');
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();

    const { data: workspace, isPending: wsLoading, isError: wsError } = useWorkspace(slug);
    const canModerate = workspace?.role === 'owner' || workspace?.role === 'admin';

    const createHomework = useCreateHomework(slug);
    const uploadFiles = useMultiFileUpload();

    const [title, setTitle]           = useState('');
    const [description, setDesc]      = useState('');
    const [dueAt, setDueAt]           = useState('');
    const [pendingFiles, setFiles]    = useState<PendingFile[]>([]);
    const fileInputRef                = useRef<HTMLInputElement>(null);

    if (wsLoading) return <WorkspacePending />;
    if (wsError || !workspace) return <WorkspaceError errorMessage={t('errorLoad')} />;
    if (!canModerate) {
        router.replace(`/workspaces/${slug}`);
        return null;
    }

    const MAX_FILES = MAX_FILE_COUNT.homework;
    const MAX_SIZE  = MAX_FILE_SIZE.homework;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? []);
        e.target.value = '';
        const remaining = MAX_FILES - pendingFiles.length;
        if (remaining <= 0) {
            customToast.error(t('errorMaxFiles', { max: MAX_FILES }));
            return;
        }
        const valid = selected.slice(0, remaining).filter(f => {
            if (f.size > MAX_SIZE) {
                customToast.error(t('errorFileTooLarge', { name: f.name, max: formatFileSize(MAX_SIZE) }));
                return false;
            }
            return true;
        });
        setFiles(prev => [
            ...prev,
            ...valid.map(f => ({
                file: f,
                preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
            })),
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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!title.trim() || !workspace) return;

        let attachments: CreateHomeworkData['attachments'] = [];

        if (pendingFiles.length > 0) {
            const draftId = crypto.randomUUID();
            try {
                const keys = await uploadFiles.mutateAsync(
                    pendingFiles.map(pf => ({
                        context: 'homework' as const,
                        contextId: workspace.id,
                        secondaryId: draftId,
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

        const data: CreateHomeworkData = {
            title:          title.trim(),
            description:    description.trim() || undefined,
            dueAt:          dueAt ? new Date(dueAt).toISOString() : undefined,
            attachments,
        };

        createHomework.mutate(data, {
            onSuccess: () => {
                customToast.success(t('success'));
                router.push(`/workspaces/${slug}`);
            },
            onError: () => customToast.error(t('error')),
        });
    }

    const isSubmitting = uploadFiles.isPending || createHomework.isPending;

    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-6">
                <h2>{t('title')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Title */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('homeworkTitle')}</label>
                        <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t('homeworkTitlePlaceholder')}
                        required
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('description')}</label>
                        <Textarea
                        value={description}
                        onChange={e => setDesc(e.target.value)}
                        placeholder={t('descriptionPlaceholder')}
                        rows={4}
                        className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted"
                        />
                    </div>

                    {/* Due date */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-text">{t('dueAt')}</label>
                        <InputGroup className="max-w-sm">
                            <InputGroupAddon align="inline-start">
                                <InputGroupText>
                                    <Clock className="w-4 h-4" />
                                </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                            type="datetime-local"
                            value={dueAt}
                            onChange={e => setDueAt(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    {/* Attachments */}
                    <div className="flex flex-col space-y-3">
                        <label className="text-sm font-medium text-text">{t('attachments')}</label>
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
                                    className="max-w-sm"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        {t('attachFiles')} ({pendingFiles.length}/{MAX_FILES})
                                    </Button>
                                </>
                        )}
                        {pendingFiles.length > 0 && (
                            <FilePreviewList files={pendingFiles.map((pf, i) => ({
                                name: pf.file.name,
                                mimeType: pf.file.type,
                                size: pf.file.size,
                                preview: pf.preview || undefined,
                                onRemove: () => removeFile(i),
                            }))} />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
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
                        disabled={!title.trim() || isSubmitting}
                        className="text-text-contrast"
                        >
                            {isSubmitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" />{t('publishing')}</>
                                : t('publish')
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </PageContainer>
    );
}