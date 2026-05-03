'use client';

import { useMessages, useWsEvent } from "@/lib/chat-hooks";
import React, { useCallback, useEffect, useRef } from "react";
import { MessageItem } from "@/components/chat/MessageItem";

export function MessageList({ conversationId, typingUserId, onTypingChange }: {
    conversationId: string,
    typingUserId: string | null,
    onTypingChange: (typingUserId: string | null) => void
}) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
    const bottomRef = useRef<HTMLDivElement>(null);

    const allMessages = data?.pages.flatMap(page => [...page].reverse()) ?? [];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if (e.currentTarget.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useWsEvent(useCallback((event) => {
        if (event.eventType === 'typing.start' && event.conversationId === conversationId) {
            onTypingChange(event.userId);
        }
        if (event.eventType === 'typing.stop' && event.conversationId === conversationId) {
            onTypingChange(null);
        }
    }, [conversationId, onTypingChange]));

    return (
        <div className="flex-1 flex flex-col overflow-y-scroll" onScroll={handleScroll}>
            {isFetchingNextPage && <p className="text-center text-xs text-text-muted py-2">Ładowanie wiadomości...//TODO</p>}
            {allMessages.map((message) => (
                <MessageItem message={message} />
            ))}
            {typingUserId && <p className="text-xs text-text-muted px-2 py-1">Pisze... //TODO</p>}
            <div ref={bottomRef} />
        </div>
    );
}