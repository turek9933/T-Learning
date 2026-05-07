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
}))

export const workspaceMemberRelations = relations(workspaceMembers, ({ one }) => ({
    workspaces: one(workspaces, {
        fields: [workspaceMembers.workspaceId],
        references: [workspaces.id],
    }),
    users: one(users, {
        fields: [workspaceMembers.userId],
        references: [users.id],
    }),
}));

export const workspaceInvitationRelations = relations(workspaceInvitations, ({ one }) => ({
    workspaces: one(workspaces, {
        fields: [workspaceInvitations.workspaceId],
        references: [workspaces.id],
    }),
    users: one(users, {
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
export const messageRelations = relations(messages, ({ one }) => ({
    replyTo: one(messages, {
        fields: [messages.replyToId],
        references: [messages.id],
    })
}))

export const posts = pgTable('posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    pinned: boolean('pinned'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postAttachments = pgTable('post_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade'}).notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    url: text('url').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});