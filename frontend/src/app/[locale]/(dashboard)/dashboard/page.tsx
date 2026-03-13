import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
    const t = await getTranslations("dashboard");
    return (
        <div className="text-center text-text pt-4">
            <h1 >{t("title")}</h1>

            <Link href="workspaces/new" className="text-primary hover:text-primary-hover items-center">
                {t("createWorkspace")}
            </Link>
        </div>
    );
}