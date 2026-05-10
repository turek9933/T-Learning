import Elysia from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "@/auth/config";
import { db } from "@/db";
import { workspaces, users } from "@/db/schema";
import { getUserRole, type WorkspaceRole } from "@/routes/workspaces.route";


// Returns user + workspace + role for every request
// Requires :slug in path
export const workspacePlugin = new Elysia({ name: 'workspacePlugin' })
    .derive({ as: 'scoped'}, async ({ request: { headers }, params }) => {
        const session = await auth.api.getSession({ headers });
console.info('workspacePlugin: session.user', session?.user);
        const slug = params?.slug as string | undefined;

        let workspace: typeof workspaces.$inferSelect | null = null;
        let role: WorkspaceRole | null = null;
        if (session && slug) {
            const [workspaceResult] = await db
                .select()
                .from(workspaces)
                .where(eq(workspaces.slug, slug))
                .limit(1)

            workspace = workspaceResult ?? null;
console.info('workspacePlugin: workspace', workspace);
            if (workspace) {
                role = await getUserRole(session.user.id, workspace.id);
console.info('workspacePlugin: role', role);
            }
        }

        return {
            wCtx: {
                user: session?.user ?? null,
                workspace,
                role
            }
        }
    })
    .onBeforeHandle({ as: 'scoped' }, async ({ wCtx, status }) => {
        if (!wCtx.user || wCtx.user === null)              return status(401, { message: 'Unauthorized' });
        if (!wCtx.workspace || wCtx.workspace === null)    return status(404, { message: 'Workspace not found' });
        if (!wCtx.role || wCtx.role === null)              return status(403, { message: 'Forbidden - not a workspace member' });
    })
    .resolve({ as: 'scoped' }, ({ wCtx }) => ({
        user: wCtx.user as typeof users.$inferSelect,
        workspace: wCtx.workspace as typeof workspaces.$inferSelect,
        role: wCtx.role as WorkspaceRole
    })
)

export interface WorkspaceCtx {
    user: { id: string; name: string; email: string, avatarUrl: string | null };
    workspace: typeof workspaces.$inferSelect;
    role: WorkspaceRole;
}