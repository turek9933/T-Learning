import { betterAuth } from "better-auth";
import { db } from "@/db/index";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { users, sessions, accounts, verifications } from "@/db/schema";
import { sendMail } from "@/lib/email";
import { env } from "@/config/env";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            users: users,
            sessions: sessions,
            accounts: accounts,
            verifications: verifications,
        },
    }),
    user: {
        modelName: "users",
        fields: {
            image: "avatarUrl"
        }
    },
    session: {
        modelName: "sessions",
        expiresIn: (Number(env.sessionExpirationDays) ?? 14 ) * 60 * 60 * 24,// Session expires in (SESSION_EXPIRATION_DAYS or 14) days
        updateAge: (Number(env.sessionUpdateDays) ?? 2 ) * 60 * 24,// Update session age every (SESSION_UPDATE_DAYS or 2) days
    },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: Number(env.passwordMinLenght) ?? 10,
        sendResetPassword: async ({ user, url, token }) => {
            console.log('[reset-password]:', url);
            sendMail({
                to: user.email,
                subject: "Reset password",
                html: `
                <h1>Reset password</h1>
                <p>Hi ${user.name},</p>
                <p>Click <a href="${url}">here</a> to reset your password or paste link from below. Link expires in 1 hour</p>
                <p><a href="${url}">${url}</a></p>
                <p>If you didn't request this, you can ignore this email</p>
                `,
            });
        },
        resetPasswordTokenExpiresIn: 3600,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const urlWithCallback = new URL(url);
            urlWithCallback.searchParams.set('callbackURL', `${env.corsOrigin}/verify-email?token=${token}`);
            console.log('[verify-email]:', urlWithCallback);
            sendMail({
                to: user.email,
                subject: "Verify email",
                html: `
                <h1>Verify email</h1>
                <p>Hi ${user.name},</p>
                <p>Click <a href="${urlWithCallback.toString()}">here</a> to verify your email or paste link from below</p>
                <p><a href="${urlWithCallback.toString()}">${urlWithCallback.toString()}</a></p>
                <p>If you didn't request this, you can ignore this email</p>
                `,
            });
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true
    },
    socialProviders: {
        google: {
            clientId: env.googleClientId as string,
            clientSecret: env.googleClientSecret as string,
        },
    },
    baseURL: env.betterAuthUrl,
    trustedOrigins: [
        env.corsOrigin
    ],
});