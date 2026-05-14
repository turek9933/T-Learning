'use client'
import { useEffect } from "react";
import { wsClient } from "@/lib/ws-client";
import { ConversationList } from "@/components/chat/ConversationList";
import { useChatSync } from "@/lib/hooks/chat-hooks"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    useChatSync();
    useEffect(() => {
        wsClient.connect()
        return () => wsClient.disconnect()
    }, [])

    return (
        // Calculation for height,
        // based on height of navbar and bottom bar on mobile (sidebar)
        // based on height of navbar on desktop
        <div className="flex h-[calc(100dvh-128px)] md:h-[calc(100dvh-64px)]">
            <div className="w-80 shrink-0 border-r border-border flex-col hidden md:flex">
                <ConversationList />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {children}
            </div>
        </div>
    )
}