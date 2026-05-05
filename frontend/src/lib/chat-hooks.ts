import { useCallback, useEffect } from "react";
import { Conversation, Message, WsIncomingEvent } from "@/types/chat";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { wsClient } from "./ws-client";
import { env } from "@/lib/env";

export function useWsEvent(handler: (event: WsIncomingEvent) => void) {
    useEffect(() => {
        const unsubscribe = wsClient.subscribe(handler)
        return () => { unsubscribe() }
    }, [handler])
}

export function useCreateConversation() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: (participantId: string) =>
            fetch(`${env.apiUrl}/api/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ participantId }),
            }).then(r => r.json()) as Promise<Conversation>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
    })
}

export function useConversation(conversationId: string) {
    const queryClient = useQueryClient();

    const conversations = queryClient.getQueryData<Conversation[]>(['conversations']) || [];

    return conversations.find(c => c.id === conversationId);
}

export function useConversations() {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () => fetch(`${env.apiUrl}/api/conversations`, { credentials: 'include' }).then(r => r.json()) as Promise<Conversation[]>,
    })
}


export function useMessages(conversationId: string) {
    return useInfiniteQuery({
        queryKey: ['messages', conversationId],
        queryFn: ({ pageParam }) => {
            const url = `${env.apiUrl}/api/conversations/${conversationId}/messages?limit=30`
            + (pageParam ? `&cursor=${pageParam}` : '');
            return fetch(url, { credentials: 'include' }).then(r => r.json()) as Promise<Message[]>;
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => {
            if (lastPage.length < 30) return null;
            return lastPage[lastPage.length - 1].createdAt;
        }
    });
}

export function useChatSync() {
    const queryClient = useQueryClient()

    useWsEvent(useCallback((event) => {
        if (event.eventType === 'message.new') {
            queryClient.setQueryData(
                ['messages', event.message.conversationId],
                (old: InfiniteData<Message[]> | undefined) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: [
                            [event.message, ...old.pages[0]],
                            ...old.pages.slice(1),
                        ],
                    }
                }
            )
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
    }, [queryClient]))
}