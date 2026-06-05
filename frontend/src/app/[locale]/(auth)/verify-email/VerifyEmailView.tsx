"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTranslations } from "next-intl";
import { Banner } from "@/components/shared/Banner";
import { MoveLeft } from "lucide-react";
import { customToast } from "@/components/CustomToast";


export default function VerifyEmailView() {
  const t = useTranslations("auth.verifyEmail");
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status");
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const isEmailChange = status === "email-change";
  const [verifyStatus, setVerifyStatus] = useState<"pending" | "success" | "error">(isEmailChange ? "success" : "pending");
  const [timeLeft, setTimeLeft] = useState(-1);

  useEffect(() => {
    if (isEmailChange) return;

    if (!token) {
      setVerifyStatus("error");
      customToast.error(t("error"));
      return;
    }

    authClient.verifyEmail({ query: { token } })
    .then(({ error }) => {
      if (error) {
        console.error(error);
        setVerifyStatus("error");
        customToast.error(t("errorVerify"));
        setTimeLeft(-1);
      } else {
        setVerifyStatus("success");
        setTimeLeft(5);
      }
    });
  }, []);

  useEffect(() => {
    if (timeLeft < 0) return;
    const interval = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft((prev) => prev - 1);
      }
      if (timeLeft === 0) {
        router.push("/");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <PageContainer sidebar={false}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Banner />
          <h2>
            {isEmailChange ? t("emailChangeTitle") : t("title")}
          </h2>
        </div>

        <div className="bg-bg rounded-xl p-8 text-center">
          {isEmailChange ? (
            <>
              <p className="text-lg text-text">{t("changeSent")}</p>
              {email && (
                <p className="text-md text-text-muted">
                  {t("changeSentDescription", { email })}
                </p>
              )}
            </>
          ) : (
            <p className={`text-lg
              ${status === "success" ? "text-text" : // success
              status === "error" ? "text-error font-bold" : // error
              "text-text-muted"}`} // pending
            >
              {t(verifyStatus)}
            </p>
          )}
        </div>

        <div className="mt-6 text-center items-center">
          {verifyStatus === "success" && !isEmailChange && timeLeft >= 0 && (
            <p className="text-sm text-text">
              {t("redirectTimer", { seconds: timeLeft })}
            </p>
          )}
          <Link
            href="/"
            className="text-sm text-text-link hover:text-text-link-hover rounded py-2 inline-flex items-center gap-1"
          >
            <MoveLeft className="inline w-4 h-4" />
            {"\t"}
            {t("goBack")}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}