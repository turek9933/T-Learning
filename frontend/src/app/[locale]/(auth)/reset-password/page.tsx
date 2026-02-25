import { getTranslations } from "next-intl/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
    const t = await getTranslations("auth.resetPassword");
    return (
        <ResetPasswordForm
        titleProp={t("title")}
        subtitleProp={t("subtitle")}
        passwordProp={t("password")}
        passwordPlaceholderProp={t("passwordPlaceholder")}
        confirmPasswordProp={t("confirmPassword")}
        confirmPasswordPlaceholderProp={t("confirmPasswordPlaceholder")}
        submitProp={t("submit")}
        successProp={t("success")}
        errorProp={t("error")}
        errorTokenProp={t("errorToken")}
        errorPasswordMatchProp={t("errorPasswordMatch")}
        errorPasswordTooShortProp={t("errorPasswordTooShort")}
        goBackProp={t("goBack")}
        />
    );
}