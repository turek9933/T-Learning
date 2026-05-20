import { Elysia, t } from 'elysia';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { users, workspaces, workspaceMembers } from '@/db/schema';
import { authRoute } from '@/routes/auth.route';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export async function getUserRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    const [membership] = await db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.userId, userId),
                eq(workspaceMembers.workspaceId, workspaceId)
            )
        )
        .limit(1);

    return membership?.role ?? null;
}

export const workspaceRoute = new Elysia({ prefix: '/api/workspaces' })
    .use(authRoute)

    // GET /api/workspaces/:slug
    // Returns the workspace with the given slug and role of the current user
    .get('/:slug', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role) {
            return status(403, 'You are not a member of this workspace');
        }

        return { ...workspace, role };
    }, {
        auth: true
    })

    // PUT /api/workspaces/:slug
    // Updates the workspace of the given slug
    .put('/:slug', async ({ user, params: { slug }, body, status }) => {
        if (body && body.price) {
            if (body.price < 0) {
                return status(400, 'Price must be greater than 0');
            }
            const decimals = body.price.toString().split('.')[1] || '';
            if (decimals.length > 2) {
                return status(400, 'Price must have at most 2 decimal places');
            }
        }
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role || 
            (role !== 'owner' && role !== 'admin')) {
            return status(403, 'You are not allowed to update this workspace');
        }

        const [updatedWorkspace] = await db
            .update(workspaces)
            .set({
                name:        body.name,
                logo:        body.logo,
                description: body.description,
                price:       body.price?.toString(),
                metadata:    body.metadata,
                updatedAt:   new Date(),
            })
            .where(eq(workspaces.id, workspace.id))
            .returning( {
                id:          workspaces.id,
                name:        workspaces.name,
                slug:        workspaces.slug,
                logo:        workspaces.logo,
                type:        workspaces.type,
                description: workspaces.description,
                status:      workspaces.status,
                metadata:    workspaces.metadata,
                createdAt:   workspaces.createdAt,
                updatedAt:   workspaces.updatedAt,
            })

        return updatedWorkspace;
    }, {
        auth: true,
        body: t.Object({
            name:        t.Optional(t.String()),
            logo:        t.Optional(t.String()),
            description: t.Optional(t.String()),
            price:       t.Optional(t.Number({ minimum: 0, errorMessage: 'Price must be a valid number' })),
            metadata:    t.Optional(t.String()),
        }),
    })

    // PUT /api/workspaces/:slug/status
    // Updates the status of the workspace of the given slug
    .put('/:slug/status', async ({ user, params: { slug }, body, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id, status: workspaces.status })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role || 
            (role !== 'owner' && role !== 'admin')) {
            return status(403, 'You are not allowed to update status of this workspace');
        }

        const rightChanges: Record<string, string> = {
            draft:    'active',
            active:   'archived',
            archived: 'active',
        };
        
        const allowed = rightChanges[workspace.status] === body.status;

        if (!allowed) {
            return status(400, `Cannot change status to from ${workspace.status} to ${body.status}`);
        }

        const [updatedWorkspace] = await db
            .update(workspaces)
            .set({
                status: body.status,
                updatedAt: new Date(),
            })
            .where(eq(workspaces.id, workspace.id))
            .returning({
                id:          workspaces.id,
                status:      workspaces.status,
                updatedAt:   workspaces.updatedAt,
            });

        return updatedWorkspace;

    }, {
        auth: true,
        body: t.Object({
            status: t.Union([
                t.Literal('draft'),
                t.Literal('active'),
                t.Literal('archived'),
            ], { errorMessage: 'Invalid status' }),
        }),
    })

    // DELETE /api/workspaces/:slug
    // Deletes the workspace of the given slug
    .delete('/:slug', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role || role !== 'owner' ) {
            return status(403, 'You are not allowed to delete this workspace');
        }

        await db
            .delete(workspaces)
            .where(eq(workspaces.id, workspace.id));

        return {
            success: true,
            status: 200, 
            message: 'Workspace deleted'
        };
    }, {
        auth: true,
    })

    // GET /api/workspaces/:slug/members
    // Returns the members of the workspace with the given slug
    .get('/:slug/members', async ({ user, params: { slug }, status }) => {
        const [workspace] = await db
            .select({ id: workspaces.id })
            .from(workspaces)
            .where(eq(workspaces.slug, slug))
            .limit(1);

        if (!workspace) {
            return status(404, 'Workspace not found');
        }

        const role = await getUserRole(user.id, workspace.id);

        if (!role) {
            return status(403, 'You are not a member of this workspace');
        }

        const members = await db
            .select({
                userId: users.id,
                name:   users.name,
                email:  users.email,
                avatarUrl: users.avatarUrl,
                memberId: workspaceMembers.id,
                role:   workspaceMembers.role,
                hasPaid: workspaceMembers.hasPaid,
                expiresAt: workspaceMembers.expiresAt,
                createdAt: workspaceMembers.createdAt,
            })
            .from(workspaceMembers)
            .innerJoin(
                users,
                eq(workspaceMembers.userId, users.id),
            )
            .where(eq(workspaceMembers.workspaceId, workspace.id));

        return members;
    }, {
        auth: true
    });