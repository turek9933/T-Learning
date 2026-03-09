import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
    const t = await getTranslations("dashboard");
    return (
        <div className="text-center font-title font-bold text-text text-2xl pt-4">
            <h1>{t("title")}</h1>
        </div>
    );
}