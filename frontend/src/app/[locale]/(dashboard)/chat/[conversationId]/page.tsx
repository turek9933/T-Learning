'use client';
import { useParams } from 'next/navigation';
import { MessageWindow } from "@/components/chat/MessageWindow";

export default function ConversationPage() {
    const { conversationId } = useParams<{ conversationId: string }>();
    return <MessageWindow conversationId={conversationId} />;
}