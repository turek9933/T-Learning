import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/Navbar";

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
    // const messagesForLayout = {
    //     navbar: allMessages.navbar,
    //     common: allMessages.common,
    //     validation: allMessages.validation
    // };
    
    return (
        <NextIntlClientProvider locale={locale} messages={allMessages}>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </NextIntlClientProvider>
    );
}