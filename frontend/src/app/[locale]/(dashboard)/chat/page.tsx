import { ConversationList } from "@/components/chat/ConversationList";

export default function ChatPage() {
    return (
        <>
            {/* Mobile */}
            <div className="md:hidden flex flex-col h-full">
                <ConversationList />
            </div>
            {/* Desktop placeholder if nothing is selected */}
            <div className="hidden md:flex flex-col items-center justify-center">
                Placeholder ChatPage 2 //TODO Change later
            </div>
        </>
    )
}