import { MessageWindow } from "@/components/chat/MessageWindow";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
    const { conversationId } = await params;

    return (
        <MessageWindow conversationId={conversationId} />
    )
}