import { useCallback, useEffect } from "react";
import { Conversation, Message, WsIncomingEvent } from "@/types/chat";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { wsClient } from "../ws-client";
import { env } from "@/lib/env";
import { useFileUpload } from "@/lib/hooks/file-hooks";

export function useWsEvent(handler: (event: WsIncomingEvent) => void) {
    useEffect(() => {
        const unsubscribe = wsClient.subscribe(handler);
        return () => { unsubscribe() }
    }, [handler]);
}

export function useCreateConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (participantId: string) =>
            fetch(`${env.apiUrl}/api/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ participantId }),
            }).then(r => r.json()) as Promise<Conversation>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
}

export function useConversations() {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () =>
            fetch(`${env.apiUrl}/api/conversations`, { credentials: 'include' })
                .then(r => r.json()) as Promise<Conversation[]>,
    });
}

export function useConversation(conversationId: string) {
    const { data: conversations } = useConversations();
    return conversations?.find(c => c.id === conversationId);
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
        },
    });
}

export function useSendTextMessage() {
    return useCallback((conversationId: string, content: string, replyToId?: string) => {
        wsClient.send({
            eventType: 'message.send',
            conversationId,
            contentType: 'text',
            content,
            replyToId,
        });
    }, []);
}

// Sends message with file
// 1. Uploads file to MinIO
// 2. Sends message with metadata
export function useSendFileMessage() {
    const uploadFile = useFileUpload();

    return useMutation({
        mutationFn: async ({
            conversationId,
            file,
        }: {
            conversationId: string;
            file: File;
        }) => {
            // MinIO upload
            const storageKey = await uploadFile.mutateAsync({
                context: 'chat',
                contextId: conversationId,
                file,
            });

            // WS with metadata
            const contentType = file.type.startsWith('image/') ? 'image' : 'file';

            wsClient.send({
                eventType: 'message.send',
                conversationId,
                contentType,
                content: storageKey,
                attachment: {
                    name:     file.name,
                    mimeType: file.type,
                    size:     file.size,
                },
            });

            return storageKey;
        },
    });
}

export function useChatSync() {
    const queryClient = useQueryClient();

    useWsEvent(useCallback((event) => {
        if (event.eventType === 'message.new') {
            queryClient.setQueryData(
                ['messages', event.message.conversationId],
                (old: InfiniteData<Message[]> | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: [
                            [event.message, ...old.pages[0]],
                            ...old.pages.slice(1),
                        ],
                    };
                }
            );
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    }, [queryClient]));
}

export interface WorkspaceChatParticipant {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: 'owner' | 'member';
}
export interface WorkspaceChatInfo {
    conversationId: string;
    canSend: boolean;
    participantA: WorkspaceChatParticipant;
    participantB: WorkspaceChatParticipant;
}
// Fetches workspace chat info
export function useWorkspaceChat(slug: string) {
    return useQuery<WorkspaceChatInfo>({
        queryKey: ['workspace-chat', slug],
        queryFn: async () => {
            const res = await fetch(`${env.apiUrl}/api/workspaces/${slug}/chat`, {
                credentials: 'include',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).message ?? 'Failed to fetch workspace chat');
            }
            return res.json();
        },
        staleTime: Infinity,
    });
}