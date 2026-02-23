import { betterAuth } from "better-auth";
import { db } from "@/db/index";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { users, sessions, accounts, verifications } from "@/db/schema";

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
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    trustedOrigins: [
        process.env.CORS_ORIGIN!
    ],
});