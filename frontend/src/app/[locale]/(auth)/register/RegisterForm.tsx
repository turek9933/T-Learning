"use client"
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Mail, Lock, MoveLeft, UserPen } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { customToast } from "@/lib/customToast";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/routing";

export default function RegisterForm() {
  const t = useTranslations("auth.register");
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ password: t("errorPasswordMatch") });
      customToast.error(t("errorPasswordMatch"));
      return;
    }

    setLoading(true);

    try {
      await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
      }, {
        onSuccess: () => {
          customToast.success(t("registerSuccess"));
          router.push("/login");
        },
        onError: (context) => {
          switch (context.error.code) { 
            case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
              setFieldErrors({ email: t("errorEmailTaken") });
              break;
            case "PASSWORD_TOO_SHORT":
              setFieldErrors({ password: t("errorPasswordTooShort") });
              break;
            default:
                break;
          }
          customToast.error(context.error.message ?? context.error.statusText);
        }
      }); 
    } catch (error) {
      console.error(error);
      customToast.error(t("errorRegister"));
    }
    setLoading(false);
  };

  return (
    <PageContainer>
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Banner />
          <h2 className="text-2xl font-title font-bold text-text">
            {t("title")}
          </h2>
          <p className="text-text-secondary mt-2">
            {t("subtitle")}
          </p>
        </div>

        <div className="bg-bg border border-border rounded-xl p-8">
          <form onSubmit={handleRegisterUser} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-normal text-text mb-2">
                  {t("firstName")}
                </label>
                <InputGroup className="bg-bg-muted py-6 w-full">
                  <InputGroupInput
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("firstNamePlaceholder")}
                  className="w-full font-normal"
                  required
                  />
                  <InputGroupAddon>
                    <UserPen className="w-5 h-5 text-text-muted"/>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-normal text-text mb-2">
                  {t("lastName")}
                </label>
                <InputGroup className="bg-bg-muted py-6 w-full">
                  <InputGroupInput
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("lastNamePlaceholder")}
                  className="w-full font-normal"
                  required
                  />
                </InputGroup>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-normal text-text mb-2">
                {t("email")}
              </label>
                <InputGroup className={`bg-bg-muted py-6 ${fieldErrors.email ? "ring-2 ring-error border-error" : ""}`}>
                  <InputGroupInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full font-normal"
                  required
                  />
                  <InputGroupAddon>
                    <Mail className="w-5 h-5 text-text-muted"/>
                  </InputGroupAddon>
                </InputGroup>
                {fieldErrors.email && <p className="text-error text-sm mt-2">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                {t("password")}
              </label>
              <InputGroup className={`bg-bg-muted py-6 ${fieldErrors.password ? "ring-2 ring-error border-error" : ""}`}>
                <InputGroupInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full font-normal"
                required
                />
                <InputGroupAddon>
                  <Lock className="w-5 h-5 text-text-muted"/>
                </InputGroupAddon>
              </InputGroup>
              {fieldErrors.password && <p className="text-error text-sm mt-2">{fieldErrors.password}</p>}
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-normal text-text mb-2">
                {t("confirmPassword")}
              </label>
              <InputGroup className={`bg-bg-muted py-6 ${fieldErrors.password ? "ring-2 ring-error border-error" : ""}`}>
                <InputGroupInput
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                className="w-full font-normal"
                required
                />
                <InputGroupAddon>
                  <Lock className="w-5 h-5 text-text-muted"/>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button
            id="login-button"
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3 my-4"
            >
              {loading ? t("registering") : t("register")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {t("alreadyHaveAccount")}{"\t"}
              <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-medium rounded"
              >
                {t("login")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center items-center">
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