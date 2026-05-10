import { Elysia, t } from 'elysia';
import { db } from '@/db/index';
import { conversations, messages, messageStatuses, chatAttachments } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@/auth/config';

type WsMessage = 
 | { eventType: 'message.send'; conversationId: string; contentType: 'text'; content: string; replyToId?: string; }
 | { eventType: 'message.send'; conversationId: string; contentType: 'image' | 'file'; content: string; replyToId?: string; attachment: { name: string; mimeType: string; size: number; }; }
 | { eventType: 'message.read'; messageId: string; }
 | { eventType: 'typing.start'; conversationId: string; }
 | { eventType: 'typing.stop'; conversationId: string; }

const connectedUsers = new Map<string, string>();// wsId → userId

export const chatWs = new Elysia()
  .state('userId', '' as string)
  .ws('/ws', {
    body: t.Object({
      eventType:      t.String(),
      conversationId: t.Optional(t.String()),
      replyToId:      t.Optional(t.String()),
      contentType:    t.Optional(t.String()),
      content:        t.Optional(t.String()),
      messageId:      t.Optional(t.String()),
      attachment: t.Optional(t.Object({
        name:     t.String(),
        mimeType: t.String(),
        size:     t.Number(),
      })),
    }),

    async open(ws) {
        const session = await auth.api.getSession({
            headers: ws.data.headers,
        });
    
        if (!session) {
            ws.close(1008, 'Unauthorized');
            return;
        }

        connectedUsers.set(ws.id, session.user.id);

        ws.subscribe(`user:${session.user.id}`);
    },

    async message(ws, body) {
        const userId = connectedUsers.get(ws.id);
        if (!userId) return;
        
        const data = body as WsMessage;
        
        if (data.eventType === 'message.send') {
            try {
                const [conv] = await db
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
                    .limit(1);

                if (!conv || !data.content) 
                    return;

                const [newMessage] = await db
                    .insert(messages)
                    .values({
                        conversationId: data.conversationId,
                        senderId:       userId,
                        replyToId:      data.replyToId,
                        type:           data.contentType,
                        content:        data.content,
                    })
                    .returning();

                if (!newMessage)
                    return;

                let attachment: {
                    name:     string;
                    mimeType: string;
                    size:     number;
                } | null = null;

                if ((data.contentType === 'image' || data.contentType === 'file')
                    && 'attachment' in data
                    && data.attachment) {
                        const [inserted] = await db
                            .insert(chatAttachments)
                            .values({
                                messageId: newMessage.id,
                                name:      data.attachment.name,
                                mimeType:  data.attachment.mimeType,
                                size:      data.attachment.size,
                            })
                    }

                    await db.insert(messageStatuses).values({
                    messageId: newMessage.id,
                    userId,
                    status: 'sent',
                });

                await db
                    .update(conversations)
                    .set({ updatedAt: new Date() })
                    .where(eq(conversations.id, data.conversationId));

                const recipientId = conv.participantAId === userId
                    ? conv.participantBId
                    : conv.participantAId;

                const payload = {
                    eventType: 'message.new',
                    message: { ...newMessage, attachment },
                };
                ws.publish(`user:${recipientId}`, payload);
                ws.send(payload);
            } catch (error) {
                console.error('[message.send] error:', error);
            }
        }

        if (data.eventType === 'typing.start' || data.eventType === 'typing.stop') {
            const [conv] = await db
                .select()
                .from(conversations)
                .where(eq(conversations.id, data.conversationId!))
                .limit(1);

            if (!conv) return;

            const recipientId = conv.participantAId === userId
                ? conv.participantBId
                : conv.participantAId;

            ws.publish(`user:${recipientId}`, {
                eventType:      data.eventType,
                conversationId: data.conversationId,
                userId,
            });
        }

        if (data.eventType === 'message.read') {
            await db
                .update(messageStatuses)
                .set({ status: 'read', updatedAt: new Date() })
                .where(
                    and(
                        eq(messageStatuses.messageId, data.messageId),
                        eq(messageStatuses.userId, userId),
                    )
                );

            const [readMessage] = await db
                .select()
                .from(messages)
                .where(eq(messages.id, data.messageId))
                .limit(1);

            if (readMessage?.senderId) {
                ws.publish(`user:${readMessage.senderId}`, {
                    eventType: 'message.read',
                    messageId: data.messageId,
                    userId,
                });
            }
        }
    },

    async close(ws) {
        const userId = connectedUsers.get(ws.id);

        if (userId) ws.unsubscribe(`user:${userId}`);

        connectedUsers.delete(ws.id);
    },
});