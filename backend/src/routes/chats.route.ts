import { Elysia, t } from 'elysia';
import { and, or, eq, desc, lt, sql, isNull } from 'drizzle-orm';
import { db } from '@/db/index';
import { conversations, messages, chatAttachments, users, workspaceMembers } from '@/db/schema';
import { auth } from '@/auth/config';
import { alias } from 'drizzle-orm/pg-core';

export const chatRoute = new Elysia({ prefix: '/api/conversations' })
    .derive(async ({ status, request: { headers } }) => {
        const session = await auth.api.getSession({ headers });
        if (!session) {
            return status(401, { message: 'Unauthorized' });
        }
        return { user: session.user }
    })

    // GET /api/conversations
    // Search for user conversations
    .get('/', async ({ user }) => {
        const otherParticipantIdExpression = sql<string>`
            CASE
                WHEN ${conversations.participantAId} = ${user.id}
                THEN ${conversations.participantBId}
                ELSE ${conversations.participantAId}
            END`

        const otherUser = alias(users, 'other_user');

        const lastMessageSubquery = db
            .select({
                id:               messages.id,
                type:             messages.type,
                content:          messages.content,
                senderId:         messages.senderId,
                createdAt:        messages.createdAt,
            })
            .from(messages)
            .where(
                and(
                    eq(messages.conversationId, conversations.id),
                    isNull(messages.deletedAt),
                )
            )
            .orderBy(desc(messages.createdAt))
            .limit(1)
            .as('lastMessage');

        const result = await db
            .select({
                id:                         conversations.id,
                participantAId:             conversations.participantAId,
                participantBId:             conversations.participantBId,
                createdAt:                  conversations.createdAt,
                updatedAt:                  conversations.updatedAt,
                
                otherParticipantId:         otherParticipantIdExpression.as('other_participant_id'),
                otherParticipantName:       otherUser.name,
                otherParticipantAvatarUrl:  otherUser.avatarUrl,

                lastMessageId:              lastMessageSubquery.id,
                lastMessageType:            lastMessageSubquery.type,
                lastMessageContent:         lastMessageSubquery.content,
                lastMessageSenderId:        lastMessageSubquery.senderId,
                lastMessageCreatedAt:       lastMessageSubquery.createdAt,
            })
            .from(conversations)
            .leftJoinLateral(lastMessageSubquery, sql`true`)
            .leftJoin(otherUser, eq(otherUser.id, otherParticipantIdExpression))
            .where(
                and(
                    or(
                        eq(conversations.participantAId, user.id),
                        eq(conversations.participantBId, user.id),
                    ),
                    isNull(conversations.workspaceId),
                )
            )
            .orderBy(desc(conversations.updatedAt))
            return result
    })

    // POST /api/conversations
    // Create a new conversation between two users if not exists already
    .post('/', async ({ user, body, status }) => {
        if (!body.participantId) {
            return status(400, { message: 'Missing participantId' });
        }

        try {
            const [created] = await db
                .insert(conversations)
                .values({
                    participantAId: user.id,
                    participantBId: body.participantId,
                })
                .returning({
                    id:               conversations.id,
                    participantAId:   conversations.participantAId,
                    participantBId:   conversations.participantBId,
                    createdAt:        conversations.createdAt,
                    updatedAt:        conversations.updatedAt,
                })

            return created
        } catch (err: any) {
            if (err.code === '23505') {
                const existing = await db
                    .select()
                    .from(conversations)
                    .where(
                        or(
                            and(
                                eq(conversations.participantAId, user.id),
                                eq(conversations.participantBId, body.participantId),
                            ),
                            and(
                                eq(conversations.participantAId, body.participantId),
                                eq(conversations.participantBId, user.id),
                            ),
                        )
                    )
                    .limit(1)

                if (existing.length > 0) {
                    return existing[0]
                }
            }

            return status(500, { message: 'Internal server error, cannot create conversation' });
        }
    }, {
        body: t.Object({
            participantId: t.String(),
        }),
    })

    // GET /api/:id/messages
    // Get a conversation by id, cursor is createdAt of last message, limit how much to load
    .get('/:id/messages', async ({ user, params, query, status }) => {
        const [conv] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, params.id))
            .limit(1);

        if (!conv) return status(404, { message: 'Conversation not found' });

        // Workspace conversation - any workspace member may read
        if (conv.workspaceId) {
            const [membership] = await db
                .select({ role: workspaceMembers.role })
                .from(workspaceMembers)
                .where(and(
                    eq(workspaceMembers.userId, user.id),
                    eq(workspaceMembers.workspaceId, conv.workspaceId),
                ))
                .limit(1);
            if (!membership) return status(403, { message: 'Forbidden - you must be a member of this workspace' });
        } else {
            // Global DM: must be a participant
            if (conv.participantAId !== user.id && conv.participantBId !== user.id) {
                return status(403, { message: 'Forbidden - you must be a participant of this conversation' });
            }
        }

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

                // not null only if type === 'image' | 'file'
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
                    eq(messages.conversationId, params.id),
                    query.cursor
                        ? lt(messages.createdAt, new Date(query.cursor))
                        : undefined,
                )
            )
            .orderBy(desc(messages.createdAt))
            .limit(limit);
    }, {
        query: t.Object({
            limit: t.Optional(t.String()),
            cursor: t.Optional(t.String()),
        }),
    })