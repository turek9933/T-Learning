export type Message = {
    id:              string;
    conversationId:  string;
    senderId:        string;
    senderName:      string | null;
    senderAvatarUrl: string | null;
    replyToId:       string | null;
    type:            'text' | 'image' | 'file';
    // content:
    //  for type === 'text': message text
    //  for type === 'image' | 'file': MinIO URL
    // Presigned URL would be by endpoint
    content:         string;
    attachment:      MessageAttachment | null;
    createdAt:       string;
    updatedAt:       string;
    deletedAt:       string | null;
}

export type MessageAttachment = {
    id:        string;
    name:      string;
    mimeType:  string;
    size:      number;
    createdAt: string;
}

export type MessageOutAttachment = {
    name:     string;
    mimeType: string;
    size:     number;
}

export type Conversation = {
    id:             string;
    participantAId: string;
    participantBId: string;
    createdAt:      string;
    updatedAt:      string;

    otherParticipantId:        string;
    otherParticipantName:      string;
    otherParticipantAvatarUrl: string;

    lastMessageId:        string;
    lastMessageType:      'text' | 'image' | 'file';
    lastMessageContent:   string;
    lastMessageSenderId:  string;
    lastMessageCreatedAt: string;
}

export type WsIncomingEvent =
    | { eventType: 'message.new';   message: Message }
    | { eventType: 'message.read';  messageId: string; userId: string }
    | { eventType: 'typing.start';  conversationId: string; userId: string }
    | { eventType: 'typing.stop';   conversationId: string; userId: string }

export type WsOutgoingEvent =
    | {
        eventType:      'message.send';
        conversationId: string;
        contentType:    'text';
        content:        string;
        replyToId?:     string;
      }
    | {
        eventType:      'message.send';
        conversationId: string;
        contentType:    'image' | 'file';
        // content = storageKey that was returned by MinIO
        content:        string;
        attachment:     MessageOutAttachment;
        replyToId?:     string;
      }
    | { eventType: 'message.read';  messageId: string }
    | { eventType: 'typing.start';  conversationId: string }
    | { eventType: 'typing.stop';   conversationId: string }