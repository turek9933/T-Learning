import { Sidebar } from '@/components/layout/Sidebar';
import { ChatRealtime } from '@/components/chat/ChatRealtime';

export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-1 min-h-0">
            <ChatRealtime />
            <Sidebar />
            <div className="flex-1 min-w-0 bg-bg-muted">
                {children}
            </div>
        </div>
    );
}