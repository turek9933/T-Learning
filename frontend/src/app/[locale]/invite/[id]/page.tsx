"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTranslations } from "next-intl";
import { Banner } from "@/components/shared/Banner";
import { MoveLeft } from "lucide-react";
import { customToast } from "@/components/CustomToast";


export default function InviteView() {
  const t = useTranslations("workspace.invite");
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(-1);

  useEffect(() => {
    if (!id) {
      customToast.error(t("error"));
      setStatus("error");
      return;
    }
    authClient.organization.getInvitation({ query: { id } })
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus("error");
          customToast.error(t("error"));
          return;
        }

        setWorkspaceName(data.organizationName ?? null);

        return authClient.organization.acceptInvitation({ invitationId: id });
      })
      .then((result) => {
        if (!result) return;
        const { error } = result;
        if (error) {
          console.error(error);
          setStatus("error");
          customToast.error(t("error"));
        } else {
          setStatus("success");
          setTimeLeft(5);
        }
      });
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      }
      if (timeLeft === 0) {
        router.push("/dashboard");
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
          {status === "success" && workspaceName
            ? t("successWithName", {name: workspaceName})
            : t(status)
          }
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