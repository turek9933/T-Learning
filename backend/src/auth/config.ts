import { betterAuth, APIError } from "better-auth";
import { db } from "@/db/index";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import { sendMail } from "@/lib/email";
import { env } from "@/config/env";
import { organization } from "better-auth/plugins";
import { ac, viewer, member, admin, owner, SINGLE_WORKSPACE_LIMITS } from "@/lib/permissions";
import type { WorkspaceRole } from "@/routes/workspaces.route";
import { workspaceMembers } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    user: {
        modelName: "users",
        fields: {
            image: "avatarUrl"
        },
        changeEmail: {
            enabled: true,
            updateEmailWithoutVerification: false,
            sendChangeEmailConfirmation: async ({ user, newEmail, url, token }, request) => {
                const frontendUrl = new URL(`${env.appUrl}/verify-email`);
                frontendUrl.searchParams.set('status', 'change-email');
                frontendUrl.searchParams.set('email', encodeURIComponent(newEmail));
                const urlWithCallback = new URL(url);
                urlWithCallback.searchParams.set('callbackURL', frontendUrl.toString());
                console.log(`[sendMail][change-email-confirmation] ${user.email} -> ${newEmail}:\t`, urlWithCallback.toString());
                await sendMail({
                    to: user.email,
                    subject: "Confirm new email address",
                    html: `
                    <h1>Confirm new email</h1>
                    <p>Hi,</p>
                    <p>Click <a href="${urlWithCallback.toString()}">here</a> to confirm your new email address: ${newEmail}</p>
                    <p>After this you will receive one more email with verification. Mail will be sent to ${newEmail}</p>
                    <p><a href="${urlWithCallback.toString()}">${urlWithCallback.toString()}</a></p>
                    <p>If you didn't request email change, you can ignore this message</p>
                    `,
                });
            },
        },
        deleteUser: {
            enabled: true,
        },
    },
    session: {
        modelName: "sessions",
        expiresIn: (Number(env.sessionExpirationDays) ?? 14 ) * 60 * 60 * 24,// Session expires in (SESSION_EXPIRATION_DAYS or 14) days
        updateAge: (Number(env.sessionUpdateDays) ?? 2 ) * 60 * 60 * 24,// Update session age every (SESSION_UPDATE_DAYS or 2) days
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,// Signed session snapshot kept in cookie for 5 minutes
        },
    },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: Number(env.passwordMinLenght) ?? 10,
        sendResetPassword: async ({ user, url, token }) => {
            console.log(`[sendMail][reset-password] ${user.email}:\t`, url);
            await sendMail({
                to: user.email,
                subject: "Reset password",
                html: `
                <h1>Reset password</h1>
                <p>Hi ${user.name},</p>
                <p>Click <a href="${url}">here</a> to reset your password or paste link from below. Link expires in 1 hour</p>
                <p><a href="${url}">${url}</a></p>
                <p>If you didn't request password reset, you can ignore this email</p>
                `,
            });
        },
        resetPasswordTokenExpiresIn: 3600,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
            const frontendUrl = new URL(`${env.appUrl}/verify-email`);
            frontendUrl.searchParams.set('token', token);
            console.log(`[sendMail][verify-email] ${user.email}:`, frontendUrl.toString());
            await sendMail({
                to: user.email,
                subject: "Verify email",
                html: `
                <h1>Verify email</h1>
                <p>Hi ${user.name},</p>
                <p>Click <a href="${frontendUrl.toString()}">here</a> to verify your email or paste link from below</p>
                <p><a href="${frontendUrl.toString()}">${frontendUrl.toString()}</a></p>
                <p>If you didn't request email verification, you can ignore this email</p>
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
        env.appUrl,
        ...env.corsOrigin.split(',').map(origin => origin.trim()),
    ],
    plugins : [
        organization({
            ac,
            roles: { owner, admin, member, viewer },
            
            allowUserToCreateOrganization: async ({ user }) => {
                return true;//TODO check if user is allowed to create organization
            },

            schema: {
                organization: {
                    modelName: "workspaces",
                    additionalFields: {
                        type: {
                            type: 'string',
                            defaultValue: 'single',
                            input: true,
                        },
                        description: {
                            type: 'string',
                            required: false,
                            input: true,
                        },
                        status: {
                            type: 'string',
                            defaultValue: 'draft',
                            input: true,
                        },
                        price: {
                            type: 'number',
                            required: false,
                            input: true,
                        },
                    },
                },
                member: {
                    modelName: "workspaceMembers",
                    fields: {
                        organizationId: "workspaceId",
                    },
                    additionalFields: {
                        hasPaid: {
                            type: 'boolean',
                            required: false,
                        },
                        expiresAt: {
                            type: 'date',
                            required: false,
                        },
                    },
                },
                invitation: {
                    modelName: "workspaceInvitations",
                    fields: {
                        organizationId: "workspaceId",
                    },
                },
                session: {
                    fields: {
                        activeOrganizationId: "activeWorkspaceId",
                    },
                },
            },

            // Checks if the user is allowed to create an invitation
            // 
            // if organization type is single
            // - no admin invitations
            // - one member invitation
            // - few viewer invitation
            // Checks if number of role members is less than limit
            // 
            // if organization type is group -> skip
            beforeCreateInvitation: async (data: {
                invitation: { email: string; role: string; organizationId: string; inviterId: string; [key: string]: unknown };
                organization: Record<string, unknown>;
                inviter: Record<string, unknown>;
            }) => {
                const invitation = data.invitation;
                const orgType    = data.organization.type as string | undefined;
                if (orgType !== 'single') return;

                const role = invitation.role as WorkspaceRole;
                const limit = SINGLE_WORKSPACE_LIMITS[role] ?? Infinity;

                if (limit === 0) {
                    throw new APIError('BAD_REQUEST', { message: 'Role not available in individual workspaces' });
                }

                if (isFinite(limit)) {
                    const result = await db
                        .select({ value: count() })
                        .from(workspaceMembers)
                        .where(
                            and(
                                eq(workspaceMembers.workspaceId, invitation.organizationId),
                                eq(workspaceMembers.role, role),
                            )
                        );

                    const currentCount = result[0]?.value ?? 0;
                    if (currentCount >= limit) {
                        throw new APIError('BAD_REQUEST', {
                            message: `SINGLE_WORKSPACE_LIMIT_${role.toUpperCase()}`,
                        });
                    }
                }
            },

            async sendInvitationEmail(data) {
                const invitationLink = `${env.appUrl}/invite/${data.id}`;
                // '[invite]' is grepped by `bun invites` for local access during testing.
                console.log(`[sendMail][invite] ${data.email}:\t${invitationLink}`);
                await sendMail({
                    to: data.email,
                    subject: `Invitation to ${data.organization.name}`,
                    html: `
                    <h1>Invitation to Workspace</h1>
                    <p>Hi,</p>
                    <p>User: ${data.inviter.user.name} has invited you to join Workspace: ${data.organization.name}</p>
                    <p>Click <a href="${invitationLink}">here</a> to join workspace or paste link from below</p>
                    <p><a href="${invitationLink}">${invitationLink}</a></p>
                    <p>If you didn't request this, you can ignore this email</p>
                    `,
                });
            }
        }),
    ],
});