import { MessageWindow } from "@/components/chat/MessageWindow";

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
    return (
        <MessageWindow conversationId={params.conversationId} />
    )
}