'use client';
import { wsClient } from "@/lib/ws-client";
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

export function MessageInput({ conversationId }: { conversationId: string }) {
    const [value, setValue] = useState("");
    const t = useTranslations('components.chat');
    const isWriting = useRef(false);
    const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
        if (!isWriting.current) {
            isWriting.current = true
            wsClient.send({ eventType: 'typing.start', conversationId })
        }
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => {
            isWriting.current = false
            wsClient.send({ eventType: 'typing.stop', conversationId })
        }, 2000)
    }

    const handleSend = () => {
        const content = value.trim();
        if (!content) return;
        wsClient.send({ eventType: 'message.send', conversationId, content });
        setValue("");
        clearTimeout(typingTimeout.current);
        wsClient.send({ eventType: 'typing.stop', conversationId });
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="border-t border-border p-4 flex items-end gap-2">
            <Textarea
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            rows={1}
            className="flex-1 resize-none bg-bg min-h-0 max-h-24 overflow-y-auto"
            />
            <Button onClick={handleSend} className="ml-2 bg-primary hover:bg-primary-hover text-text-contrast"><Send className="w-4 h-4" /></Button>
        </div>
    );
}