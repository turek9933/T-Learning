import { sql, relations } from "drizzle-orm";
import { 
    boolean, integer, jsonb, numeric, text, timestamp, uuid,
    pgEnum, pgTable,
    index, uniqueIndex
} from "drizzle-orm/pg-core";


export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', [
    'owner',
    'admin',
    'member',
    'viewer'
])
export const workspaceTypeEnum = pgEnum('workspace_type', [
    'single',
    'group'
])
export const workspaceStatusEnum = pgEnum('workspace_status', [
    'draft',
    'active',
    'archived'
])
export const eventTypeEnum = pgEnum('event_type', [
    'meeting',
    'deadline',
    'exam'
])
export const messageStatusEnum = pgEnum('message_status', [
    'pending',
    'sent',
    'delivered',
    'read'
])
export const messageTypeEnum = pgEnum('message_type', [
    'text',
    'image',
    'file'
])
export interface WorkspaceSettings {
    notifications?: {
        push: boolean;
        email: boolean;
    };
    privacy?: {
        public: boolean;
        allowInvites: boolean;
    };
    features?: {
        chat: boolean;
        fileSharing: boolean;
    }
}

//
// Authentication tables
// 

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    avatarUrl: text('avatar_url'),// This field is putten by the betterAuth provider, if changes happens here you need to update betterAuth config
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    canCreateWorkspaces: boolean('can_create_workspaces').default(false).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
        .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    activeWorkspaceId: text('active_workspace_id'),
    },
    (table) => [index('sessions_userId_idx').on(table.userId)]
);

export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),// Provided by Google or it's userId if it's a local account
    providerId: text('provider_id').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),// Credentials provided by Google
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
        .notNull(),
    },
    (table) => [index('accounts_userId_idx').on(table.userId)]
);

export const verifications = pgTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
})

// 
// Authentication relationships
//

export const userRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    workspaceMembers: many(workspaceMembers),
    workspaceInvitations: many(workspaceInvitations),
    conversations: many(conversations),
    posts: many(posts),
    postComments: many(postComments),
    events: many(events),
    homeworks: many(homeworks),
    homeworkSubmissions: many(homeworkSubmissions),
    materials: many(materials),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

//
// Workspace tables
//

export const workspaces = pgTable('workspaces', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    type: workspaceTypeEnum('type').default('single').notNull(),
    description: text('description'),
    status: workspaceStatusEnum('status').default('draft').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }),
    settings: jsonb('settings').$type<WorkspaceSettings>(),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [uniqueIndex('workspaces_slug_uidx').on(table.slug)]
);

export const workspaceMembers = pgTable('workspace_members', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade'}).notNull(),
    role: workspaceMemberRoleEnum('role').default('member').notNull(),
    hasPaid: boolean('has_paid'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    },
    (table) => [
        index('workspace_members_workspaceId_idx').on(table.workspaceId),
        index('workspace_members_userId_idx').on(table.userId),
    ]
);

export const workspaceInvitations = pgTable('workspace_invitations', {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    inviterId: text('inviter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    email: text('email').notNull(),
    role: text('role').default('member').notNull(),
    status: text('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    },
    (table) => [
        index('workspace_invitations_workspaceId_idx').on(table.workspaceId),
        index('workspace_invitations_inviterId_idx').on(table.inviterId),
    ]
);

export const workspaceRelations = relations(workspaces, ({ many }) => ({
    workspaceMembers: many(workspaceMembers),
    workspaceInvitations: many(workspaceInvitations),
    posts: many(posts),
    events: many(events),
    homeworks: many(homeworks),
    materials: many(materials),
}))

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceMembers.workspaceId],
        references: [workspaces.id],
    }),
    user: one(users, {
        fields: [workspaceMembers.userId],
        references: [users.id],
    }),
}));

export const workspaceInvitationRelations = relations(workspaceInvitations, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceInvitations.workspaceId],
        references: [workspaces.id],
    }),
    inviter: one(users, {
        fields: [workspaceInvitations.inviterId],
        references: [users.id],
    }),
}));

//
// Chat tables
//

export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    participantAId: text('participant_a_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    participantBId: text('participant_b_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('conversations_participantAId_idx').on(table.participantAId),
    index('conversations_participantBId_idx').on(table.participantBId),
    uniqueIndex('conversations_participants_unique_idx').on(
        sql`LEAST(${table.participantAId}, ${table.participantBId})`,
        sql`GREATEST(${table.participantAId}, ${table.participantBId})`,
    ),
])

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    senderId: text('sender_id').references(() => users.id, { onDelete: 'set null' }),
    replyToId: uuid('reply_to_id'),
    type: messageTypeEnum('type').default('text').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => [
    index('messages_conversationId_idx').on(table.conversationId),
    index('messages_senderId_idx').on(table.senderId),
])

export const messageStatuses = pgTable('message_statuses', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: messageStatusEnum('status').default('sent').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('message_statuses_messageId_idx').on(table.messageId),
    index('message_statuses_userId_idx').on(table.userId),
])

// Metadata of the file attached to the message 
// message.content = MinIO URL while message.type = 'image' | 'file'.
export const chatAttachments = pgTable('chat_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull().unique(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('chat_attachments_messageId_idx').on(table.messageId),
])

export const messageRelations = relations(messages, ({ one }) => ({
    replyTo: one(messages, {
        fields: [messages.replyToId],
        references: [messages.id],
    }),
    attachment: one(chatAttachments, {
        fields: [messages.id],
        references: [chatAttachments.messageId],
    }),
}))

export const chatAttachmentRelations = relations(chatAttachments, ({ one }) => ({
    message: one(messages, {
        fields: [chatAttachments.messageId],
        references: [messages.id],
    }),
}))

//
// Post tables
//

export const posts = pgTable('posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    pinned: boolean('pinned').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => [
    index('posts_workspaceId_idx').on(table.workspaceId),
    index('posts_userId_idx').on(table.userId),
]);

export const postAttachments = pgTable('post_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade'}).notNull(),
    // Object key in MinIO, e.g. "workspaces/{workspaceId}/posts/{postId}/{fileId}"
    // Backend generates presigned URL on request — we don't store the URL in the database
    storageKey: text('storage_key').notNull(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('post_attachments_postId_idx').on(table.postId),
]);

export const postComments = pgTable('post_comments', {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}, (table) => [
    index('post_comments_postId_idx').on(table.postId),
    index('post_comments_userId_idx').on(table.userId),
]);

export const postRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
    workspace: one(workspaces, {
        fields: [posts.workspaceId],
        references: [workspaces.id],
    }),
    attachments: many(postAttachments),
    comments: many(postComments),
}));

export const postAttachmentRelations = relations(postAttachments, ({ one }) => ({
    post: one(posts, {
        fields: [postAttachments.postId],
        references: [posts.id],
    }),
}));

export const postCommentRelations = relations(postComments, ({ one }) => ({
    post: one(posts, {
        fields: [postComments.postId],
        references: [posts.id],
    }),
    author: one(users, {
        fields: [postComments.userId],
        references: [users.id],
    }),
}));

//
// Event tables
//

export const events = pgTable('events', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: eventTypeEnum('type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    // URL or phisical location
    location: text('location'),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at'),// Can be null
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('events_workspaceId_idx').on(table.workspaceId),
    index('events_startsAt_idx').on(table.startsAt),
]);

export const eventRelations = relations(events, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [events.workspaceId],
        references: [workspaces.id],
    }),
    author: one(users, {
        fields: [events.userId],
        references: [users.id],
    }),
}));

//
// Homework tables
//

export const homeworks = pgTable('homeworks', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    dueAt: timestamp('due_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('homeworks_workspaceId_idx').on(table.workspaceId),
]);

// Homework attachments, can be seen by all workspace users
export const homeworkAttachments = pgTable('homework_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    homeworkId: uuid('homework_id').references(() => homeworks.id, { onDelete: 'cascade' }).notNull(),
    storageKey: text('storage_key').notNull(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('homework_attachments_homeworkId_idx').on(table.homeworkId),
]);

export const homeworkSubmissions = pgTable('homework_submissions', {
    id: uuid('id').defaultRandom().primaryKey(),
    homeworkId: uuid('homework_id').references(() => homeworks.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    content: text('content'),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('homework_submissions_homeworkId_idx').on(table.homeworkId),
    index('homework_submissions_userId_idx').on(table.userId),
    uniqueIndex('homework_submissions_unique_idx').on(table.homeworkId, table.userId),
]);

export const submissionAttachments = pgTable('submission_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id').references(() => homeworkSubmissions.id, { onDelete: 'cascade' }).notNull(),
    storageKey: text('storage_key').notNull(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('submission_attachments_submissionId_idx').on(table.submissionId),
]);

export const homeworkRelations = relations(homeworks, ({ one, many }) => ({
    workspace: one(workspaces, {
        fields: [homeworks.workspaceId],
        references: [workspaces.id],
    }),
    author: one(users, {
        fields: [homeworks.userId],
        references: [users.id],
    }),
    attachments: many(homeworkAttachments),
    submissions: many(homeworkSubmissions),
}));

export const homeworkAttachmentRelations = relations(homeworkAttachments, ({ one }) => ({
    homework: one(homeworks, {
        fields: [homeworkAttachments.homeworkId],
        references: [homeworks.id],
    }),
}));

export const homeworkSubmissionRelations = relations(homeworkSubmissions, ({ one, many }) => ({
    homework: one(homeworks, {
        fields: [homeworkSubmissions.homeworkId],
        references: [homeworks.id],
    }),
    user: one(users, {
        fields: [homeworkSubmissions.userId],
        references: [users.id],
    }),
    attachments: many(submissionAttachments),
}));

export const submissionAttachmentRelations = relations(submissionAttachments, ({ one }) => ({
    submission: one(homeworkSubmissions, {
        fields: [submissionAttachments.submissionId],
        references: [homeworkSubmissions.id],
    }),
}));

//
// Materials table
//

export const materials = pgTable('materials', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    uploaderId: text('uploader_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('materials_workspaceId_idx').on(table.workspaceId),
]);

export const materialRelations = relations(materials, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [materials.workspaceId],
        references: [workspaces.id],
    }),
    uploader: one(users, {
        fields: [materials.uploaderId],
        references: [users.id],
    }),
}));