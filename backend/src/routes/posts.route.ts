import { Elysia, t } from 'elysia';
import { eq, lt, and, sql, isNull, desc } from 'drizzle-orm';
import { db } from '@/db';
import { posts, postComments, postAttachments, users } from '@/db/schema';
import { workspacePlugin, type WorkspaceCtx } from '@/lib/workspace.plugin';
import { canModerate, canParticipate } from '@/lib/permissions';
import { deleteMultipleObjects } from '@/lib/minio';

const attachmentBody = t.Object({
    storageKey: t.String(),
    name:       t.String(),
    mimeType:   t.String(),
    size:       t.Number(),
});

export const postRoute = new Elysia({ prefix: '/api/workspaces/:slug/posts' })
    .use(workspacePlugin)

    // .get('/', async ({ workspace, query, ...rest }: WorkspaceContext & { query: {...} }) => {

    // GET /api/workspaces/:slug/posts
    // Returns a list of posts without attachments, paginated by createdAt
    .get('/', async ({ workspace, query }) => {
        const limit = query.limit ? Math.min(parseInt(query.limit), 100) : 30;

        const commentCountsSubquery = db
            .select({
                postId: postComments.postId,
                count: sql<number>`count(*)`.as('count'),
            })
            .from(postComments)
            .where(isNull(postComments.deletedAt))
            .groupBy(postComments.postId)
            .as('comment_counts');

        const postResults = await db
            .select({
                id:             posts.id,
                userId:         posts.userId,
                userName:       users.name,
                userAvatarUrl:  users.avatarUrl,
                content:        posts.content,
                pinned:         posts.pinned,
                createdAt:      posts.createdAt,
                updatedAt:      posts.updatedAt,
                commentCounts:  sql<number>`coalesce(${commentCountsSubquery}.count, 0)`,
            })
            .from(posts)
            .leftJoin(users, eq(users.id, posts.userId))
            .leftJoin(commentCountsSubquery, eq(commentCountsSubquery.postId, posts.id))
            .where(
                and(
                    eq(posts.workspaceId, workspace.id),
                    isNull(posts.deletedAt),
                    query.cursor
                        ? lt(posts.createdAt, new Date(query.cursor))
                        : undefined,
                )
            )
            .orderBy(desc(posts.pinned), desc(posts.createdAt))
            .limit(limit);

        const postIds = postResults.map((post) => post.id);


        const attachmentResults = 
            postIds.length > 0
                ? await db
                    .select()
                    .from(postAttachments)
                    .where(sql`${postAttachments.postId} = ANY(${postIds})`)
                : [];

        const attachmentsByPostId = attachmentResults.reduce<Record<string, typeof attachmentResults>>((acc, attachment) => {
                if (!acc[attachment.postId]) {
                    acc[attachment.postId] = [];
                }
                acc[attachment.postId]!.push(attachment);
                return acc;
            }, {});

        return postResults.map((post) => ({
            ...post,
            attachments: attachmentsByPostId[post.id] || [],
        }));


    }, {
        query: t.Object({
            limit: t.Optional(t.String()),
            cursor: t.Optional(t.String()),
        }),
    })

    // POST /api/workspaces/:slug/posts
    // Creates a new post
    .post('/', async ({ user, workspace, role, body, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to create posts' });
        }

        const [post] = await db
            .insert(posts)
            .values({
                workspaceId: workspace.id,
                userId: user.id,
                content: body.content,
                pinned: body.pinned || false,
            })
            .returning()
        
        if (body.attachments && body.attachments.length > 0 && post) {
            await db
                .insert(postAttachments)
                .values(body.attachments.map((attachment: any) => ({
                    postId:     post.id,
                    storageKey: attachment.storageKey,
                    name:       attachment.name,
                    mimeType:   attachment.mimeType,
                    size:       attachment.size,
                })));
        }

        return post;
    }, {
        body: t.Object({
            content:        t.String({ minLength: 1 }),
            pinned:         t.Optional(t.Boolean()),
            attachments:    t.Optional(t.Array(attachmentBody, { maxItems: 5 })),
        }),
    })

    // PUT /api/workspaces/:slug/posts/:id
    // Updates a post
    .put('/:id', async ({ user, workspace, role, params, body, status }) => {
        const [post] = await db
            .select()
            .from(posts)
            .where(
                and(
                    eq(posts.id, params.id),
                    eq(posts.workspaceId, workspace.id),
                    isNull(posts.deletedAt),
                )
            )
            .limit(1);

        if (!post) {
            return status(404, { message: 'Post not found' });
        }

        if (!canModerate(role) && post.userId !== user.id) {
            return status(403, { message: 'Forbidden - you do not have permission to update posts' });
        }

        const [updatedPost] = await db
            .update(posts)
            .set({
                content:    body.content ?? post.content,
                pinned:     body.pinned  ?? post.pinned,
                updatedAt:  new Date(),
            })
            .where(eq(posts.id, params.id))
            .returning();

        return updatedPost;
    }, {
        params: t.Object({
            id: t.String(),
        }),
        body: t.Object({
            content:        t.Optional(t.String({ minLength: 1 })),
            pinned:         t.Optional(t.Boolean()),
        }),
    })

    // DELETE /api/workspaces/:slug/posts/:id
    .delete('/:id', async ({ user, workspace, role, params, status }) => {
        const [post] = await db
            .select()
            .from(posts)
            .where(
                and(
                    eq(posts.id, params.id),
                    eq(posts.workspaceId, workspace.id),
                    isNull(posts.deletedAt),
                )
            )
            .limit(1);

        if (!post) {
            return status(404, { message: 'Post not found' });
        }

        if (!canModerate(role) && post.userId !== user.id) {
            return status(403, { message: 'Forbidden - you do not have permission to delete posts' });
        }

        const attachments = await db
            .select()
            .from(postAttachments)
            .where(eq(postAttachments.postId, post.id));

        await deleteMultipleObjects(attachments.map((attachment) => attachment.storageKey));

        await db
            .delete(postAttachments)
            .where(eq(postAttachments.postId, post.id));
        await db
            .update(posts)
            .set({
                deletedAt:  new Date(),
            })
            .where(eq(posts.id, params.id));

        return status(204, { message: 'Post deleted' });
    }, {
        params: t.Object({
            id: t.String(),
        }),
    })

    // GET /api/workspaces/:slug/posts/:id/comments
    .get('/:id/comments', async ({ workspace, params, status }) => {
        const [post] = await db
            .select({ id: posts.id })
            .from(posts)
            .where(
                and(
                    eq(posts.id, params.id),
                    eq(posts.workspaceId, workspace.id),
                    isNull(posts.deletedAt),
                )
            )
            .limit(1);

        if (!post) {
            return status(404, { message: 'Post not found' });
        }

        return db
            .select({
                id:             postComments.id,
                content:        postComments.content,
                createdAt:      postComments.createdAt,
                updatedAt:      postComments.updatedAt,
                userId:         postComments.userId,
                userName:       users.name,
                userAvatarUrl:  users.avatarUrl,
            })
            .from(postComments)
            .leftJoin(users, eq(postComments.userId, users.id))
            .where(
                and(
                    eq(postComments.postId, post.id),
                    isNull(postComments.deletedAt),
                )
            )
            .orderBy(desc(postComments.createdAt));
    }, {
        params: t.Object({
            slug: t.String(),
            id: t.String(),
        }),
    })

    // POST /api/workspaces/:slug/posts/:id/comments
    .post('/:id/comments', async ({ user, workspace, role, params, body, status }) => {
        if (!canParticipate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to create comments' });
        }

        const [post] = await db
            .select({ id: posts.id })
            .from(posts)
            .where(
                and(
                    eq(posts.id, params.id),
                    eq(posts.workspaceId, workspace.id),
                    isNull(posts.deletedAt),
                )
            )
            .limit(1);

        if (!post) {
            return status(404, { message: 'Post not found' });
        }

        const [comment] = await db
            .insert(postComments)
            .values({
                postId:     post.id,
                userId:     user.id,
                content:    body.content,
            })
            .returning();

        return comment;
    }, {
        params: t.Object({
            slug: t.String(),
            id: t.String(),
        }),
        body: t.Object({
            content: t.String({ minLength: 1 }),
        }),
    })

    // DELETE /api/workspaces/:slug/posts/:id/comments/:commentId
    .delete('/:id/comments/:commentId', async ({ user, role, params, status }) => {
        const [comment] = await db
            .select()
            .from(postComments)
            .where(
                and(
                    eq(postComments.id, params.commentId),
                    eq(postComments.postId, params.id),
                    isNull(postComments.deletedAt),
                )
            )
            .limit(1);

        if (!comment) {
            return status(404, { message: 'Comment not found' });
        }

        if (!canModerate(role) && comment.userId !== user.id) {
            return status(403, { message: 'Forbidden - you do not have permission to delete this comment' });
        }

        await db
            .update(postComments)
            .set({
                deletedAt:  new Date(),
            })
            .where(eq(postComments.id, params.commentId));

        return status(204, { message: 'Comment deleted' });
    }, {
        params: t.Object({
            slug:      t.String(),
            id:        t.String(),
            commentId: t.String(),
        }),
    });