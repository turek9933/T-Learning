import { Elysia, t } from "elysia";
import { db } from "@/db";
import { materials, users } from "@/db/schema";
import { workspacePlugin } from "@/lib/workspace.plugin";
import { eq, desc, and } from "drizzle-orm";
import { canModerate } from "@/lib/permissions";
import { deleteObject } from "@/lib/minio";

export const materialRoute = new Elysia({ prefix: '/api/workspaces/:slug/materials' })
    .use(workspacePlugin)

    // GET /api/workspaces/:slug/materials
    // Returns a list of materials for all workspace members
    .get('/', async ({ workspace }) => {
        return await db
            .select({
                id:                 materials.id,
                uploaderId:         materials.uploaderId,
                uploaderName:       users.name,
                uploaderAvatarUrl:  users.avatarUrl,
                name:               materials.name,
                description:        materials.description,
                storageKey:         materials.storageKey,
                mimeType:           materials.mimeType,
                size:               materials.size,
                createdAt:          materials.createdAt,
                updatedAt:          materials.updatedAt,
            })
            .from(materials)
            .leftJoin(users, eq(materials.uploaderId, users.id))
            .where(eq(materials.workspaceId, workspace.id))
            .orderBy(desc(materials.createdAt));
    })

    // POST /api/workspaces/:slug/materials
    // Saves material metadata after upload
    .post('/', async ({ user, workspace, role, body, status }) => {
        if(!canModerate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to create materials' });
        }

        const [material] = await db
            .insert(materials)
            .values({
                workspaceId:    workspace.id,
                uploaderId:     user.id,
                name:           body.name,
                description:    body.description,
                storageKey:     body.storageKey,
                mimeType:       body.mimeType,
                size:           body.size,
            })
            .returning();

        return material;
    }, {
        body: t.Object({
            name:           t.String({ minLength: 1 }),
            description:    t.Optional(t.String()),
            storageKey:     t.String({ minLength: 1 }),
            mimeType:       t.String({ minLength: 1 }),
            size:           t.Number(),
        }),
    })

    // DELETE /api/workspaces/:slug/materials/:id
    // Deletes a material
    .delete('/:id', async ({ user, workspace, role, params, status }) => {
        if(!canModerate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to delete materials' });
        }

        const [material] = await db
            .select()
            .from(materials)
            .where(
                and(
                    eq(materials.id, params.id),
                    eq(materials.workspaceId, workspace.id),
                )
            )
            .limit(1);

        if (!material) {
            return status(404, { message: 'Material not found' });
        }

        await deleteObject(material.storageKey);

        await db
            .delete(materials)
            .where(eq(materials.id, params.id));

        return status(200, { message: 'Material deleted' });
    })