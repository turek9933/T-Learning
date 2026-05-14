import type { Message } from '@/types/chat';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import { useFileUrl, getFilePreviewType, formatFileSize } from '@/lib/hooks/file-hooks';
import { Download, FileIcon, FileTextIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ImageMessage({ storageKey, fileName, errorMessage }: { storageKey: string, fileName: string, errorMessage?: string }) {
    const { data: fileUrl, isPending, isError } = useFileUrl(storageKey);

    if (isPending) {
        return (
            <div className='flex items-center justify-center rounded-lg bg-bg-muted'>
                <Loader2 className='w-5 h-5 text-primary animate-spin' />
            </div>
        );
    }

    if (isError || !fileUrl) {
        return (
            <div className='flex items-center justify-center rounded-lg text-text-muted text-sm'>
                {errorMessage}
            </div>
        );
    }

    return (
        <a
        href={fileUrl}
        target='_blank'
        rel='noopener noreferrer'
        >
            <img
            src={fileUrl}
            alt={fileName}
            className='max-w-64 max-h-64 rounded-lg object-cover cursor-zoom-in'
            loading='lazy'
            />
        </a>
    );
}

function FileMessage({ storageKey, fileName, mimeType, fileSize }:
    { storageKey: string, fileName: string, mimeType: string, fileSize: number }) {
    const { data: fileUrl, isPending, isError } = useFileUrl(storageKey);
    const previewType = getFilePreviewType(mimeType);

    const Icon = previewType === 'pdf' ? FileTextIcon : FileIcon;

    return (
        <div className='flex items-center gap-2'>
            <Icon className='w-4 h-4 text-accent-hover' />
            <div>
                <p className='text-sm text-text font-medium'>{fileName}</p>
                <p className='text-xs text-text'>{formatFileSize(fileSize)}</p>
            </div>
            {isPending ? (
                <div className='flex items-center justify-center rounded-lg bg-bg-muted'>
                    <Loader2 className='w-5 h-5 text-primary animate-spin' />
                </div>
            ) : fileUrl ? (
                <a
                href={fileUrl}
                download={fileName}
                target='_blank'
                rel='noopener noreferrer'
                className='text-text-muted hover:text-primary-hover shrink-0'
                >
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    >
                        <Download className='w-4 h-4 text-accent-hover cursor-pointer' /> 
                    </Button>
                </a>
            ) : null }
        </div>
    );
}
export function MessageItem({ message }: { message: Message }) {
    const { data: session } = authClient.useSession();
    const isOwn = message.senderId === session?.user.id;
    const isDeleted = !!message.deletedAt;
    const hasAttachment = message.type !== 'text';    
    const t = useTranslations('components.chat');

    return (
        <div
        key={message.id}
        className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`
            rounded-2xl px-4 py-2 text-sm break-all
            ${hasAttachment ? 'max-w-xs' : 'max-w-2/3'} 
            ${isDeleted
                ? 'bg-bg text-text-muted rounded-md'
                : isOwn
                ? 'bg-primary text-text-contrast rounded-br-sm'
                : 'bg-bg text-text rounded-bl-sm'}
            `}>
                {isDeleted ? (
                    <span className='italic'>{t('deletedMessage')}</span>
                ) : message.type === 'text' ? (
                    <span className='whitespace-pre-wrap'>{message.content}</span>
                ) : message.type === 'image' ? (
                    <ImageMessage
                        storageKey={message.content}
                        fileName={message.attachment?.name ?? 'image'}
                        errorMessage={t('errorLoadImage')}
                    />
                ) : (
                    <FileMessage
                    storageKey={message.content}
                    fileName={message.attachment?.name ?? 'file'}
                    mimeType={message.attachment?.mimeType ?? 'application/octet-stream'}
                    fileSize={message.attachment?.size ?? 0}
                    />
                )}
            </div>
        </div>
    );
}