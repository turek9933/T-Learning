"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTranslations } from "next-intl";
import { Banner } from "@/components/Banner";
import { MoveLeft } from "lucide-react";
import { customToast } from "@/lib/customToast";


export default function VerifyEmailView() {
  const t = useTranslations("auth.verifyEmail");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [timeLeft, setTimeLeft] = useState(-1);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      customToast.error(t("error"));
      setStatus("error");
      return;
    }
    authClient.verifyEmail({ query: { token } })
      .then(({ error }) => {
        if (error) {
          console.error(error);
          setStatus("error");
          customToast.error(t("errorVerify"));
          setTimeLeft(-1);
        } else {
          setStatus("success");
          setTimeLeft(5);
        }
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
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
        <h2 className="text-2xl font-title font-bold text-text">
          {t("title")}
        </h2>
      </div>

      <div className="bg-bg rounded-xl p-8 text-center">
        <p className={`text-lg
          ${status === "success" ? "text-text" : // success
          status === "error" ? "text-error font-bold" : // error
          "text-text-muted"}`}> {/* pending */}
          {t(status)}
        </p>
      </div>

      <div className="mt-6 text-center items-center">
        {
          status === "success" ? (
          <p className="text-sm text-text">
            {t("redirectTimer", {seconds: timeLeft})}
          </p>
          ) : (<></>)
        }
        <Link
        href="/"
        className="text-sm text-text-link hover:text-text-link-hover rounded py-2"
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