"use client"

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { customToast } from "@/lib/customToast";
import { PageContainer } from "@/components/ui/PageContainer";
import { Banner } from "@/components/ui/Banner";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Mail, MoveLeft } from "lucide-react";
import { env } from "@/lib/env";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { useValidationSchemas, ForgotPasswordFormData } from "@/lib/validation";

interface ForgotPasswordData {
    titleProp: string;
    subtitleProp: string;
    emailProp: string;
    emailPlaceholderProp: string;
    submitProp: string;
    successProp: string;
    errorProp: string;
    goBackProp: string;
}

export default function ForgotPasswordForm({ titleProp, subtitleProp, emailProp, emailPlaceholderProp, submitProp, successProp, errorProp, goBackProp }: ForgotPasswordData) {
    const { forgotPasswordSchema } = useValidationSchemas();
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
      resolver: zodResolver(forgotPasswordSchema),
    });
  
    const onError = (err: FieldErrors<ForgotPasswordFormData>) => {
      if (err.email) {
        customToast.error(err.email.message ?? errorProp);
      }
    };

    const onSubmit = async (data: ForgotPasswordFormData) => {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${env.appUrl}/`,
      });
      if (error) {
        customToast.error(errorProp);
      } else {
        customToast.success(successProp);
      }
    };

    return (
    <PageContainer sidebar={false}>
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
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
            <div>
              <label htmlFor="email" className="block text-sm font-normal text-text mb-2">
                {emailProp}
              </label>
                <InputGroup className={`bg-bg-muted py-6`}>
                  <InputGroupInput
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder={emailPlaceholderProp}
                  className="w-full font-normal"
                  required
                  />
                  <InputGroupAddon>
                    <Mail className="w-5 h-5 text-text-muted"/>
                  </InputGroupAddon>
                </InputGroup>
            </div>

            <Button
            id="forgot-button"
            type="submit"
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