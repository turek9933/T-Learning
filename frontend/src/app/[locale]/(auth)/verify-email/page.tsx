import { getAuthMessages } from "@/lib/messages";
import { NextIntlClientProvider } from "next-intl";
import VerifyEmailView from "./VerifyEmailView";

export default async function RegisterPage() {
  const authMessages = await getAuthMessages();
  return (
    <NextIntlClientProvider messages={authMessages}>
      <VerifyEmailView />
    </NextIntlClientProvider>
  );
}