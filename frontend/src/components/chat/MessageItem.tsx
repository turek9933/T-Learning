import type { Message } from '@/types/chat';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';

export function MessageItem({ message }: { message: Message }) {
    const { data: session } = authClient.useSession();
    const isOwn = message.senderId === session?.user.id;
    const isDeleted = !!message.deletedAt;
    const t = useTranslations('components.chat');


    return (
        <div key={message.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2/3 rounded-2xl px-4 py-2 text-sm
            ${
            isDeleted
            ? 'bg-bg text-text-muted rounded-md'
            : isOwn
            ? 'bg-primary text-text-contrast rounded-br-sm'
            : 'bg-bg text-text rounded-bl-sm'}
            `}>
                {isDeleted
                ? t('deletedMessage')
                : message.content // TODO dodać obsługę obrazów i plików
                }
            </div>
        </div>
    );
}