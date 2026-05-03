'use client';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import type { Conversation } from '@/types/chat';
import Avatar from '@/components/shared/Avatar';

export function ConversationItem({ conversation }: { conversation: Conversation }) {
    const pathname = usePathname();
    const isActive = pathname.includes(conversation.id);

    return (
        <Link
        href={`/chat/${conversation.id}`}
        className={`flex items-center gap-2 px-2 py-1 hover:bg-bg-hover transition-all duration-400
            ${isActive ? 'bg-bg-card' : ''}`}
        >
            {/* //TODO dodać faktyczne dane o użytkownikach */}
            <Avatar name="?" />
            <div className="flex-1">
                <p className="text-sm font-medium text-text">Name of user</p>
                <p className="text-xs text-text-muted">Last message</p>
            </div>
        </Link>
    );
}