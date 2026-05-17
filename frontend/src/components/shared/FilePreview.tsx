'use client';
import { Download, FileIcon, FileTextIcon, Loader2, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { useFileUrl, getFilePreviewType, formatFileSize } from '@/lib/hooks/file-hooks';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
    storageKey: string;
    name: string;
    mimeType: string;
    size: number;
    invisibleBg?: boolean;
}

function ImagePreview({ storageKey, name, invisibleBg = false }: { storageKey: string; name: string, invisibleBg?: boolean }) {
    const { data: url, isPending, isError } = useFileUrl(storageKey);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (isPending) {
        return (
            <div className={`flex items-center justify-center w-24 h-24 rounded-lg ${invisibleBg || 'bg-bg-muted'}`}>
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
        );
    }
    if (isError || !url) {
        return (
            <div className={`flex items-center justify-center text-center w-24 h-24 rounded-lg ${invisibleBg || 'bg-bg-muted'} text-text-muted text-xs break-all`}>
                {name}
            </div>
        );
    }

    return (
        <>
            <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative group rounded-lg overflow-hidden focus:outline-none cursor-zoom-in"
            title={name}
            >
                <img
                src={url}
                alt={name}
                className="max-w-48 max-h-36 object-cover rounded-md cursor-zoom-in"
                loading="lazy"
                />
                <div className="absolute inset-0 group-hover:bg-bg/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-text opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </button>

            {lightboxOpen && (
                <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-bg-muted/50"
                onClick={() => setLightboxOpen(false)}
                >
                    <button
                    type="button"
                    className="absolute top-4 right-4 text-text hover:text-text-muted"
                    onClick={() => setLightboxOpen(false)}
                    >
                        <X className="w-7 h-7" />
                    </button>
                    <img
                    src={url}
                    alt={name}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                    />
                    <button
                    type="button"
                    className="absolute top-4 right-16 text-text hover:text-text-muted"
                    onClick={() => setLightboxOpen(false)}
                    >
                        {/* //TODO Add a download handler */}
                        <a
                        href={url}
                        download={name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-text hover:text-text-muted"
                        >
                            <Download className="w-6 h-6" />
                        </a>
                    </button>
                </div>
            )}
        </>
    );
}

function DownloadPreview({ storageKey, name, mimeType, size, invisibleBg = false }: FilePreviewProps) {
    const { data: url, isPending, isError } = useFileUrl(storageKey);
    const Icon = getFilePreviewType(mimeType) === 'pdf' ? FileTextIcon : FileIcon;

    return (
        <div className={`flex items-center gap-2 p-2 rounded-md ${invisibleBg || 'bg-bg-muted border border-border'} max-w-xs`}>
            <Icon className="w-4 h-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{name}</p>
                <p className="text-xs text-text-muted">{formatFileSize(size)}</p>
            </div>
            {isPending ? (
                <div className={`flex items-center justify-center rounded-lg ${invisibleBg || 'bg-bg-muted'}`}>
                    <Loader2 className="w-4 h-4 text-text-primary animate-spin shrink-0" />
                </div>
            ) : url ? (
                <a
                href={url}
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
        </div>
    );
}

export function FilePreview(props: FilePreviewProps) {
    const previewType = getFilePreviewType(props.mimeType);

    if (previewType === 'image') return <ImagePreview storageKey={props.storageKey} name={props.name} />;
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
                    {images.map(f => <FilePreview key={f.storageKey} {...f} />)}
                </div>
            )}
            {others.length > 0 && (
                <div className="flex flex-col gap-2">
                    {others.map(f => <FilePreview key={f.storageKey} {...f} />)}
                </div>
            )}
        </div>
    );
}
