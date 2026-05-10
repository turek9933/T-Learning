import { Elysia, t } from 'elysia';
import { eq, and, isNull, gte, desc, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { posts, postAttachments, events, homeworks, users } from '@/db/schema';
import { workspacePlugin } from '@/lib/workspace.plugin';

type FeedItemType = 'post' | 'event' | 'homework';

interface FeedItem {
    id:        string;
    type:      FeedItemType;
    createdAt: Date;
    [key: string]: unknown;
}

export const feedRoute = new Elysia({ prefix: '/api/workspaces/:slug/feed' })
    .use(workspacePlugin)

    // GET /api/workspaces/:slug/feed
    // Returns a list of posts, events and homeworks
    // paginated by createdAt and filtered by cursor
    
    // Three different queries, then merge in application
    //TODO UNION ALL in SQL - analyze if it's worth to implement
    .get('/', async ({ workspace, query }) => {
        const limit = query.limit ? Math.min(parseInt(query.limit), 50) : 10;
        const cursor = query.cursor ? new Date(query.cursor) : undefined;

        // Limit for each query is the same, so we can fetch more items and then merge
        const fetchLimit = limit;

        const cursorCondition = (dateField: any) =>
            cursor ? gte(dateField, cursor) : undefined;

        const [postRows, eventRows, homeworkRows] = await Promise.all([
            db
                .select({
                    type:         sql<FeedItemType>`'post'`,
                    id:           posts.id,
                    content:      posts.content,
                    pinned:       posts.pinned,
                    createdAt:    posts.createdAt,
                    userId:       posts.userId,
                    userName:     users.name,
                    userAvatar:   users.avatarUrl,
                })
                .from(posts)
                .leftJoin(users, eq(users.id, posts.userId))
                .where(
                    and(
                        eq(posts.workspaceId, workspace.id),
                        isNull(posts.deletedAt),
                        cursorCondition(posts.createdAt),
                    )
                )
                .orderBy(desc(posts.createdAt))
                .limit(fetchLimit),

            db
                .select({
                    type:         sql<FeedItemType>`'event'`,
                    id:           events.id,
                    eventType:    events.type,
                    title:        events.title,
                    description:  events.description,
                    location:     events.location,
                    startsAt:     events.startsAt,
                    endsAt:       events.endsAt,
                    createdAt:    events.createdAt,
                    userId:       events.userId,
                    userName:     users.name,
                    userAvatar:   users.avatarUrl,
                })
                .from(events)
                .leftJoin(users, eq(users.id, events.userId))
                .where(
                    and(
                        eq(events.workspaceId, workspace.id),
                        cursorCondition(events.createdAt),
                    )
                )
                .orderBy(desc(events.createdAt))
                .limit(fetchLimit),

            db
                .select({
                    type:         sql<FeedItemType>`'homework'`,
                    id:           homeworks.id,
                    title:        homeworks.title,
                    description:  homeworks.description,
                    dueAt:        homeworks.dueAt,
                    createdAt:    homeworks.createdAt,
                    userId:       homeworks.userId,
                    userName:     users.name,
                    userAvatar:   users.avatarUrl,
                })
                .from(homeworks)
                .leftJoin(users, eq(users.id, homeworks.userId))
                .where(
                    and(
                        eq(homeworks.workspaceId, workspace.id),
                        cursorCondition(homeworks.createdAt),
                    )
                )
                .orderBy(desc(homeworks.createdAt))
                .limit(fetchLimit),
        ]);

        // Post attachments
        const postIds = postRows.map(p => p.id);
        const attachments = postIds.length > 0
            ? await db
                .select()
                .from(postAttachments)
                .where(sql`${postAttachments.postId} = ANY(${postIds})`)
            : [];

        const attachmentsByPost = attachments.reduce<Record<string, typeof attachments>>((acc, a) => {
            if (!acc[a.postId]) acc[a.postId] = [];
            acc[a.postId]!.push(a);
            return acc;
        }, {});

        const postsWithAttachments = postRows.map(p => ({
            ...p,
            attachments: (attachmentsByPost[p.id] ?? []),
        }));

        // Merge and sort by createdAt DESC
        const merged: FeedItem[] = [
            ...postsWithAttachments,
            ...eventRows,
            ...homeworkRows,
        ].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, limit);

        return merged;
    }, {
        query: t.Object({
            limit:  t.Optional(t.String()),
            cursor: t.Optional(t.String()),
        }),
    })