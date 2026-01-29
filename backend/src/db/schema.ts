import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";


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


export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLogin: timestamp('last_login'),
    active: boolean('active'),
});

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
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade'}).notNull(),
    role: workspaceMemberRoleEnum('role').notNull().default('member'),
    status: workspaceMemberStatusEnum('status').notNull().default('active'),
    hasPaid: boolean('has_paid'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
});

export const posts = pgTable('posts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
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