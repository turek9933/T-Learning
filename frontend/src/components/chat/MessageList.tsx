'use client';
import { useMessages, useWsEvent } from "@/lib/chat-hooks";
import React, { useCallback, useEffect, useRef } from "react";
import { MessageItem } from "@/components/chat/MessageItem";
import { useTranslations } from "next-intl";

export function MessageList({ conversationId, typingUserId, onTypingChange }: {
    conversationId: string,
    typingUserId: string | null,
    onTypingChange: (typingUserId: string | null) => void
}) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const isLoadingMoreRef = useRef(false);
    const t = useTranslations('components.chat');

    const allMessages = data?.pages.slice().reverse().flatMap(page => [...page].reverse()) ?? []

    useEffect(() => {
        isLoadingMoreRef.current = isFetchingNextPage;
    }, [isFetchingNextPage]);

    useEffect(() => {
        const currentLength = allMessages.length;
        const prevLength = prevLengthRef.current;

        if (currentLength > prevLength && !isLoadingMoreRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        prevLengthRef.current = currentLength;
    }, [allMessages.length]);

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
            {isFetchingNextPage && (
                <div className="sticky top-0 z-10 flex justify-center py-2 bg-bg-muted">
                    <p className="text-center text-xs text-text-muted py-2">
                        {t('loading')}
                    </p>
                </div>
            )}
            {allMessages.map((message) => (
                <MessageItem key={message.id} message={message} />
            ))}
            {typingUserId && <p className="text-xs text-text-muted px-2 py-1">Pisze... //TODO</p>}
            <div ref={bottomRef} />
        </div>
    );
}