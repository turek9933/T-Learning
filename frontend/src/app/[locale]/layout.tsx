import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { QueryProvider } from "@/components/QueryProvider";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const allMessages = await getMessages();

    return (
        <NextIntlClientProvider locale={locale} messages={allMessages}>
            <QueryProvider>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1 flex">
                        {children}
                    </main>
                </div>
            </QueryProvider>
        </NextIntlClientProvider>
    );
}