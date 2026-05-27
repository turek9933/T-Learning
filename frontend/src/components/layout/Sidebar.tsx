'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
    Calendar, CalendarDays, ClipboardList, MessageSquare, Settings,
    LayoutDashboard, Cog, Users, BookOpen, FolderOpen, FileText,
    type LucideIcon,
} from 'lucide-react';
import { useWorkspaceData } from '@/lib/hooks/workspace-hooks';

const ICON_MAP: Record<string, LucideIcon> = {
    BookOpen,
    MessageSquare,
    Calendar,
    CalendarDays,
    FolderOpen,
    ClipboardList,
    Users,
    Cog,
    FileText,
};

const NAV_ITEMS = [
    { key: 'workspaces', href: '/dashboard',    icon: LayoutDashboard },
    { key: 'calendar',   href: '/calendar',     icon: Calendar },
    { key: 'homeworks',  href: '/homeworks',    icon: ClipboardList },
    { key: 'messages',   href: '/chat',         icon: MessageSquare },
    { key: 'settings',   href: '/settings',     icon: Settings },
] as const;

function extractWorkspaceSlug(pathname: string): string | null {
    const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    const match = withoutLocale.match(/^\/workspaces\/([^/]+)(\/|$)/);
    return match ? match[1] : null;
}

function WorkspaceSubNav({ slug, mobile = false }: { slug: string; mobile?: boolean }) {
    const t = useTranslations('sidebar');
    const pathname = usePathname();
    const { config } = useWorkspaceData(slug);

    function isSubActive(subPath: string) {
        const path = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
        const pathStart = '/workspaces/' + slug;
        if (subPath === '') return path === pathStart;
        return path.startsWith(pathStart + subPath);
    }

    if (mobile) {
        return (
            <>
                {config.navItems.map(({ key, subPath, iconName }) => {
                    const Icon = ICON_MAP[iconName] ?? BookOpen;
                    const subActive = isSubActive(subPath);
                    return (
                        <Link
                        key={key}
                        href={`/workspaces/${slug}${subPath}`}
                        className={`
                            flex flex-1 flex-col items-center justify-center h-full rounded-lg
                            ${subActive ? 'bg-primary-subtle text-primary border-b-2 border-primary' : 'text-text-muted hover:bg-bg-hover hover:text-text'}
                        `}>
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{t(key as Parameters<typeof t>[0])}</span>
                        </Link>
                    );
                })}
            </>
        );
    }

    return (
        <>
            {config.navItems.map(({ key, subPath, iconName }) => {
                const Icon = ICON_MAP[iconName] ?? BookOpen;
                const subActive = isSubActive(subPath);
                return (
                    <Link
                    key={key}
                    href={`/workspaces/${slug}${subPath}`}
                    title={t(key as Parameters<typeof t>[0])}
                    className={`
                        flex items-center justify-center w-10 h-10 rounded-lg
                        ${subActive ? 'bg-primary-subtle text-primary border-l-2 border-primary' : 'text-text-muted border-l-1 border-text-muted hover:bg-bg-muted hover:text-text'}
                    `}>
                        <Icon className="w-5 h-5" />
                    </Link>
                );
            })}
        </>
    );
}

export function Sidebar() {
    const t = useTranslations('sidebar');
    const pathname = usePathname();
    const slug = extractWorkspaceSlug(pathname);

    function isActive(href: string) {
        const path = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
        return path === href || path.startsWith(href + '/');
    }

    return (
        <>
        {/* Mobile workspace sub-nav */}
        {slug && (
            <nav className="md:hidden flex fixed bottom-16 left-0 right-0 items-center justify-around h-12 bg-bg-muted border-t border-border px-2 z-40">
                <WorkspaceSubNav slug={slug} mobile />
            </nav>
        )}
        {/* Mobile - bottom */}
        <nav className="md:hidden flex fixed bottom-0 left-0 right-0 items-center justify-around h-16 bg-bg border-t border-border px-2 z-50">
            {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                    <Link
                    key={key}
                    href={href}
                    className={`
                        flex flex-col items-center justify-center flex-1 h-full rounded-lg
                        ${active ? 'bg-primary-subtle text-primary border-b-2 border-primary' : 'text-text-muted hover:bg-bg-hover hover:text-text'}
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
                   <div key={key} className="flex flex-col items-center w-full">
                        <Link
                        href={href}
                        className={`
                            flex items-center justify-center w-10 h-10 rounded-lg
                            ${active ? 'bg-primary-subtle text-primary border-l-2 border-primary' : 'text-text-muted hover:bg-bg-muted hover:text-text'}
                        `}>
                            <Icon className="w-5 h-5" />
                        </Link>

                        {key === 'workspaces' && slug && (
                            <WorkspaceSubNav slug={slug} />
                        )}
                   </div>
                );
            })}
        </div>
        </>
    );
}