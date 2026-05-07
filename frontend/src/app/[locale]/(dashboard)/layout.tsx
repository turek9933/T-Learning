import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-1 min-h-0">
            <Sidebar />
            <div className="flex-1 min-w-0 bg-bg-muted">
                {children}
            </div>
        </div>
        
    );
}