"use client"
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, Contrast, Menu, X, LogOut, Check, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useInstallPrompt } from "@/components/pwa/use-install-prompt";
import { ConnectionIndicator } from "@/components/pwa/ConnectionIndicator";

export function Navbar() {
    const t = useTranslations("navbar");
    const pathname = usePathname();
    const router = useRouter();
    const {theme, setTheme} = useTheme();
    const locale = useLocale();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const {data: session, isPending} = authClient.useSession();
    const [isMounted, setMounted] = useState(false);
    const mountedSession = isMounted ? session : null;
    const { canInstall, install } = useInstallPrompt();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                }
            }
        });
    };
    
    return (
    <nav className="sticky top-0 w-full border-b border-border bg-bg backdrop-blur z-50">
        <div className="container flex h-16 items-center justify-between">
            <Link 
            href={!isMounted ? "/" : session ? "/dashboard" : "/"} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded"
            >
                <span className="font-title font-bold text-xl text-text">
                    T-Learning
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
                {isMounted && <ConnectionIndicator />}
                {isMounted && canInstall && (
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={install}
                    title={t("installApp")}
                    className="cursor-pointer"
                    >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">{t("installApp")}</span>
                    </Button>
                )}
                {isMounted && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                <Globe className="h-5 w-5" />
                                <span className="sr-only">{t("changeLanguage")}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {([
                                { loc: 'pl', label: 'Polski 🇵🇱' },
                                { loc: 'en', label: 'English 🇬🇧' },
                                { loc: 'it', label: 'Italiano 🇮🇹' },
                            ] as const).map(({ loc, label }) => (
                                <DropdownMenuItem key={loc} asChild>
                                    <Link
                                    href={pathname}
                                    locale={loc}
                                    className={`w-full cursor-pointer flex items-center justify-between gap-2
                                        ${locale === loc ? 'font-semibold text-primary' : 'text-text'}`}
                                    >
                                        {label}
                                        {locale === loc && <Check className="h-4 w-4 shrink-0" />}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {isMounted && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                            {/* Hydration - if not mounted, show sun icon - default light theme */}
                            {theme === "accessible" ? <Contrast className="h-5 w-5" />
                            : theme === "dark" ? <Moon className="h-5 w-5" />
                            : <Sun className="h-5 w-5" />}
                            <span className="sr-only">{t("changeTheme")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {([
                            { value: 'light',      Icon: Sun,      label: t('light') },
                            { value: 'dark',       Icon: Moon,     label: t('dark') },
                            { value: 'accessible', Icon: Contrast, label: t('accessible') },
                        ] as const).map(({ value, Icon, label }) => (
                            <DropdownMenuItem
                            key={value}
                            onClick={() => setTheme(value)}
                            className={`cursor-pointer flex items-center justify-between gap-2
                                ${theme === value ? 'font-semibold text-primary' : ''}`}
                            >
                                <span className="flex items-center">
                                    <Icon className="mr-2 h-4 w-4" />
                                    {label}
                                </span>
                                {theme === value && <Check className="h-4 w-4 shrink-0" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
                
                {!isMounted ? (
                    // Loading placeholder
                    <div className="h-7 w-7 rounded-full bg-bg-card hover:bg-bg-hover animate-pulse" />
                ) : mountedSession ? (
                    // User is signed in
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 p-0 rounded-full">
                                {mountedSession.user.image ? (
                                    <Image
                                    src={mountedSession.user.image}
                                    alt={mountedSession.user.name ?? ""}
                                    width={28}
                                    height={28}
                                    className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-text-contrast text-sm font-bold cursor-pointer">
                                        {mountedSession.user.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <div className="p-2">
                                <p className="text-sm font-medium text-text">{mountedSession.user.name}</p>
                                <p className="text-xs text-text-secondary">{mountedSession.user.email}</p>
                            </div>
                            <DropdownMenuSeparator className="bg-text"/>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <p>
                                    {t("changeAvatar")}{/* //TODO */}
                                </p>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-text"/>
                            <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-text cursor-pointer hover:bg-bg-hover focus:bg-bg-hover focus:text-text-contrast cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {t("logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    // User is NOT signed in
                    <Button asChild size="sm" className="bg-bg-card hover:bg-bg-hover focus:bg-bg-hover text-text hover:text-text-contrast focus:text-text-contrast">
                        <Link href="/login">{t("login")}</Link>
                    </Button>
                )}
            </div>

            {/* Mobile: connection indicator + hamburger */}
            <div className="md:hidden flex items-center gap-2">
                {isMounted && <ConnectionIndicator />}
                <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Menu className="h-6 w-6" />
                )}
                <span className="sr-only">{t("toggleMenu")}</span>
                </Button>
            </div>
        </div>

        {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-bg">
                <div className="container py-4 space-y-4">
                    {mountedSession && (
                        <div className="flex items-center gap-3 px-2 py-1 border-border border-b">
                            {mountedSession.user.image ? (
                                <Image
                                src={mountedSession.user.image}
                                alt={mountedSession.user.name ?? ""}
                                width={28}
                                height={28}
                                className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-text-contrast text-sm font-bold">
                                    {mountedSession.user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="p-2">
                                <p className="text-sm font-medium text-text">{mountedSession.user.name}</p>
                                <p className="text-xs text-text-secondary">{mountedSession.user.email}</p>
                            </div>
                        </div>
                    )}
                    {isMounted && canInstall && (
                        <div className="pb-2 border-b border-border-subtle">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-text-muted px-2">{t("installApp")}</p>
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={install}
                                title={t("installApp")}
                                className="cursor-pointer"
                                >
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">{t("installApp")}</span>
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-text-muted px-2">
                            {t("changeLanguage")}
                        </p>
                        <div className="grid gap-2">
                            {([
                                { loc: 'pl', label: 'Polski 🇵🇱' },
                                { loc: 'en', label: 'English 🇬🇧' },
                                { loc: 'it', label: 'Italiano 🇮🇹' },
                            ] as const).map(({ loc, label }) => (
                                <Button
                                key={loc}
                                variant="ghost"
                                className={`w-full justify-between
                                    ${locale === loc ? 'font-semibold text-primary' : 'text-text'}`}
                                asChild
                                onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Link href={pathname} locale={loc}>
                                        {label}
                                        {locale === loc && <Check className="h-4 w-4 shrink-0" />}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
            
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-text-muted px-2">
                            {t("changeTheme")}
                        </p>
                        <div className="grid gap-2">
                            {([
                                { value: 'light',      Icon: Sun,      label: t('light') },
                                { value: 'dark',       Icon: Moon,     label: t('dark') },
                                { value: 'accessible', Icon: Contrast, label: t('accessible') },
                            ] as const).map(({ value, Icon, label }) => (
                                <Button
                                key={value}
                                variant="ghost"
                                className={`w-full justify-between cursor-pointer
                                    ${theme === value ? 'font-semibold text-primary' : ''}`}
                                onClick={() => {
                                    setTheme(value);
                                    setMobileMenuOpen(false);
                                }}
                                >
                                    <span className="flex items-center">
                                        <Icon className="mr-2 h-4 w-4" />
                                        {label}
                                    </span>
                                    {theme === value && <Check className="h-4 w-4 shrink-0" />}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {mountedSession ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-text-muted px-2">
                                {t("accountSettings")}
                            </p>
                            <Button
                            variant="ghost"
                            className="w-full justify-start cursor-pointer"
                            //TODO
                            onClick={() => console.log("[Navbar]: changeAvatar")}
                            >
                                {t("changeAvatar")}
                            </Button>
                            <Button
                            variant="ghost"
                            className="w-full bg-bg-card hover:bg-bg-hover focus:bg-bg-hover text-text cursor-pointer"
                            size="lg"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                handleSignOut();
                            }}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {t("logout")}
                            </Button>
                        </div>
                    ) : (
                        <Button asChild className="w-full bg-bg-card hover:bg-bg-hover text-text" size="lg">
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                {t("login")}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        )}
    </nav>
    );
}