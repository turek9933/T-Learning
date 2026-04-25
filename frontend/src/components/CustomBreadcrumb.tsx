'use client';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SEGMENT_KEYS: Record<string, string> = {
    dashboard: 'breadcrumb.dashboard',
    workspaces: 'breadcrumb.workspaces',
    new: 'breadcrumb.new',
};

export function CustomBreadcrumb() {
    const pathname = usePathname();
    const t = useTranslations();

    const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '');
    const segments = withoutLocale.split('/').filter(Boolean);

    if (segments.length === 0) return null;

    const crumbs = segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;

        const label = SEGMENT_KEYS[segment] ? t(SEGMENT_KEYS[segment]) : segment;

        return { href, label, isLast };
    });

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {crumbs.map(({ href, label, isLast }, index) => (
                    <span key={href} className="flex items-center gap-1">
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage>{label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={href as any}>{label}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </span>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}