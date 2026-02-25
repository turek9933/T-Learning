import { getAuthMessages } from "@/lib/messages";
import { NextIntlClientProvider } from "next-intl";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const authMessages = await getAuthMessages();
  return (
    <NextIntlClientProvider messages={authMessages}>
      <LoginForm />
    </NextIntlClientProvider>
  );
}