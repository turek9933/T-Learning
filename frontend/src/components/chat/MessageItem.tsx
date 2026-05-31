import type { Message } from '@/types/chat';
import { useCurrentUserId } from '@/lib/hooks/use-current-user-id';
import { useTranslations } from 'next-intl';
import { useFileUrl, getFilePreviewType, formatFileSize } from '@/lib/hooks/file-hooks';
import { Download, FileIcon, FileTextIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePreview } from '@/components/shared/FilePreview';

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
interface MessageItemProps {
    message: Message;
    // If set, the message is rendered in observer mode.
    // left/right is decided by senderId == leftSenderId
    // Used by the workspace 1:1 chat so the viewer (observer) sees a stable layout
    leftSenderId?: string;
    // When true, render the sender's name above the message (observer mode).
    showSenderName?: boolean;
}

export function MessageItem({ message, leftSenderId, showSenderName }: MessageItemProps) {
    const currentUserId = useCurrentUserId();
    const isOwn = message.senderId === currentUserId;
    const isDeleted = !!message.deletedAt;
    const hasAttachment = message.type !== 'text';
    const t = useTranslations('components.chat');

    const observerMode = leftSenderId !== undefined;
    const isRight = observerMode
        ? message.senderId !== leftSenderId
        : isOwn;

    // Observer mode uses a single neutral colour for both sides
    // DM mode uses "own = primary, other = bg" colours.
    const bubbleClasses = isDeleted
        ? 'bg-bg text-text-muted rounded-md'
        : observerMode
            ? `bg-bg text-text ${isRight ? 'rounded-br-sm' : 'rounded-bl-sm'}`
            : isOwn
                ? 'bg-primary text-text-contrast rounded-br-sm'
                : 'bg-bg text-text rounded-bl-sm';

    const fallbackName = message.type === 'image' ? 'image' : 'file';

    return (
        <div
        key={message.id}
        className={`flex flex-col mb-2 ${isRight ? 'items-end' : 'items-start'}`}
        >
            {showSenderName && message.senderName && (
                <span className="text-xs text-text-muted px-2">
                    {message.senderName}
                </span>
            )}
            <div className={`
            rounded-2xl px-4 py-2 text-sm break-all
            ${hasAttachment ? 'max-w-xs' : 'max-w-2/3'}
            ${bubbleClasses}
            `}>
                {isDeleted ? (
                    <span className='italic'>{t('deletedMessage')}</span>
                ) : message.type === 'text' ? (
                    <span className='whitespace-pre-wrap'>{message.content}</span>
                ) : (
                    <FilePreview
                    storageKey={message.content}
                    name={message.attachment?.name ?? fallbackName}
                    mimeType={message.attachment?.mimeType || 'application/octet-stream'}
                    size={message.attachment?.size ?? 0}
                    invisibleBg
                    />
                )}
            </div>
        </div>
    );
}