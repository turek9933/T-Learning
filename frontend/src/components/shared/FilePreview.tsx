'use client';
import { Download, FileIcon, FileTextIcon, Loader2, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { useFileUrl, getFilePreviewType, formatFileSize } from '@/lib/hooks/file-hooks';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
    storageKey?: string;
    name: string;
    mimeType: string;
    size: number;
    preview?: string;
    invisibleBg?: boolean;
    onRemove?: () => void;
}

function ImagePreview({
    storageKey,
    name,
    invisibleBg = false,
    preview,
    onRemove
    }: {
    storageKey?: string;
    name: string,
    invisibleBg?: boolean,
    preview?: string,
    onRemove?: () => void
}) {
    const { data: url, isPending, isError } = useFileUrl(storageKey || '');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const imageUrl = preview || url;

    if (storageKey && isPending) {
        return (
            <div className={`flex items-center justify-center w-24 h-24 rounded-lg ${invisibleBg || 'bg-bg-muted'}`}>
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
        );
    }
    if (storageKey && (isError || !imageUrl)) {
        return (
            <div className={`flex items-center justify-center text-center w-24 h-24 rounded-lg ${invisibleBg || 'bg-bg-muted'} text-text-muted text-xs break-all`}>
                {name}
            </div>
        );
    }

    if (!imageUrl) return null;

    return (
        <>
            <div className="relative group rounded-lg overflow-hidden">
                <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block focus:outline-none cursor-zoom-in"
                title={name}
                >
                    <img
                    src={imageUrl}
                    alt={name}
                    className="max-w-48 max-h-36 object-cover rounded-md cursor-zoom-in"
                    loading="lazy"
                    />
                    <div className="absolute inset-0 group-hover:bg-bg/40 transition-colors flex items-center justify-center pointer-events-none">
                        <ZoomIn className="w-5 h-5 text-text opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </button>
                {onRemove && (
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="absolute top-2 right-2 w-6 h-6 bg-bg text-text border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-hover hover:text-error p-0"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                )}
            </div>

            {lightboxOpen && (
                <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-bg-muted/50"
                onClick={() => setLightboxOpen(false)}
                >
                    <Button
                    variant="ghost"
                    className="absolute top-4 right-4 w-8 h-8 text-text bg-bg hover:text-text-contrast hover:bg-bg-hover"
                    onClick={() => setLightboxOpen(false)}
                    >
                        <X className="w-7 h-7" />
                    </Button>
                    <img
                    src={imageUrl}
                    alt={name}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                    />
                    {!preview && (
                        <Button
                        variant="ghost"
                        className="group absolute top-4 right-16 w-8 h-8 text-text bg-bg hover:text-text-contrast hover:bg-bg-hover"
                        onClick={() => setLightboxOpen(false)}
                        >
                            <a
                            href={imageUrl}
                            download={name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-text transition-colors group-hover:text-text-contrast"
                            >
                                <Download className="w-6 h-6 transition-colors group-hover:text-text-contrast" />
                            </a>
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}

function DownloadPreview({ storageKey, name, mimeType, size, invisibleBg = false, preview, onRemove }: FilePreviewProps) {
    const { data: url, isPending, isError } = useFileUrl(storageKey || '');
    const Icon = getFilePreviewType(mimeType) === 'pdf' ? FileTextIcon : FileIcon;
    const fileUrl = preview || url;

    return (
        <div className={`flex items-center gap-2 p-2 rounded-md ${invisibleBg || 'bg-bg-muted border border-border'} max-w-xs`}>
            <Icon className="w-4 h-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{name}</p>
                <p className="text-xs text-text-muted">{formatFileSize(size)}</p>
            </div>
            {storageKey && isPending ? (
                <div className={`flex items-center justify-center rounded-lg ${invisibleBg || 'bg-bg-muted'}`}>
                    <Loader2 className="w-4 h-4 text-text-primary animate-spin shrink-0" />
                </div>
            ) : fileUrl && !preview ? (
                <a
                href={fileUrl}
                download={name}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
                >
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-accent" />
                    </Button>
                </a>
            ) : null}
            {onRemove && (
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 cursor-pointer text-text-muted bg-bg hover:bg-bg-hover hover:text-error"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}

export function FilePreview(props: FilePreviewProps) {
    const previewType = getFilePreviewType(props.mimeType);

    if (previewType === 'image') return <ImagePreview storageKey={props.storageKey} name={props.name} preview={props.preview} onRemove={props.onRemove} />;
    return <DownloadPreview {...props} />;
}

export function FilePreviewList({ files }: { files: FilePreviewProps[] }) {
    if (files.length === 0) return null;
    const images = files.filter(f => getFilePreviewType(f.mimeType) === 'image');
    const others = files.filter(f => getFilePreviewType(f.mimeType) !== 'image');

    return (
        <div className="flex flex-row space-y-2">
            {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {images.map((f, i) => <FilePreview key={f.storageKey || `pending-${i}`} {...f} />)}
                </div>
            )}
            {others.length > 0 && (
                <div className="flex flex-col gap-2">
                    {others.map((f, i) => <FilePreview key={f.storageKey || `pending-${i}`} {...f} />)}
                </div>
            )}
        </div>
    );
}
