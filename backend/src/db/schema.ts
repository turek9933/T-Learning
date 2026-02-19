import { relations } from "drizzle-orm";
import { 
    boolean, integer, jsonb, numeric, text, timestamp, uuid,
    pgEnum, pgTable,
    index 
} from "drizzle-orm/pg-core";


export const workspaceMemberRoleEnum = pgEnum('workspace_member_role', [
    'owner',
    'admin',
    'member',
    'viewer'
])
export const workspaceMemberStatusEnum = pgEnum('workspace_member_status', [
    'invited',
    'active', 
    'suspended'
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


export const workspaces = pgTable('workspaces', {
    id: uuid('id').defaultRandom().primaryKey(),
    active: boolean('active').default(true),
    type: workspaceTypeEnum('type').notNull().default('single'),
    name: text('name'),
    description: text('description'),
    status: workspaceStatusEnum('status').notNull().default('draft'),
    prize: numeric('prize', { precision: 10, scale: 2 }),
    settings: jsonb('settings').$type<WorkspaceSettings>(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const workspaceMembers = pgTable('workspace_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade'}).notNull(),
    role: workspaceMemberRoleEnum('role').notNull().default('member'),
    status: workspaceMemberStatusEnum('status').notNull().default('active'),
    hasPaid: boolean('has_paid'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
});

export const posts = pgTable('posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    pinned: boolean('pinned'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const postAttachments = pgTable('post_attachments', {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade'}).notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    url: text('url').notNull(),
    size: integer('size').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});