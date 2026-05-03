import type { Message } from '@/types/chat';
import { authClient } from '@/lib/auth-client';

export function MessageItem({ message }: { message: Message }) {
    const { data: session } = authClient.useSession();
    const isOwn = message.senderId === session?.user.id;
    const isDeleted = !!message.deletedAt;

    return (
        <div key={message.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2/3 rounded-2xl px-4 py-2 text-sm
            ${isOwn
            ? 'bg-primary text-text-contrast rounded-br-sm'
            : 'bg-bg text-text rounded-bl-sm'}
            `}>
                {isDeleted
                ? 'This message was deleted' //TODO dodać informacje o usunięciu
                : message.content // TODO dodać obsługę obrazów i plików
                }
            </div>
        </div>
    );
}