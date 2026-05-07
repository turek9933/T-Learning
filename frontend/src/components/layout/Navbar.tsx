"use client"
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, Contrast, Menu, X, LogOut } from "lucide-react";
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

export function Navbar() {
    const t = useTranslations("navbar");
    const pathname = usePathname();
    const router = useRouter();
    const {theme, setTheme} = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const {data: session, isPending} = authClient.useSession();
    const [isMounted, setMounted] = useState(false);
    const mountedSession = isMounted ? session : null;

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
                {mountedSession && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                <Globe className="h-5 w-5" />
                                <span className="sr-only">{t("changeLanguage")}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={pathname} locale="pl" className="w-full cursor-pointer text-text">
                                    Polski 🇵🇱
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={pathname} locale="en" className="w-full cursor-pointer text-text">
                                    English 🇬🇧
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={pathname} locale="it" className="w-full cursor-pointer text-text">
                                    Italiano 🇮🇹
                                </Link>
                            </DropdownMenuItem>
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
                        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                            <Sun className="mr-2 h-4 w-4" />
                            {t("light")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                            <Moon className="mr-2 h-4 w-4" />
                            {t("dark")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("accessible")} className="cursor-pointer">
                            <Contrast className="mr-2 h-4 w-4" />
                            {t("accessible")}
                        </DropdownMenuItem>
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

            {/* Hamburger */}
            <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
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
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-text-muted px-2">
                            {t("changeLanguage")}
                        </p>
                        <div className="grid gap-2">
                            <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                            onClick={() => setMobileMenuOpen(false)}
                            >
                                <Link href={pathname} locale="pl" className="text-text">
                                    Polski 🇵🇱
                                </Link>
                            </Button>
                            <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                            onClick={() => setMobileMenuOpen(false)}
                            >
                                <Link href={pathname} locale="en" className="text-text">
                                    English 🇬🇧
                                </Link>
                            </Button>
                            <Button
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                            onClick={() => setMobileMenuOpen(false)}
                            >
                                <Link href={pathname} locale="it" className="text-text">
                                    Italiano 🇮🇹
                                </Link>
                            </Button>
                        </div>
                    </div>
            
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-text-muted px-2">
                            {t("changeTheme")}
                        </p>
                        <div className="grid gap-2">
                            <Button
                            variant="ghost"
                            className="w-full justify-start cursor-pointer"
                            onClick={() => {
                                setTheme("light");
                                setMobileMenuOpen(false);
                            }}
                            >
                                <Sun className="mr-2 h-4 w-4" />
                                {t("light")}
                            </Button>
                            <Button
                            variant="ghost"
                            className="w-full justify-start cursor-pointer"
                            onClick={() => {
                                setTheme("dark");
                                setMobileMenuOpen(false);
                            }}
                            >
                                <Moon className="mr-2 h-4 w-4" />
                                {t("dark")}
                            </Button>
                            <Button
                            variant="ghost"
                            className="w-full justify-start cursor-pointer"
                            onClick={() => {
                                setTheme("accessible");
                                setMobileMenuOpen(false);
                            }}
                            >
                                <Contrast className="mr-2 h-4 w-4" />
                                {t("accessible")}
                            </Button>
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