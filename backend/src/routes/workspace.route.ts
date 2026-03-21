import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { workspaces, workspaceMembers } from '@/db/schema';
import { authRoute } from '@/routes/auth.route';

export const workspaceRoute = new Elysia({ prefix: '/api/workspaces' })
    .use(authRoute)
    .get('/me', async ({ user }) => {
        const rows = await db
            .select({
                id:          workspaces.id,
                name:        workspaces.name,
                slug:        workspaces.slug,
                logo:        workspaces.logo,
                type:        workspaces.type,
                description: workspaces.description,
                status:      workspaces.status,
                metadata:    workspaces.metadata,
                createdAt:   workspaces.createdAt,
                role:        workspaceMembers.role,
                hasPaid:     workspaceMembers.hasPaid,
                expiresAt:   workspaceMembers.expiresAt,
            })
            .from(workspaceMembers)
            .innerJoin(
                workspaces,
                eq(workspaceMembers.workspaceId, workspaces.id),
            )
            .where(eq(workspaceMembers.userId, user.id));

        return rows;
    }, {
        auth: true
    }
);