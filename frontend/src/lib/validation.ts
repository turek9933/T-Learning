import { z } from "zod";
import { useTranslations } from "next-intl";

export function useValidationSchemas() {
  const t = useTranslations("validation");

  const loginSchema = z.object({
    email: z
      .email({ message: t("invalidEmail") })
      .min(1, { message: t("required") }),

    password: z
      .string({ message: t("required") })
      .min(10, { message: t("passwordTooShort") })
  });

  const registerSchema = z.object({
      first_name: z
        .string({ message: t("required") })
        .min(2, { message: t("nameTooShort") }),
      
        last_name: z
        .string({ message: t("required") })
        .min(2, { message: t("nameTooShort") }),

      email: z
        .email({ message: t("invalidEmail") })
        .min(1, { message: t("required") }),

      password: z
        .string({ message: t("required") })
        .min(10, { message: t("passwordTooShort") }),

      confirmPassword: z
        .string({ message: t("required") })
        .min(10, { message: t("required") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMustMatch"),
      path: ["confirmPassword"],// Error will appear on data.confirmPassword field
    });

  const resetPasswordSchema = z.object({
    email: z
      .email({ message: t("invalidEmail") })
      .min(1, { message: t("required") }),
  });

  const newPasswordSchema = z
    .object({
      password: z
        .string({ message: t("required") })
        .min(10, { message: t("passwordTooShort") }),

      confirmPassword: z
        .string({ message: t("required") })
        .min(10, { message: t("required") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMustMatch"),
      path: ["confirmPassword"],// Error will appear on data.confirmPassword field
    });

  return {
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    newPasswordSchema,
  };
}