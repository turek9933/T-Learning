'use client';
import { useState } from "react";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

export function MessageWindow({ conversationId }: { conversationId: string }) {
    const [typingUserId, setTypingUserId] = useState<string | null>(null);
    return (
        <div className="flex flex-col h-full">
            <div className="flex h-14 border-b border-border px-4">
                <p className="font-semibold"> Reciver name</p>
            </div>

            <MessageList
                conversationId={conversationId}
                typingUserId={typingUserId}
                onTypingChange={setTypingUserId}
            />

            <MessageInput conversationId={conversationId} />
        </div>
    )
}