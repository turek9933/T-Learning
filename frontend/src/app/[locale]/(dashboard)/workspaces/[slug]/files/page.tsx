'use client';
import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Paperclip, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { FilePreview } from '@/components/shared/FilePreview';
import { customToast } from '@/components/CustomToast';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';
import { useWorkspace } from '@/lib/queries/workspaces';
import { canModerate } from '@/lib/permissions/client';
import { useMaterials, useCreateMaterial, useDeleteMaterial } from '@/lib/hooks/material-hooks';
import { useFileUpload, MAX_FILE_SIZE, formatFileSize } from '@/lib/hooks/file-hooks';
import { useDateFormat } from '@/lib/utils/date';

export default function WorkspaceFilesPage() {
    const t = useTranslations('workspace.files');
    const { slug } = useParams<{ slug: string }>();
    const { formatShortDate } = useDateFormat();

    const { data: workspace, isPending: wsPending, isError: wsError } = useWorkspace(slug);
    const { data: materials = [], isPending: matPending, isError: matError } = useMaterials(slug);
    const createMaterial = useCreateMaterial(slug);
    const deleteMaterial = useDeleteMaterial(slug);
    const uploadFile     = useFileUpload();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const canMod = canModerate(workspace?.role);
    const isUploading = uploadFile.isPending || createMaterial.isPending;

    if (wsPending) return <WorkspacePending />;
    if (wsError || !workspace) return <WorkspaceError errorMessage={t('errorLoad')} />;

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (file.size > MAX_FILE_SIZE.material) {
            customToast.error(t('errorFileTooLarge', { name: file.name, max: formatFileSize(MAX_FILE_SIZE.material) }));
            return;
        }

        try {
            const storageKey = await uploadFile.mutateAsync({
                context: 'material',
                contextId: workspace!.id,
                file,
            });
            await createMaterial.mutateAsync({
                name: file.name,
                storageKey,
                mimeType: file.type,
                size: file.size,
            });
            customToast.success(t('successUpload'));
        } catch {
            customToast.error(t('errorUpload'));
        }
    }

    async function handleDelete(id: string) {
        setDeletingId(id);
        deleteMaterial.mutate(id, {
            onSuccess: () => customToast.success(t('successDelete')),
            onError:   () => customToast.error(t('errorDelete')),
            onSettled: () => setDeletingId(null),
        });
    }

    return (
        <PageContainer>
            <div className="w-full max-w-4xl space-y-4">
                <div className="flex items-center justify-between">
                    <h2>{t('title')}</h2>
                    {canMod && (
                        <>
                            <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            />
                            <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-2 cursor-pointer"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('uploading')}
                                    </>
                                ) : (
                                    <>
                                        <Paperclip className="w-4 h-4" />
                                        {t('addFile')}
                                    </>
                                )
                                }
                            </Button>
                        </>
                    )}
                </div>

                {matPending ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : matError ? (
                    <p className="text-error text-center py-8">{t('errorLoad')}</p>
                ) : materials.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                        <p className="text-text">{t('empty')}</p>
                        <p className="text-text-muted text-sm">{t('emptyInfo')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {materials.map(m => (
                            <div
                            key={m.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-card"
                            >
                                <div className="flex-1 min-w-0">
                                    <FilePreview
                                    storageKey={m.storageKey}
                                    name={m.name}
                                    mimeType={m.mimeType}
                                    size={m.size}
                                    />
                                </div>
                                <div className="hidden sm:flex flex-col items-end text-xs text-text-secondary shrink-0">
                                    {m.uploaderName && (
                                        <span>{t('uploadedBy')} {m.uploaderName}</span>
                                    )}
                                    <span>{formatShortDate(m.createdAt)}</span>
                                </div>
                                {canMod && (
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-text-secondary hover:text-error cursor-pointer"
                                    disabled={deletingId === m.id}
                                    onClick={() => handleDelete(m.id)}
                                    >
                                        {deletingId === m.id
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Trash2 className="w-4 h-4" />
                                        }
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
