'use client';
import { useEffect } from 'react';
import { wsClient } from '@/lib/ws-client';
import { useChatSync } from '@/lib/hooks/chat-hooks';

// Keeps the WebSocket connection open
// Keeps the TanStack Query cache up to date
// Mounted once near the top so DM and workspace chat gets live updates
export function ChatRealtime() {
    useChatSync();
    useEffect(() => {
        wsClient.connect();
        return () => wsClient.disconnect();
    }, []);
    return null;
}
