'use client';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import type { Conversation } from '@/types/chat';
import Avatar from '@/components/shared/Avatar';
import { File, Image } from 'lucide-react';

export function ConversationItem({ conversation }: { conversation: Conversation }) {
    const pathname = usePathname();
    const isActive = pathname.includes(conversation.id);

    return (
        <Link
        href={`/chat/${conversation.id}`}
        className={`flex items-center gap-2 px-2 py-1 hover:bg-bg-hover transition-all duration-400
            ${isActive ? 'bg-bg-card' : ''}`}
        >
            <Avatar avatarUrl={conversation.otherParticipantAvatarUrl} name={conversation.otherParticipantName} />
            <div className="flex-1">
                <p className="text-sm font-medium text-text">{conversation.otherParticipantName}</p>
                <p className="text-xs text-text-muted">
                    {conversation.lastMessageType === 'image' 
                        ? <Image className="w-4 h-4" />
                        : conversation.lastMessageType === 'file'
                        ? <File className="w-4 h-4" />
                        : conversation.lastMessageContent
                    }
                </p>
            </div>
        </Link>
    );
}