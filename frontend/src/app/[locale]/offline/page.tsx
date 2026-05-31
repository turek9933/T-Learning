import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { WifiOff } from "lucide-react";

export default async function OfflinePage() {
    const t = await getTranslations("offline");

    return (
    <PageContainer sidebar={false}>
        <div className="flex flex-col items-center text-center max-w-lg space-y-6">
            <div className="rounded-full bg-bg-card p-4 mb-6">
                <WifiOff className="h-10 w-10 text-text-muted" />
            </div>

            <h1>{t("title")}</h1>

            <p className="text-text-secondary">
                {t("description")}
            </p>

            <div className="flex flex-row md:flex-col gap-3 mt-6">
                <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary-hover text-text-contrast"
                >
                    <Link href="/dashboard">{t("goToDashboard")}</Link>
                </Button>
                <Button
                asChild
                size="lg"
                variant="ghost"
                >
                    <Link href="/calendar">{t("goToCalendar")}</Link>
                </Button>
            </div>

            <p className="text-sm text-text-muted mt-8">
                {t("hint")}
            </p>
        </div>
    </PageContainer>
    );
}
