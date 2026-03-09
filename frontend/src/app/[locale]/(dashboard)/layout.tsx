import { NextIntlClientProvider } from "next-intl";
import { getDashboardMessages } from "@/lib/messages";

export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    const dashboardMessages = getDashboardMessages(); 

    return (
        <NextIntlClientProvider messages={dashboardMessages}>
            {children}
        </NextIntlClientProvider>
    );
}