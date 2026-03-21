"use client"
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Mail, Lock, MoveLeft, Eye, EyeOff } from "lucide-react";
import { customToast } from "@/lib/customToast";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { env } from "@/lib/env";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type FieldErrors } from "react-hook-form";
import { useValidationSchemas, LoginFormData } from "@/lib/validation";


export default function LoginForm() {
  const t = useTranslations("auth.login");
  const { loginSchema } = useValidationSchemas();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
        email: '',
        password: '',
        rememberMe: false,
    },
    resolver: zodResolver(loginSchema),
  })

  const onError = (err: FieldErrors<LoginFormData>) => {
    if (err.email) {
      customToast.error(err.email.message ?? t("errorEmail"));
    } else if (err.password) {
      customToast.error(err.password.message ?? t("errorPassword"));
    } else {
      customToast.error(t("errorLogin"));
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
      callbackURL: "/dashboard"
    });
    if (error) {
      switch (error.code) {
        case "INVALID_EMAIL_OR_PASSWORD":
          setError("email", { message: t("errorEmailOrPassword") });
          setError("password", { message: t("errorEmailOrPassword") });
          customToast.error(t("errorEmailOrPassword"));
          break;
        default:
          customToast.error(t("errorLogin"));
          break;
      }
      return;
    } else {
      customToast.success(t("loginSuccess"));
    }
  }

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${env.appUrl}/dashboard`,
      }, {
        onSuccess: () => {
          customToast.success(t("googlePopup"));
        },
        onError: (context) => {
          customToast.error(context.error.message);
        }
      });
    } catch (error) {
      customToast.error(t("errorLogin"));
    }
    setLoading(false);
  }

  return (
    <PageContainer sidebar={false}>
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
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
            <div>
              <label htmlFor="email" className="block text-sm font-normal text-text mb-2">
                {t("email")}
              </label>
                <InputGroup className={`bg-bg-muted py-6 ${errors.email ? "ring-2 ring-error border-error" : ""}`}>
                  <InputGroupInput
                  id="email"
                  type="email"
                  {...register("email")}
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
              <InputGroup className={`bg-bg-muted py-6 ${errors.password ? "ring-2 ring-error border-error" : ""}`}>
                <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder={t("passwordPlaceholder")}
                className="w-full font-normal"
                required
                />
                <InputGroupAddon>
                  <Lock className="w-5 h-5 text-text-muted"/>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm" onClick={() => setShowPassword(!showPassword)}>
                  { showPassword ?
                  <Eye className="w-5 h-5 text-text-muted"/>
                  :
                  <EyeOff className="w-5 h-5 text-text-muted"/>
                  }
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>

              {errors.password && <p className="text-error text-sm mt-2">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <Checkbox
                  id="remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="cursor-pointer w-4 h-4 focus:ring-primary focus:ring-offset-4"
                  />
                )}/>
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
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3"
            >
              {isSubmitting ? t("loggingIn") : t("login")}
            </Button>
          </form>


          <div className="flex items-center justify-center mt-6 gap-2">
            <div className="h-px w-full bg-border"></div>
            <span className="text-sm text-text-secondary">
              {t("or")}
              </span>
            <div className="h-px w-full bg-border"></div>
          </div>

          <div className="flex items-center justify-center mt-2">
            <Button
              id="login-google-button"
              type="button"
              disabled={loading}
              className="bg-transparent border border-2 border-primary text-primary hover:bg-primary focus:bg-primary py-1"
              onClick={handleLoginWithGoogle}
              >
                <GoogleIcon />
            </Button>
          </div>

          <div className="mt-4 text-center">
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