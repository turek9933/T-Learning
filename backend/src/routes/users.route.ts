import { Elysia, t } from 'elysia';
import { and, or, ilike, ne } from 'drizzle-orm';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { authRoute } from '@/routes/auth.route';

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
    });