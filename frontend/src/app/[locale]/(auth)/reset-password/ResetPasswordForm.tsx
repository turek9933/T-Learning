"use client"

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { customToast } from "@/lib/customToast";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, MoveLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { env } from "@/lib/env";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useValidationSchemas, NewPasswordFormData } from "@/lib/validation";

interface ResetPasswordData {
    titleProp: string;
    subtitleProp: string;
    passwordProp: string;
    passwordPlaceholderProp: string;
    confirmPasswordProp: string;
    confirmPasswordPlaceholderProp: string;
    submitProp: string;
    successProp: string;
    errorProp: string;
    errorTokenProp: string;
    errorPasswordMatchProp: string;
    errorPasswordTooShortProp: string;
    goBackProp: string;
}

export default function ResetPasswordForm({ titleProp, subtitleProp, passwordProp, passwordPlaceholderProp, confirmPasswordProp, confirmPasswordPlaceholderProp, submitProp, successProp, errorProp, errorTokenProp, errorPasswordMatchProp, errorPasswordTooShortProp, goBackProp }: ResetPasswordData) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<NewPasswordFormData>({
        resolver: zodResolver(useValidationSchemas().newPasswordSchema),
    });

    // const [password, setPassword] = useState("");
    // const [confirmPassword, setConfirmPassword] = useState("");
    // const [loading, setLoading] = useState(false);
    const [errorField, setErrorField] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    if (!token) {
        return (
        <PageContainer>
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Banner />
                    <h2 className="text-2xl font-title font-bold text-text">
                        {titleProp}
                    </h2>
                    <p className="text-text-secondary mt-2">
                        {subtitleProp}
                    </p>
                    <p className="text-text-secondary mt-2">
                        {errorTokenProp}
                    </p>
                </div>
            </div>
        </PageContainer>
        );
    }

    const onSubmit = async (data: NewPasswordFormData) => {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token
      })
      if (error) {
        customToast.error(errorProp);
      } else {
        customToast.success(successProp);
        router.push("/login");
      }

      // e.preventDefault();
      // setErrorField("");
      
      // if (password !== confirmPassword) {
      //   customToast.error(errorPasswordMatchProp);
      //   setErrorField(errorPasswordMatchProp);
      //   return;
      // }
      // if (password.length < Number(env.passwordMinLength)) {
      //   customToast.error(errorPasswordTooShortProp);
      //   setErrorField(errorPasswordTooShortProp);
      //   return;
      // }
      // setLoading(true);
      // try {
      //   const { error } = await authClient.resetPassword({
      //     newPassword: password,
      //     token
      //   });
      //   customToast.success(successProp);
      //   router.push("/login");
      // } catch (error) {
      //   customToast.error(errorProp);
      //   setErrorField(errorProp);
      // }
      // setLoading(false);
    };

    return (

    <PageContainer>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Banner />
          <h2 className="text-2xl font-title font-bold text-text">
            {titleProp}
          </h2>
          <p className="text-text-secondary mt-2">
            {subtitleProp}
          </p>
        </div>

        <div className="bg-bg border border-border rounded-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                {passwordProp}
              </label>
              <InputGroup className={`bg-bg-muted py-6 ${errorField !== "" ? "ring-2 ring-error border-error" : ""}`}>
                <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                // value={password}
                // onChange={(e) => setPassword(e.target.value)}
                {...register("password")}
                placeholder={passwordPlaceholderProp}
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
              {errorField !== "" ? <p className="text-error text-sm mt-2">{errorField}</p> : ""}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-normal text-text mb-2">
                {confirmPasswordProp}
              </label>
              <InputGroup className={`bg-bg-muted py-6 ${errorField !== "" ? "ring-2 ring-error border-error" : ""}`}>
                <InputGroupInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                // value={confirmPassword}
                // onChange={(e) => setConfirmPassword(e.target.value)}
                {...register("confirmPassword")}
                placeholder={confirmPasswordPlaceholderProp}
                className="w-full font-normal"
                required
                />
                <InputGroupAddon>
                  <Lock className="w-5 h-5 text-text-muted"/>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  { showPassword ?
                  <Eye className="w-5 h-5 text-text-muted"/>
                  :
                  <EyeOff className="w-5 h-5 text-text-muted"/>
                  }
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button
            id="reset-button"
            type="submit"
            // disabled={loading}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover focus:bg-primary-hover text-text-contrast py-3"
            >
              {submitProp}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center items-center">
          <Link
          href="/"
          className="text-sm text-text-link hover:text-text-link-hover rounded py-2"
          >
            <MoveLeft className="inline w-4 h-4" />
            {"\t"}
            {goBackProp}
          </Link>
        </div>
      </div>
    </PageContainer>
    );
}