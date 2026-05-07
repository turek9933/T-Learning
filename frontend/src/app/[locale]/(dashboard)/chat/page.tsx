import { ConversationList } from "@/components/chat/ConversationList";
import { getTranslations } from "next-intl/server";

export default async function ChatPage() {
    const t = await getTranslations("components.chat");
    return (
        <>
            {/* Mobile */}
            <div className="md:hidden flex flex-col h-full">
                <ConversationList />
            </div>
            {/* Desktop placeholder if nothing is selected */}
            <div className="hidden md:flex flex-col items-center justify-center pt-12 gap-2">
                <h3 className="font-title font-bold text-text">
                    {t('selectConversation')}
                </h3>
                <p className="text-text-secondary text-sm">
                    {t('selectConversationDescription')}
                </p>
            </div>
        </>
    )
}