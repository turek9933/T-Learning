import { Elysia, t } from 'elysia';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import {
    homeworks,
    homeworkAttachments,
    homeworkSubmissions,
    submissionAttachments,
    users,
} from '@/db/schema';
import { workspacePlugin } from '@/lib/workspace.plugin';
import { deleteMultipleObjects } from '@/lib/minio';
import { canModerate, canParticipate } from '@/lib/permissions';

const attachmentBody = t.Object({
    storageKey: t.String(),
    name:       t.String(),
    mimeType:   t.String(),
    size:       t.Number(),
});

export const homeworkRoute = new Elysia({ prefix: '/api/workspaces/:slug/homeworks' })
    .use(workspacePlugin)

    // GET /api/workspaces/:slug/homeworks
    // Members and viewer can see all homeworks
    .get('/', async ({ user, workspace }) => {
        const submissionStatusSubquery = db
            .select({
                homeworkId:  homeworkSubmissions.homeworkId,
                submittedAt: homeworkSubmissions.submittedAt,
            })
            .from(homeworkSubmissions)
            .where(eq(homeworkSubmissions.userId, user.id))
            .as('my_submission');

        return db
            .select({
                id:           homeworks.id,
                title:        homeworks.title,
                description:  homeworks.description,
                dueAt:        homeworks.dueAt,
                createdAt:    homeworks.createdAt,
                userId:       homeworks.userId,
                userName:     users.name,
                submittedAt:  submissionStatusSubquery.submittedAt,
            })
            .from(homeworks)
            .leftJoin(users, eq(users.id, homeworks.userId))
            .leftJoin(submissionStatusSubquery, eq(submissionStatusSubquery.homeworkId, homeworks.id))
            .where(eq(homeworks.workspaceId, workspace.id))
            .orderBy(homeworks.dueAt);
    })

    // GET /api/workspaces/:slug/homeworks/:id
    // Returns a single homework with attachments
    .get('/:id', async ({ workspace, params, status }) => {
        const [homeworkResult] = await db
            .select()
            .from(homeworks)
            .where(
                and(
                    eq(homeworks.id, params.id),
                    eq(homeworks.workspaceId, workspace.id)
                )
            )
            .limit(1);

        if (!homeworkResult) return status(404, { message: 'Homework not found' });

        const attachments = await db
            .select()
            .from(homeworkAttachments)
            .where(eq(homeworkAttachments.homeworkId, params.id));

        return { ...homeworkResult, attachments };
    })

    // POST /api/workspaces/:slug/homeworks
    .post('/', async ({ user, workspace, role, body, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Only owner or admin can create homeworks' });
        }

        const [homeworkResult] = await db
            .insert(homeworks)
            .values({
                workspaceId: workspace.id,
                userId:      user.id,
                title:       body.title,
                description: body.description,
                dueAt:       body.dueAt ? new Date(body.dueAt) : null,
            })
            .returning();

        if (!homeworkResult) return status(500, { message: 'Failed to create homework' });

        if (body.attachments && body.attachments.length > 0) {
            await db.insert(homeworkAttachments).values(
                body.attachments.map(a => ({
                    homeworkId: homeworkResult.id,
                    storageKey: a.storageKey,
                    name:       a.name,
                    mimeType:   a.mimeType,
                    size:       a.size,
                }))
            );
        }

        return homeworkResult;
    }, {
        body: t.Object({
            title:       t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
            dueAt:       t.Optional(t.String()),
            attachments: t.Optional(t.Array(attachmentBody, { maxItems: 10 })),
        }),
    })

    // PATCH /api/workspaces/:slug/homeworks/:id
    .patch('/:id', async ({ workspace, role, params, body, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Only owner or admin can edit homeworks' });
        }

        const [homeworkResult] = await db
            .select()
            .from(homeworks)
            .where(
                and(
                    eq(homeworks.id, params.id),
                    eq(homeworks.workspaceId, workspace.id)
                )
            )
            .limit(1);

        if (!homeworkResult) return status(404, { message: 'Homework not found' });

        const [updated] = await db
            .update(homeworks)
            .set({
                title:       body.title       ?? homeworkResult.title,
                description: body.description ?? homeworkResult.description,
                dueAt:       body.dueAt       ? new Date(body.dueAt) : homeworkResult.dueAt,
                updatedAt:   new Date(),
            })
            .where(eq(homeworks.id, params.id))
            .returning();

        return updated;
    }, {
        body: t.Object({
            title:       t.Optional(t.String({ minLength: 1 })),
            description: t.Optional(t.String()),
            dueAt:       t.Optional(t.String()),
        }),
    })

    // DELETE /api/workspaces/:slug/homeworks/:id
    // Deletes a single homework with all submissions and attachments
    .delete('/:id', async ({ workspace, role, params, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Only owner or admin can delete homeworks' });
        }

        const [homeworkResult] = await db
            .select({ id: homeworks.id })
            .from(homeworks)
            .where(
                and(
                    eq(homeworks.id, params.id),
                    eq(homeworks.workspaceId, workspace.id)
                )
            )
            .limit(1);

        if (!homeworkResult) return status(404, { message: 'Homework not found' });

        const [homeworkResultKeys, submissionKeys] = await Promise.all([
            db.select({ storageKey: homeworkAttachments.storageKey })
              .from(homeworkAttachments)
              .where(eq(homeworkAttachments.homeworkId, params.id)),

            db.select({ storageKey: submissionAttachments.storageKey })
              .from(submissionAttachments)
              .innerJoin(
                  homeworkSubmissions,
                  eq(homeworkSubmissions.id, submissionAttachments.submissionId)
              )
              .where(eq(homeworkSubmissions.homeworkId, params.id)),
        ]);

        await deleteMultipleObjects([
            ...homeworkResultKeys.map(k => k.storageKey),
            ...submissionKeys.map(k => k.storageKey),
        ]);

        // ON DELETE CASCADE in schema deletes submissions and attachments
        await db
            .delete(homeworks)
            .where(eq(homeworks.id, params.id));

        return status(200, { message: 'Homework deleted' });
    })

    // GET /api/workspaces/:slug/homeworks/:id/submissions
    // Owner/admin can see all submissions with member details
    // Member can see their own submissions
    // Viewer cannot see submissions
    .get('/:id/submissions', async ({ user, workspace, role, params, status }) => {
        if (!canParticipate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to view submissions' });
        }

        const [homeworkResult] = await db
            .select({ id: homeworks.id })
            .from(homeworks)
            .where(
                and(
                    eq(homeworks.id, params.id),
                    eq(homeworks.workspaceId, workspace.id)
                )
            )
            .limit(1);

        if (!homeworkResult) return status(404, { message: 'Homework not found' });

        const baseCondition = eq(homeworkSubmissions.homeworkId, params.id);
        const condition = canModerate(role)
            ? baseCondition
            : and(baseCondition, eq(homeworkSubmissions.userId, user.id));

        const submissions = await db
            .select({
                id:           homeworkSubmissions.id,
                content:      homeworkSubmissions.content,
                submittedAt:  homeworkSubmissions.submittedAt,
                updatedAt:    homeworkSubmissions.updatedAt,
                userId:       homeworkSubmissions.userId,
                userName:     users.name,
                userAvatar:   users.avatarUrl,
            })
            .from(homeworkSubmissions)
            .leftJoin(users, eq(users.id, homeworkSubmissions.userId))
            .where(condition)
            .orderBy(homeworkSubmissions.submittedAt);

        if (submissions.length === 0) return submissions;

        const subIds = submissions.map(s => s.id);
        const submissionAttachmentResults = await db
            .select()
            .from(submissionAttachments)
            .where(sql`${submissionAttachments.submissionId} = ANY(${subIds})`);

        const attachmentsBySub = submissionAttachmentResults.reduce<Record<string, typeof submissionAttachmentResults>>((acc, attachment) => {
            if (!acc[attachment.submissionId]) acc[attachment.submissionId] = [];
            acc[attachment.submissionId]!.push(attachment);
            return acc;
        }, {});

        return submissions.map(s => ({
            ...s,
            attachments: attachmentsBySub[s.id] ?? [],
        }));
    })

    // POST /api/workspaces/:slug/homeworks/:id/submissions
    .post('/:id/submissions', async ({ user, workspace, role, params, body, status }) => {
        if (!canParticipate(role)) {
            return status(403, { message: 'Forbidden - you cannot submit homework' });
        }

        const [homeworkResult] = await db
            .select({ id: homeworks.id, dueAt: homeworks.dueAt })
            .from(homeworks)
            .where(
                and(
                    eq(homeworks.id, params.id),
                    eq(homeworks.workspaceId, workspace.id)
                )
            )
            .limit(1);

        if (!homeworkResult) return status(404, { message: 'Homework not found' });

        // Sprawdź czy praca nie jest już oddana
        const [existing] = await db
            .select({ id: homeworkSubmissions.id })
            .from(homeworkSubmissions)
            .where(
                and(
                    eq(homeworkSubmissions.homeworkId, params.id),
                    eq(homeworkSubmissions.userId, user.id),
                )
            )
            .limit(1);

        if (existing) {
            return status(409, { message: 'Homework already submitted. Use PATCH to update.' });
        }

        const [submission] = await db
            .insert(homeworkSubmissions)
            .values({
                homeworkId: params.id,
                userId:     user.id,
                content:    body.content,
            })
            .returning();

        if (!submission) {
            return status(500, { message: 'Failed to create submission' });
        }

        if (body.attachments && body.attachments.length > 0) {
            await db
                .insert(submissionAttachments)
                .values(
                    body.attachments.map(a => ({
                        submissionId: submission.id,
                        storageKey:   a.storageKey,
                        name:         a.name,
                        mimeType:     a.mimeType,
                        size:         a.size,
                    }))
                );
        }

        return submission;
    }, {
        body: t.Object({
            content:     t.Optional(t.String()),
            attachments: t.Optional(t.Array(attachmentBody, { maxItems: 5 })),
        }),
    })

    // PATCH /api/workspaces/:slug/homeworks/:id/submissions/:submissionId
    //TODO add date validation - no patches after deadline 
    .patch('/:id/submissions/:submissionId', async ({ user, params, body, status }) => {
        const [submission] = await db
            .select()
            .from(homeworkSubmissions)
            .where(
                and(
                    eq(homeworkSubmissions.id, params.submissionId),
                    eq(homeworkSubmissions.homeworkId, params.id),
                )
            )
            .limit(1);

        if (!submission) return status(404, { message: 'Submission not found' });
        if (submission.userId !== user.id) {
            return status(403, { message: 'Only the author can update this submission' });
        }

        const [updated] = await db
            .update(homeworkSubmissions)
            .set({
                content:   body.content ?? submission.content,
                updatedAt: new Date(),
            })
            .where(eq(homeworkSubmissions.id, params.submissionId))
            .returning();

        return updated;
    }, {
        body: t.Object({
            content: t.Optional(t.String()),
        }),
    })