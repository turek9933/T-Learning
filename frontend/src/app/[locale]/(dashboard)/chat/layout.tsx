'use client'

import { ConversationList } from "@/components/chat/ConversationList";
import { PageContainer } from "@/components/layout/PageContainer";
import { useChatSync } from "@/lib/chat-hooks"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    useChatSync()

    return (
        <PageContainer>
            <div className="md:flex flex flex-col h-full">
                <ConversationList />
            </div>
            <div className="flex flex-1 flex-col">
                {children}
            </div>
        </PageContainer>
    );
}