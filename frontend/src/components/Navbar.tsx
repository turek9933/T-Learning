"use client"
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, Contrast, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const t = useTranslations("navbar");
    const pathname = usePathname();
    const {theme, setTheme} = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
    <nav className="sticky top-0 w-full border-b border-border bg-bg backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
            <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded"
            >
                <span className="font-title font-bold text-xl text-text">
                    T-Learning
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            {theme === "light" && <Sun className="h-5 w-5" />}
                            {theme === "dark" && <Moon className="h-5 w-5" />}
                            {theme === "accessible" && <Contrast className="h-5 w-5" />}
                            <span className="sr-only">{t("changeTheme")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            {t("light")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            {t("dark")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("accessible")}>
                            <Contrast className="mr-2 h-4 w-4" />
                            {t("accessible")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <Button asChild size="sm" className="bg-bg-card hover:bg-bg-hover text-text">
                    <Link href="/login">{t("login")}</Link>
                </Button>
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
                            className="w-full justify-start"
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
                            className="w-full justify-start"
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
                            className="w-full justify-start"
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

                    <Button asChild className="w-full bg-bg-card hover:bg-bg-hover text-text" size="lg">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            {t("login")}
                        </Link>
                    </Button>
                </div>
            </div>
        )}
    </nav>
    );
}