import { getAuthMessages } from "@/lib/messages";
import { NextIntlClientProvider } from "next-intl";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const authMessages = await getAuthMessages();
  return (
    <NextIntlClientProvider messages={authMessages}>
      <RegisterForm />
    </NextIntlClientProvider>
  );
}