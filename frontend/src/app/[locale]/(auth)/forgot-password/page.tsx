import { getTranslations } from "next-intl/server";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPassword() {
    const t = await getTranslations("auth.forgotPassword");
    return (
        <ForgotPasswordForm
        titleProp={t("title")}
        subtitleProp={t("subtitle")}
        emailProp={t("email")}
        emailPlaceholderProp={t("emailPlaceholder")}
        submitProp={t("submit")}
        successProp={t("success")}
        errorProp={t("error")}
        goBackProp={t("goBack")}
        />
    );
}