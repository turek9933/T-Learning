import { betterAuth } from "better-auth";
import { db } from "@/db/index";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { users, sessions, accounts, verifications } from "@/db/schema";
import { sendMail } from "@/lib/email";

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
            image: "avatar_url"
        }
    },
    session: {
        modelName: "sessions",
        expiresIn: (Number(process.env.SESSION_EXPIRATION_DAYS) ?? 14 ) * 60 * 60 * 24,// Session expires in (SESSION_EXPIRATION_DAYS or 14) days
        updateAge: (Number(process.env.SESSION_UPDATE_DAYS) ?? 2 ) * 60 * 24,// Update session age every (SESSION_UPDATE_DAYS or 2) days
    },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: Number(process.env.MIN_PASSWORD_LENGTH) ?? 10,
        sendResetPassword: async ({ user, url, token }) => {
            const frontendUrl = url.replace(process.env.BETTER_AUTH_BASE_URL!, process.env.CORS_ORIGIN!);
            console.log(user, url, token);
            console.log(`Sending for: ${user.email} link:\n${frontendUrl}`);
            sendMail({
                to: user.email,
                subject: "Reset password",
                html: `
                <h1>Reset password</h1>
                <p>Hi ${user.name},</p>
                <p>Click <a href="${frontendUrl}">here</a> to reset your password or paste link from below. Link expires in 1 hour</p>
                <p>${frontendUrl}</p>
                <p>If you didn't request this, you can ignore this email</p>
                `,
            });
        },
        resetPasswordTokenExpiresIn: 3600,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    baseURL: process.env.BETTER_AUTH_BASE_URL,
    trustedOrigins: [
        process.env.CORS_ORIGIN!
    ],
});