import { Elysia, t } from 'elysia';
import { and, or, ilike, ne, eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { authRoute } from '@/routes/auth.route';
import { getAvatarPublicUrl, getAvatarPresignedPutUrl } from '@/lib/minio';

export const userRoute = new Elysia({ prefix: '/api/users' })
    .use(authRoute)

    // GET /api/user/search?q=
    // Search for users by name or email
    // Returns max 10 results
    .get('/search', async ({ user, query }) => {
        const q = query.q?.trim();

        // % is a wildcard
        const pattern = `%${q}%`;
        const results = await db
            .select({
                id:        users.id,
                name:      users.name,
                email:     users.email,
                avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(
                and(
                    // Exclude current user
                    ne(users.id, user.id),
                    or(
                        ilike(users.name, pattern),
                        ilike(users.email, pattern),
                    ),
                )
            )
            .limit(10);
        return results;
    }, {
        // Only authenticated users can search, query must be at least 2 characters
        auth: true,
        query: t.Object({
            q: t.String({
                minLength: 2,
                error: 'Query must be at least 2 characters',
            }),
        }),
    })

    // GET /api/users/email-available?email=
    // Checks if an email address is not already registered
    .get('/email-available', async ({ query }) => {
        const email = query.email.toLowerCase().trim();
        const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return { available: existing.length === 0 };
    }, {
        auth: true,
        query: t.Object({
            email: t.String({ minLength: 3 }),
        }),
    })

    // PATCH /api/users/me
    // Update name
    .patch('/me', async ({ user, body }) => {
        await db
            .update(users)
            .set({ name: body.name })
            .where(eq(users.id, user.id));
        return { success: true };
    }, {
        auth: true,
        body: t.Object({
            name: t.String({ minLength: 1, maxLength: 100 }),
        }),
    })

    // POST /api/users/me/avatar/upload-url
    // Returns a pair of
    // - presigned PUT URL for direct upload to MinIO
    // - permanent public URL
    .post('/me/avatar/upload-url', async ({ user }) => {
        const uploadUrl = await getAvatarPresignedPutUrl(user.id);
        const publicUrl = `${getAvatarPublicUrl(user.id)}?t=${Date.now()}`;
        return { uploadUrl, publicUrl };
    }, {
        auth: true,
    })

    // PATCH /api/users/me/avatar
    // After direct upload to MinIO,
    // call this to update avatarUrl with the permanent public URL
    .patch('/me/avatar', async ({ user, body }) => {
        await db
            .update(users)
            .set({ avatarUrl: body.publicUrl })
            .where(eq(users.id, user.id));
        return { success: true };
    }, {
        auth: true,
        body: t.Object({
            publicUrl: t.String(),
        }),
    });