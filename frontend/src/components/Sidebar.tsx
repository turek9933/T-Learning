'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Calendar, MessageSquare, Settings, LayoutDashboard } from 'lucide-react';
import { useEffect } from 'react';

const NAV_ITEMS = [
    { key: 'workspaces', href: '/dashboard', icon: LayoutDashboard },
    { key: 'calendar',   href: '/calendar',  icon: Calendar },
    { key: 'messages',   href: '/messages',  icon: MessageSquare },
    { key: 'settings',   href: '/settings',  icon: Settings },
] as const;

export function Sidebar() {
    const t = useTranslations('sidebar');
    const pathname = usePathname();

    function isActive(href: string) {
        const path = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
        return path === href || path.startsWith(href + '/');
    }

    return (
        <>
        {/* Mobile - bottom */}
        <nav className="md:hidden flex fixed bottom-0 left-0 right-0 items-center justify-around h-16 bg-bg border-t border-border px-2">
            {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                    <Link
                    key={key}
                    href={href}
                    className={`
                        flex flex-col items-center justify-center flex-1 h-full rounded-lg
                        ${active ? 'text-primary' : 'text-text-muted'}
                    `}>
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{t(key)}</span>
                    </Link>
                );
            })}
        </nav>
        {/* Desktop - side */}
        <div className="hidden md:flex flex-col items-center gap-1 w-16 self-stretch py-4 bg-bg border-r border-border">
            {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                    <Link
                    key={key}
                    href={href}
                    className={`
                        flex items-center justify-center w-10 h-10 rounded-lg
                        ${active ? 'bg-primary-subtle text-primary border-l-2 border-primary' : 'text-text-muted hover:bg-bg-muted hover:text-text'}
                    `}>
                        <Icon className="w-5 h-5" />
                    </Link>
                );
            })}
        </div>
        </>
    );
}