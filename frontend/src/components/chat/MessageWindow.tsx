'use client';
import { useState } from "react";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useConversation } from "@/lib/chat-hooks";
import Avatar from "@/components/shared/Avatar";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export function MessageWindow({ conversationId }: { conversationId: string }) {
    const [typingUserId, setTypingUserId] = useState<string | null>(null);
    const conversation = useConversation(conversationId);

    if (!conversation) return null;

    return (
        <div className="flex flex-col flex-1">
            <div className="flex h-10 items-center border-b border-border px-4 gap-2">
                <Link href="/chat" className="hover:text-primary">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <Avatar avatarUrl={conversation.otherParticipantAvatarUrl} name={conversation.otherParticipantName} />
                <p className="font-semibold text-text">{conversation.otherParticipantName}</p>
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