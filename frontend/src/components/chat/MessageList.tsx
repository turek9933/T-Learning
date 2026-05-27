'use client';
import { useMessages, useWsEvent } from "@/lib/hooks/chat-hooks";
import React, { useCallback, useEffect, useRef } from "react";
import { MessageItem } from "@/components/chat/MessageItem";
import { useTranslations } from "next-intl";

export function MessageList({
    conversationId,
    typingUserId,
    typingUserName,
    onTypingChange,
    leftSenderId,
    showSenderName,
}: {
    conversationId: string,
    typingUserId: string | null,
    typingUserName?: string,
    onTypingChange: (typingUserId: string | null) => void,
    leftSenderId?: string,
    showSenderName?: boolean,
}) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const loadingOlderRef = useRef(false);
    const t = useTranslations('components.chat');

    const allMessages = data?.pages.slice().reverse().flatMap(page => [...page].reverse()) ?? []

    useEffect(() => {
        const currentLength = allMessages.length;
        const prevLength = prevLengthRef.current;

        if (currentLength > prevLength) {
            if (loadingOlderRef.current) {
                loadingOlderRef.current = false;
            } else {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }

        prevLengthRef.current = currentLength;
    }, [allMessages.length]);

    useEffect(() => {
        if (typingUserId) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [typingUserId]);


    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if (e.currentTarget.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
            loadingOlderRef.current = true;
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
                <MessageItem
                key={message.id}
                message={message}
                leftSenderId={leftSenderId}
                showSenderName={showSenderName}
                />
            ))}

            {typingUserId &&
                <p className="text-sm text-text-muted px-2 py-1">
                    {t('isTyping', { userName: typingUserName ? typingUserName : t('user')})}
                </p>
            }
            <div ref={bottomRef} />
        </div>
    );
}