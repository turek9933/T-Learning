"use client"
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Mail, Lock, MoveLeft, UserPen, EyeOff, Eye } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { customToast } from "@/lib/customToast";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { useValidationSchemas, RegisterFormData } from "@/lib/validation";

export default function RegisterForm() {
  const { registerSchema } = useValidationSchemas();
  const t = useTranslations("auth.register");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onError = (err: FieldErrors<RegisterFormData>) => {
    if (err.email) {
      customToast.error(err.email?.message ?? t("errorEmail"));
    } else if (err.password) {
      customToast.error(err.password?.message ?? t("errorPassword"));
    } else {
      customToast.error(t("errorRegister"));
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`.trim(),
        fetchOptions: {
          onSuccess: () => {
            customToast.success(t("registerSuccess"));
            router.push("/login");
          },
          onError: (context) => {
            switch (context.error.code) {
              case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
                customToast.error(t("errorEmailTaken"));
                break;
              case "PASSWORD_TOO_SHORT":
                customToast.error(t("errorPasswordTooShort"));
                break;
              default:
                customToast.error(t("errorRegister"));
                break;
            }
          }
        }
      });
    } catch (error) {
      console.error(error);
      customToast.error(t("errorRegister"));
    }
  };

  return (
    <PageContainer sidebar={false}>
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
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-normal text-text mb-2">
                  {t("firstName")}
                </label>
                <InputGroup className="bg-bg-muted py-6 w-full">
                  <InputGroupInput
                  id="firstName"
                  type="text"
                  {...register("firstName")}
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
                  {...register("lastName")}
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
                {errors.email && <p className="text-error text-sm mt-2">{errors.email?.message}</p>}
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
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-normal text-text mb-2">
                {t("confirmPassword")}
              </label>
              <InputGroup className={`bg-bg-muted py-6 ${errors.confirmPassword ? "ring-2 ring-error border-error" : ""}`}>
                <InputGroupInput
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder={t("confirmPasswordPlaceholder")}
                className="w-full font-normal"
                required
                />
                <InputGroupAddon>
                  <Lock className="w-5 h-5 text-text-muted"/>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  { showConfirmPassword ?
                  <Eye className="w-5 h-5 text-text-muted"/>
                  :
                  <EyeOff className="w-5 h-5 text-text-muted"/>
                  }
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button
            id="login-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3 my-4"
            >
              {isSubmitting ? t("registering") : t("register")}
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