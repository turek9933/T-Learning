import { Elysia, t } from 'elysia';
import { db } from '@/db/index';
import { conversations, messages, messageStatuses } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@/auth/config';

type WsMessage = 
 | { eventType: 'message.send'; conversationId: string; contentType: 'text' | 'image' | 'file'; content: string; replyToId?: string; }
 | { eventType: 'message.read'; messageId: string; }
 | { eventType: 'typing.start'; conversationId: string; }
 | { eventType: 'typing.stop'; conversationId: string; }

const connectedUsers = new Map<string, string>() // wsId → userId

export const chatWs = new Elysia()
  .state('userId', '' as string)
  .ws('/ws', {
    body: t.Object({
      eventType: t.String(),
      conversationId: t.Optional(t.String()),
      replyToId: t.Optional(t.String()),
      contentType: t.Optional(t.String()),
      content: t.Optional(t.String()),
      messageId: t.Optional(t.String()),
    }),

    async open(ws) {
        const session = await auth.api.getSession({
            headers: ws.data.headers,
        });
    
        if (!session) {
            ws.close(1008, 'Unauthorized');
            return;
        }

        // ws.data.store.userId = session.user.id
        connectedUsers.set(ws.id, session.user.id)

        
        ws.subscribe(`user:${session.user.id}`);
    },

    async message(ws, body) {
        const userId = connectedUsers.get(ws.id);

        if (!userId) return;
        
        const data = body as WsMessage;
        
        if (data.eventType === 'message.send') {
            try {
                const conversation = await db
                    .select()
                    .from(conversations)
                    .where(
                        and(
                            eq(conversations.id, data.conversationId),
                            or(
                                eq(conversations.participantAId, userId),
                                eq(conversations.participantBId, userId),
                            )
                        )
                    )
                    .limit(1)

                if (conversation.length === 0) 
                    return;

                if (!data.content) 
                    return;

                const conv = conversation[0]!;

                const [newMessage] = await db
                    .insert(messages)
                    .values({
                        conversationId: data.conversationId,
                        senderId: userId,
                        replyToId: data.replyToId,
                        type: data.contentType,
                        content: data.content,
                    })
                    .returning()

                if (!newMessage)
                    return;

                await db.insert(messageStatuses).values({
                    messageId: newMessage.id,
                    userId,
                    status: 'sent',
                })

                await db
                    .update(conversations)
                    .set({ updatedAt: new Date() })
                    .where(eq(conversations.id, data.conversationId))

                const recipientId = conv?.participantAId === userId
                    ? conv.participantBId
                    : conv.participantAId

                ws.publish(`user:${recipientId}`, {
                    eventType: 'message.new',
                    message: newMessage,
                })

                ws.send({
                    eventType: 'message.new',
                    message: newMessage,
                })
            } catch (error) {
                console.error('[message.send] error:', error);
            }
        }

        if (data.eventType === 'typing.start' || data.eventType === 'typing.stop') {
            const conversation = await db
                .select()
                .from(conversations)
                .where(eq(conversations.id, data.conversationId!))
                .limit(1)

            if (conversation.length === 0) 
                return;

            const conv = conversation[0]!;

            const recipientId = conv?.participantAId === userId
                ? conv.participantBId
                : conv.participantAId

            ws.publish(`user:${recipientId}`, {
                eventType: data.eventType,
                conversationId: data.conversationId,
                userId,
            })
        }

        if (data.eventType === 'message.read') {
            await db
                .update(messageStatuses)
                .set({ status: 'read', updatedAt: new Date() })
                .where(
                    and(
                        eq(messageStatuses.messageId, data.messageId),
                        eq(messageStatuses.userId, userId)
                    )
                )

            const [readMessage] = await db
                .select()
                .from(messages)
                .where(eq(messages.id, data.messageId))
                .limit(1)

            if (readMessage?.senderId) {
                ws.publish(`user:${readMessage.senderId}`, {
                    eventType: 'message.read',
                    messageId: data.messageId,
                    userId
                })
            }
        }
    },

    async close(ws) {
        const userId = connectedUsers.get(ws.id);

        if (userId) ws.unsubscribe(`user:${userId}`);

        connectedUsers.delete(ws.id);
    },
})