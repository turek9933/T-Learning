import { useTranslations } from "next-intl";
import { z } from "zod";
import { env } from "@/lib/env";


export function useValidationSchemas() {
  const t = useTranslations("validation");
  const loginSchema = z.object({
    email: z
      .email({ message: t("invalidEmail") })
      .min(1, { message: t("required") }),

    password: z
      .string({ message: t("required") })
      .min(Number(env.passwordMinLength ?? 10), { message: t("passwordTooShort", {minLength: env.passwordMinLength}) }),

    rememberMe: z.boolean(),
  });

  const registerSchema = z.object({
    firstName: z
      .string({ message: t("required") })
      .min(2, { message: t("nameTooShort") }),
    
    lastName: z
      .string({ message: t("required") })
      .min(2, { message: t("nameTooShort") }),

    email: z
      .email({ message: t("invalidEmail") })
      .min(1, { message: t("required") }),

    password: z
      .string({ message: t("required") })
      .min(Number(env.passwordMinLength ?? 10), { message: t("passwordTooShort", {minLength: env.passwordMinLength}) }),

    confirmPassword: z
      .string({ message: t("required") })
      .min(Number(env.passwordMinLength ?? 10), { message: t("passwordTooShort", {minLength: env.passwordMinLength}) }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMustMatch"),
      path: ["password"],// Error will appear on data.password field
    });

  const forgotPasswordSchema = z.object({
    email: z
      .email({ message: t("invalidEmail") })
      .min(1, { message: t("required") }),
  });

  const newPasswordSchema = z
    .object({
      password: z
        .string({ message: t("required") })
        .min(Number(env.passwordMinLength ?? 10), { message: t("passwordTooShort", {minLength: env.passwordMinLength}) }),
        
        confirmPassword: z
        .string({ message: t("required") })
        .min(Number(env.passwordMinLength ?? 10), { message: t("passwordTooShort", {minLength: env.passwordMinLength}) }),
  })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMustMatch"),
      path: ["password"],// Error will appear on data.password field
    });

  const workspaceSchema = z.object({
    name: z
      .string({ message: t("required") })
      .min(3, { message: t("workspaceNameTooShort") })
      .max(Number(env.workspaceNameMaxLength ?? 100), { message: t("workspaceNameTooLong", {nameMaxLength: env.workspaceNameMaxLength}) }),

    slug: z
      .string({ message: t("required") })
      .min(3, { message: t("nameTooShort") })
      .max(Number(env.workspaceNameMaxLength ?? 100), { message: t("workspaceNameTooLong", {nameMaxLength: env.workspaceNameMaxLength}) })
      .regex(/^[a-z0-9-]+$/, { message: t("workSpaceSlugInvalid") }),

    type: z.enum(['single', 'group']),

    description: z
      .string()
      .max(Number(env.workspaceDescriptionMaxLength ?? 500), { message: t("workspaceDescriptionTooLong", {descriptionMaxLength: env.workspaceDescriptionMaxLength}) })
      .optional(),

    price: z
      .number({ message: t("workspacePriceInvalid") })
      .min(0, { message: t("workspacePriceTooLow") })
      .optional(),
  });

  return {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    newPasswordSchema,
    workspaceSchema
  };
}

export type LoginFormData = z.infer<ReturnType<typeof useValidationSchemas>["loginSchema"]>;
export type RegisterFormData = z.infer<ReturnType<typeof useValidationSchemas>["registerSchema"]>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof useValidationSchemas>["forgotPasswordSchema"]>;
export type NewPasswordFormData = z.infer<ReturnType<typeof useValidationSchemas>["newPasswordSchema"]>;

export type WorkspaceFormData = z.infer<ReturnType<typeof useValidationSchemas>["workspaceSchema"]>;