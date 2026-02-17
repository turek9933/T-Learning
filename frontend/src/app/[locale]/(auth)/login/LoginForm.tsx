"use client"
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Mail, Lock, MoveLeft } from "lucide-react";
import { customToast } from "@/lib/customToast";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginForm() {
  const t = useTranslations("auth.login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  //TODO
  const authenticateUser = async (email: string, password: string) => {
    // waits 1000 ms
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // throw new Error();
    // TODO implement authentication in context
  };

  function toggleRememberMe () {
    setRememberMe(!rememberMe);
  }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authenticateUser(email, password);
      customToast.success(t("loginSuccess"));
    } catch (err) {
      customToast.error("Login error");
    } finally {
        setError(false);
        setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="w-full max-w-md">
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
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label htmlFor="email" className="block text-sm font-normal text-text mb-2">
                {t("email")}
              </label>
                <InputGroup className="bg-bg-muted py-6">
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
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                {t("password")}
              </label>
              <InputGroup className="bg-bg-muted py-6">
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={toggleRememberMe}
                className="cursor-pointer w-4 h-4 focus:ring-primary focus:ring-offset-4"
                />
                <span className="text-sm text-text-secondary">
                  {t("rememberMe")}
                </span>
              </div>
              <Link
              id="forgot-password-link"
              href="/forgot-password"
              className="text-sm rounded text-primary hover:text-primary-hover hover:underline focus:underline focus:text-primary-hover"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <Button
            id="login-button"
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3"
            >
              {loading ? t("loggingIn") : t("login")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {t("noAccount")}{"\t"}
              <Link
              href="/register"
              className="text-primary hover:text-primary-hover font-medium rounded"
              >
                {t("register")}
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