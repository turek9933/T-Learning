import { Elysia, t } from 'elysia';
import { eq, and, desc, lt } from 'drizzle-orm';
import { db } from '@/db/index';
import { users, workspaces, workspaceMembers, workspaceInvitations, conversations, messages, chatAttachments } from '@/db/schema';
import { authRoute } from '@/routes/auth.route';
import { alias } from 'drizzle-orm/pg-core';
import { SINGLE_WORKSPACE_LIMITS } from '@/lib/permissions';
import { auth } from '@/auth/config';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export async function getUserRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    const [membership] = await db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.userId, userId),
                eq(workspaceMembers.workspaceId, workspaceId)
            )
        )
        .limit(1);

    return membership?.role ?? null;
}

// Loads both chat participants with their workspace role.
// Used by the workspace chat endpoint to render the header.
async function loadWorkspaceChatParticipants(
    workspaceId: string,
    participantAId: string,
    participantBId: string,
) {
    const userA   = alias(users, 'user_a');
    const userB   = alias(users, 'user_b');
    const memberA = alias(workspaceMembers, 'member_a');
    const memberB = alias(workspaceMembers, 'member_b');

    const [row] = await db
        .select({
            aId:        userA.id,
            aName:      userA.name,
            aAvatarUrl: userA.avatarUrl,
            aRole:      memberA.role,
            bId:        userB.id,
            bName:      userB.name,
            bAvatarUrl: userB.avatarUrl,
            bRole:      memberB.role,
        })
        .from(userA)
        .innerJoin(userB, eq(userB.id, participantBId))
        .leftJoin(memberA, and(
            eq(memberA.userId, userA.id),
            eq(memberA.workspaceId, workspaceId),
        ))
        .leftJoin(memberB, and(
            eq(memberB.userId, userB.id),
            eq(memberB.workspaceId, workspaceId),
        ))
        .where(eq(userA.id, participantAId))
        .limit(1);

    if (!row) return null;

    return {
        participantA: { id: row.aId, name: row.aName, avatarUrl: row.aAvatarUrl, role: row.aRole as WorkspaceRole },
        participantB: { id: row.bId, name: row.bName, avatarUrl: row.bAvatarUrl, role: row.bRole as WorkspaceRole },
    };
}

export const workspaceRoute = new Elysia({ prefix: '/api/workspaces' })
    .use(authRoute)

    // GET /api/workspaces/:slug
    // Returns the workspace with the given slug and role of the current user
    .get('/:slug', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role) {
            return status(403, 'You are not a member of this workspace');
        }

        return { ...workspace, role };
    }, {
        auth: true
    })

    // PUT /api/workspaces/:slug
    // Updates the workspace of the given slug
    .put('/:slug', async ({ user, params: { slug }, body, status }) => {
        if (body && body.price) {
            if (body.price < 0) {
                return status(400, 'Price must be greater than 0');
            }
            const decimals = body.price.toString().split('.')[1] || '';
            if (decimals.length > 2) {
                return status(400, 'Price must have at most 2 decimal places');
            }
        }
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role || 
            (role !== 'owner' && role !== 'admin')) {
            return status(403, 'You are not allowed to update this workspace');
        }

        const [updatedWorkspace] = await db
            .update(workspaces)
            .set({
                name:        body.name,
                logo:        body.logo,
                description: body.description,
                price:       body.price?.toString(),
                metadata:    body.metadata,
                updatedAt:   new Date(),
            })
            .where(eq(workspaces.id, workspace.id))
            .returning( {
                id:          workspaces.id,
                name:        workspaces.name,
                slug:        workspaces.slug,
                logo:        workspaces.logo,
                type:        workspaces.type,
                description: workspaces.description,
                status:      workspaces.status,
                metadata:    workspaces.metadata,
                createdAt:   workspaces.createdAt,
                updatedAt:   workspaces.updatedAt,
            })

        return updatedWorkspace;
    }, {
        auth: true,
        body: t.Object({
            name:        t.Optional(t.String()),
            logo:        t.Optional(t.String()),
            description: t.Optional(t.String()),
            price:       t.Optional(t.Number({ minimum: 0, errorMessage: 'Price must be a valid number' })),
            metadata:    t.Optional(t.String()),
        }),
    })

    // PUT /api/workspaces/:slug/status
    // Updates the status of the workspace of the given slug
    .put('/:slug/status', async ({ user, params: { slug }, body, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id, status: workspaces.status })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role || 
            (role !== 'owner' && role !== 'admin')) {
            return status(403, 'You are not allowed to update status of this workspace');
        }

        const rightChanges: Record<string, string> = {
            draft:    'active',
            active:   'archived',
            archived: 'active',
        };
        
        const allowed = rightChanges[workspace.status] === body.status;

        if (!allowed) {
            return status(400, `Cannot change status to from ${workspace.status} to ${body.status}`);
        }

        const [updatedWorkspace] = await db
            .update(workspaces)
            .set({
                status: body.status,
                updatedAt: new Date(),
            })
            .where(eq(workspaces.id, workspace.id))
            .returning({
                id:          workspaces.id,
                status:      workspaces.status,
                updatedAt:   workspaces.updatedAt,
            });

        return updatedWorkspace;

    }, {
        auth: true,
        body: t.Object({
            status: t.Union([
                t.Literal('draft'),
                t.Literal('active'),
                t.Literal('archived'),
            ], { errorMessage: 'Invalid status' }),
        }),
    })

    // DELETE /api/workspaces/:slug
    // Deletes the workspace of the given slug
    .delete('/:slug', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role || role !== 'owner' ) {
            return status(403, 'You are not allowed to delete this workspace');
        }

        await db
            .delete(workspaces)
            .where(eq(workspaces.id, workspace.id));

        return {
            success: true,
            status: 200, 
            message: 'Workspace deleted'
        };
    }, {
        auth: true,
    })

    // GET /api/workspaces/:slug/members
    // Returns the members of the workspace with the given slug
    .get('/:slug/members', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role) {
            return status(403, 'You are not a member of this workspace');
        }

        const members = await db
            .select({
                userId: users.id,
                name:   users.name,
                email:  users.email,
                avatarUrl: users.avatarUrl,
                memberId: workspaceMembers.id,
                role:   workspaceMembers.role,
                hasPaid: workspaceMembers.hasPaid,
                expiresAt: workspaceMembers.expiresAt,
                createdAt: workspaceMembers.createdAt,
            })
            .from(workspaceMembers)
            .innerJoin(
                users,
                eq(workspaceMembers.userId, users.id),
            )
            .where(eq(workspaceMembers.workspaceId, workspace.id));

        return members;
    }, {
        auth: true
    })

    // GET /api/workspaces/:slug/chat
    // Returns the workspace chat.
    // Creates it on first access - any workspace member can open it.
    // `canSend` is true only if requester is one of the two participants
    .get('/:slug/chat', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) return status(404, 'Workspace not found');

        const role = await getUserRole(user.id, workspace.id);
        if (!role) return status(403, 'Permissions - you need to be a member of the workspace');

        let conv = await db
            .select({
                id:             conversations.id,
                participantAId: conversations.participantAId,
                participantBId: conversations.participantBId,
            })
            .from(conversations)
            .where(eq(conversations.workspaceId, workspace.id))
            .limit(1)
            .then(rows => rows[0]);

        if (!conv) {
            const members = await db
                .select({ userId: workspaceMembers.userId, role: workspaceMembers.role })
                .from(workspaceMembers)
                .where(eq(workspaceMembers.workspaceId, workspace.id))
                .orderBy(workspaceMembers.createdAt);

            const owner  = members.find(m => m.role === 'owner');
            const member = members.find(m => m.role === 'member');
            if (!owner || !member)
                return status(422, { message: 'Workspace needs at least one owner and one member to create chat' });

            const [created] = await db
                .insert(conversations)
                .values({ participantAId: owner.userId, participantBId: member.userId, workspaceId: workspace.id })
                .returning({
                    id:             conversations.id,
                    participantAId: conversations.participantAId,
                    participantBId: conversations.participantBId,
                });

            if (!created) return status(500, { message: 'Failed to create workspace chat' });
            conv = created;
        }

        const participants = await loadWorkspaceChatParticipants(workspace.id, conv.participantAId, conv.participantBId);

        if (!participants) return status(500, { message: 'Workspace chat participants missing' });

        const isParticipant = user.id === conv.participantAId || user.id === conv.participantBId;
        return {
            conversationId: conv.id,
            canSend:        isParticipant && role !== 'viewer',
            ...participants,
        };
    }, {
        auth: true
    })

    // GET /api/workspaces/:slug/chat/messages
    .get('/:slug/chat/messages', async ({ user, params: { slug }, query, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) return status(404, 'Workspace not found');

        const role = await getUserRole(user.id, workspace.id);
        if (!role) return status(403, 'Permissions - You need to be a member of the workspace');

        const [conv] = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(eq(conversations.workspaceId, workspace.id))
            .limit(1);

        if (!conv) return status(404, { message: 'Conversation not found' });

        const limit = query.limit ? parseInt(query.limit) : 30;
        const sender = alias(users, 'sender');

        return await db
            .select({
                id:              messages.id,
                conversationId:  messages.conversationId,
                senderId:        messages.senderId,
                senderName:      sender.name,
                senderAvatarUrl: sender.avatarUrl,
                replyToId:       messages.replyToId,
                type:            messages.type,
                content:         messages.content,
                createdAt:       messages.createdAt,
                updatedAt:       messages.updatedAt,
                deletedAt:       messages.deletedAt,
                attachment: {
                    id:        chatAttachments.id,
                    name:      chatAttachments.name,
                    mimeType:  chatAttachments.mimeType,
                    size:      chatAttachments.size,
                    createdAt: chatAttachments.createdAt,
                },
            })
            .from(messages)
            .leftJoin(chatAttachments, eq(chatAttachments.messageId, messages.id))
            .leftJoin(sender, eq(sender.id, messages.senderId))
            .where(
                and(
                    eq(messages.conversationId, conv.id),
                    query.cursor
                        ? lt(messages.createdAt, new Date(query.cursor))
                        : undefined,
                )
            )
            .orderBy(desc(messages.createdAt))
            .limit(limit);
    }, {
        auth: true,
        query: t.Object({
            limit:  t.Optional(t.String()),
            cursor: t.Optional(t.String()),
        }),
    })

    // GET /api/workspaces/:slug/members/limits
    // Returns counts and limits for the workspace roles
    .get('/:slug/members/limits', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id, type: workspaces.type })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) return status(404, 'Workspace not found');

        const role = await getUserRole(user.id, workspace.id);
        if (!role) return status(403, 'Permissions - You need to be a member of the workspace');

        const rows = await db
            .select({ role: workspaceMembers.role })
            .from(workspaceMembers)
            .where(eq(workspaceMembers.workspaceId, workspace.id));

        const counts = { owner: 0, admin: 0, member: 0, viewer: 0 };
        for (const r of rows)
            counts[r.role as keyof typeof counts]++;

        return {
            type: workspace.type,
            counts,
            limits: workspace.type === 'single' ? SINGLE_WORKSPACE_LIMITS : null,
        };
    }, { auth: true })

    // POST /api/workspaces/:slug/invitations/resend
    // Cancels the existing pending invitation for email and creates a new one.
    // The new invitation gets a new id, expiretion time and new link is generated by better-auth.
    .post('/:slug/invitations/resend', async ({ user, params: { slug }, body, status, request }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);
        if (!workspace) return status(404, 'Workspace not found');

        const role = await getUserRole(user.id, workspace.id);
        if (role !== 'owner' && role !== 'admin')
            return status(403, 'Only owner or admin can resend invitations');

        const [existing] = await db
            .select({
                id:    workspaceInvitations.id,
                email: workspaceInvitations.email,
                role:  workspaceInvitations.role,
            })
            .from(workspaceInvitations)
            .where(and(
                eq(workspaceInvitations.workspaceId, workspace.id),
                eq(workspaceInvitations.email, body.email),
                eq(workspaceInvitations.status, 'pending'),
            ))
            .limit(1);

        if (!existing)
            return status(404, { message: 'No pending invitation for this email' });

        try {
            await auth.api.cancelInvitation({
                body: { invitationId: existing.id },
                headers: request.headers,
            });

            const created = await auth.api.createInvitation({
                body: {
                    email:          existing.email,
                    role:           existing.role as WorkspaceRole,
                    organizationId: workspace.id,
                },
                headers: request.headers,
            });

            return { invitationId: created.id };
        } catch (err: any) {
            console.error('[invitation resend] error:', err);
            return status(500, { message: err?.message ?? 'Failed to resend invitation' });
        }
    }, {
        auth: true,
        body: t.Object({
            email: t.String(),
        }),
    });