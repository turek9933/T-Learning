import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/PageContainer";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
    const t = await getTranslations("notFound");
    return (
    <PageContainer sidebar={false}>
        <div className="text-center max-w-md">
            <h1 className="font-title font-bold text-text-secondary mb-4">
                404
            </h1>
            <h2 className="font-title font-bold text-text mb-8">
                {t("title")}
            </h2>

            <p className="text-base md:text-lg text-text-secondary mb-4">
                {t("description")}
            </p>

            <Button asChild size="lg">
                <Link href="/" className="bg-bg hover:bg-bg-hover text-text-contrast">
                    {t("button")}
                </Link>
            </Button>
        </div>
    </PageContainer>
    );
}