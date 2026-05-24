import { Elysia, t } from 'elysia';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { db } from '@/db/index';
import {
    workspaceMembers,
    workspaces,
    events,
    homeworks,
    homeworkSubmissions,
} from '@/db/schema';
import { authRoute } from '@/routes/auth.route';

export const meRoute = new Elysia({ prefix: '/api' })
    .use(authRoute)

    // GET /api/workspaces/me
    // Returns the current user's workspaces
    .get('/workspaces/me', async ({ user }) => {
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
    })

    // GET /api/events/me
    // Returns events from all workspaces the user is a member of
    // Optional filters: ?from=ISO&to=ISO
    .get('/events/me', async ({ user, query }) => {
        const memberOf = await db
            .select({ workspaceId: workspaceMembers.workspaceId })
            .from(workspaceMembers)
            .where(eq(workspaceMembers.userId, user.id));

        if (memberOf.length === 0) return [];

        const workspaceIds = memberOf.map(m => m.workspaceId);

        const conditions: any[] = [inArray(events.workspaceId, workspaceIds)];
        if (query.from) conditions.push(gte(events.startsAt, new Date(query.from)));
        if (query.to)   conditions.push(lte(events.startsAt, new Date(query.to)));

        return db
            .select({
                id:             events.id,
                type:           events.type,
                title:          events.title,
                description:    events.description,
                location:       events.location,
                startsAt:       events.startsAt,
                endsAt:         events.endsAt,
                workspaceId:    events.workspaceId,
                workspaceName:  workspaces.name,
                workspaceSlug:  workspaces.slug,
            })
            .from(events)
            .innerJoin(workspaces, eq(workspaces.id, events.workspaceId))
            .where(and(...conditions))
            .orderBy(events.startsAt);
    }, {
        auth: true,
        query: t.Object({
            from: t.Optional(t.String()),
            to:   t.Optional(t.String()),
        }),
    })

    // GET /api/homeworks/me
    // Returns homeworks from all workspaces the user is a member of, with submission status
    .get('/homeworks/me', async ({ user, query }) => {
        const memberOf = await db
            .select({ workspaceId: workspaceMembers.workspaceId })
            .from(workspaceMembers)
            .where(eq(workspaceMembers.userId, user.id));

        if (memberOf.length === 0) return [];

        const workspaceIds = memberOf.map(m => m.workspaceId);

        const submissionSubquery = db
            .select({
                homeworkId:  homeworkSubmissions.homeworkId,
                submittedAt: homeworkSubmissions.submittedAt,
            })
            .from(homeworkSubmissions)
            .where(eq(homeworkSubmissions.userId, user.id))
            .as('my_submission');

        const conditions: any[] = [inArray(homeworks.workspaceId, workspaceIds)];
        if (query.from) conditions.push(gte(homeworks.dueAt, new Date(query.from)));
        if (query.to)   conditions.push(lte(homeworks.dueAt, new Date(query.to)));

        return db
            .select({
                id:             homeworks.id,
                title:          homeworks.title,
                dueAt:          homeworks.dueAt,
                workspaceId:    homeworks.workspaceId,
                workspaceName:  workspaces.name,
                workspaceSlug:  workspaces.slug,
                submittedAt:    submissionSubquery.submittedAt,
            })
            .from(homeworks)
            .innerJoin(workspaces, eq(workspaces.id, homeworks.workspaceId))
            .leftJoin(submissionSubquery, eq(submissionSubquery.homeworkId, homeworks.id))
            .where(and(...conditions))
            .orderBy(homeworks.dueAt);
    }, {
        auth: true,
        query: t.Object({
            from: t.Optional(t.String()),
            to:   t.Optional(t.String()),
        }),
    });