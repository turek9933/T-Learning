'use client';

import { useRouter } from "@/i18n/routing";
import { useConversations, useCreateConversation } from "@/lib/hooks/chat-hooks";
import { UserSearch } from "../shared/UserSearch";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConversationItem } from "./ConversationItem";

export function ConversationList() {
    const { data: conversations = [], isLoading } = useConversations();
    const createConversation = useCreateConversation();
    const router = useRouter();
    const t = useTranslations('components.chat');

    const handleSelectUser = async (user: { id: string }) => {
        const conversation = await createConversation.mutateAsync(user.id);
        router.push(`/chat/${conversation.id}`);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <UserSearch
                onSelect={handleSelectUser}
                actionIcon={<Send className="w-4 h-4" />}
                showMail={false} />
            </div>

            <div className="flex-1">
                {isLoading && (<p className="p-4 text-sm text-text-muted">{t('loading')}</p>)}
                {conversations.length > 0
                ? conversations.map((conv) => (
                    <ConversationItem key={conv.id} conversation={conv} />
                ))
                : <p className="p-4 text-sm text-text-muted">{t('noConversations')}</p>}
            </div>
        </div>
    );
}