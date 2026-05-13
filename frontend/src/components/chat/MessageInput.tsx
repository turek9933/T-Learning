'use client';
import { wsClient } from "@/lib/ws-client";
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileIcon, Loader2, Paperclip, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSendTextMessage, useSendFileMessage } from "@/lib/chat-hooks";
import { MAX_FILE_SIZE, formatFileSize } from "@/lib/file-hooks";
import { customToast } from "@/lib/customToast";

interface PendingFile {
    file: File;
    previewUrl: string | null;
}

export function MessageInput({ conversationId }: { conversationId: string }) {
    const [value, setValue] = useState("");
    const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
    const t = useTranslations('components.chat');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isWriting = useRef(false);
    const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const sendFile = useSendFileMessage();
    const sendText = useSendTextMessage();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        if (!isWriting.current) {
            isWriting.current = true;
            wsClient.send({ eventType: 'typing.start', conversationId });
        }
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            isWriting.current = false;
            wsClient.send({ eventType: 'typing.stop', conversationId });
        }, 2000);
    }

    const clearPendingFile = () => {
        if (pendingFile?.previewUrl) {
            URL.revokeObjectURL(pendingFile.previewUrl);
        }
        setPendingFile(null);
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE['chat']) {
            customToast.warning(t('fileTooLarge', { size: formatFileSize(MAX_FILE_SIZE['chat']) }));
            return;
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

        setPendingFile({ file, previewUrl });
        e.target.value = '';
    }

    const handleSend = async () => {
        const content = value.trim();
        
        // File upload
        if (pendingFile) {
            try {
                await sendFile.mutateAsync({
                    conversationId,
                    file: pendingFile.file,
                });
                clearTimeout(typingTimeout.current);
                wsClient.send({ eventType: 'typing.stop', conversationId });
                clearPendingFile();
                setValue('');
            } catch (error) {
                console.error(error);
                customToast.error(t('errorSendingMessage'));
            }
        }
        // Text message
        else if (content) {
            sendText(conversationId, content);
            setValue('');
            clearTimeout(typingTimeout.current);
            wsClient.send({ eventType: 'typing.stop', conversationId });
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const isSending = sendFile.isPending;
    const canSend = (value.trim().length > 0 || pendingFile !== null) && !isSending;

    return (
        <div className="border-t border-border p-4 flex items-end gap-2">
            {/* Preview selected file */}
            {pendingFile && (
                <div className="flex items-center gap-1 bg-bg rounded-md px-2 py-1">
                    {pendingFile.previewUrl ? (
                        <img
                        src={pendingFile.previewUrl}
                        alt={pendingFile.file.name}
                        className="w-12 h-12 object-cover shrink-0"
                        />
                    ) : (
                        <FileIcon className="w-8 h-8 text-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted truncate">{pendingFile.file.name}</p>
                        <p className="text-xs text-text-muted">{formatFileSize(pendingFile.file.size)}</p>
                    </div>
                    <Button
                    onClick={clearPendingFile}
                    disabled={isSending}
                    className="text-text w-6 h-6 cursor-pointer"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            )}

            {/* Message input */}

            {/* File input */}
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={isSending}
            className="hidden"
            />
            <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isSending || pendingFile !== null}
            onClick={() => fileInputRef.current?.click()}
            >
                <Paperclip className="w-4 h-4 text-primary" />
            </Button>

            {/* Text message input */}
            <Textarea
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            disabled={isSending}
            rows={1}
            className="flex-1 resize-none bg-bg min-h-0 max-h-24 overflow-y-auto"
            />
            <Button
            onClick={handleSend}
            disabled={!canSend}
            className="ml-2 bg-primary hover:bg-primary-hover text-text-contrast">
                {isSending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                }
            </Button>
        </div>
    );
}