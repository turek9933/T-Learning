export type Message = {
    id: string;
    conversationId: string;
    senderId: string;
    replyToId: string;
    type: 'text' | 'image' | 'file';
    content: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export type Conversation = {
    id: string;
    participantAId: string;
    participantBId: string;
    createdAt: string;
    updatedAt: string;
}

export type WsIncomingEvent = 
    | { eventType: 'message.new'; message: Message }
    | { eventType: 'message.read'; messageId: string; userId: string }
    | { eventType: 'typing.start'; conversationId: string; userId: string }
    | { eventType: 'typing.stop'; conversationId: string; userId: string }

export type WsOutgoingEvent = 
    | { eventType: 'message.send'; conversationId: string; content: string; replyToId?: string }
    | { eventType: 'message.read'; messageId: string }
    | { eventType: 'typing.start'; conversationId: string }
    | { eventType: 'typing.stop'; conversationId: string }