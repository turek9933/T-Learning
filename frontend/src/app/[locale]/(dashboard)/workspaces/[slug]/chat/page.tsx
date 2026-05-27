'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useWorkspaceChat, type WorkspaceChatParticipant } from '@/lib/hooks/chat-hooks';
import { useWorkspace } from '@/lib/queries/workspaces';
import WorkspacePending from '@/components/workspace/WorkspacePending';
import WorkspaceError from '@/components/workspace/WorkspaceError';
import Avatar from '@/components/shared/Avatar';

function ParticipantBadge({ participant, align }: { participant: WorkspaceChatParticipant; align: 'left' | 'right' }) {
    const t = useTranslations('workspace.members');
    const roleLabel = t('role' + participant.role.charAt(0).toUpperCase() + participant.role.slice(1));
    return (
        <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
            <Avatar avatarUrl={participant.avatarUrl} name={participant.name} size={7} />
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-text truncate">{participant.name}</span>
                <span className="text-xs text-text-muted">{roleLabel}</span>
            </div>
        </div>
    );
}

export default function WorkspaceChatPage() {
    const { slug } = useParams<{ slug: string }>();
    const t = useTranslations('workspace.chat');
    const [typingUserId, setTypingUserId] = useState<string | null>(null);

    const { data: workspace, isPending: wsPending, isError: wsError } = useWorkspace(slug);
    const { data: chat, isPending: chatPending, isError: chatError } = useWorkspaceChat(slug);

    if (wsPending || chatPending) return <WorkspacePending />;
    if (wsError || !workspace) return <WorkspaceError errorMessage={t('errorLoad')} />;
    if (chatError || !chat) return <WorkspaceError errorMessage={t('errorChatLoad')} />;

    // Owner is on the left, member on the right
    const leftParticipant  = chat.participantA;
    const rightParticipant = chat.participantB;
    const typingUserName =
        typingUserId === leftParticipant.id  ? leftParticipant.name :
        typingUserId === rightParticipant.id ? rightParticipant.name :
        undefined;

    return (
        // Calculation for height,
        // - main (top) nav h-16 = 64px
        // - bottom (sidebar) navbar h-16 = 64px
        // - workspace sub-nav (mobile) h-12 = 48px
        // Mobile bottom stack: main nav + bottom nav + workspace sub-nav = 176px
        // Desktop: only top navbar
        <div className="flex flex-col min-h-0 h-[calc(100dvh-176px)] md:h-[calc(100dvh-64px)]">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
                <ParticipantBadge participant={leftParticipant} align="left" />
                <span className="text-xs text-text-muted shrink-0">{t('title')}</span>
                <ParticipantBadge participant={rightParticipant} align="right" />
            </div>

            <MessageList
            conversationId={chat.conversationId}
            typingUserId={typingUserId}
            typingUserName={typingUserName}
            onTypingChange={setTypingUserId}
            leftSenderId={leftParticipant.id}
            showSenderName
            />

            <MessageInput
            conversationId={chat.conversationId}
            readOnly={!chat.canSend}
            />
        </div>
    );
}
