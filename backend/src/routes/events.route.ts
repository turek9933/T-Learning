import { Elysia, t } from 'elysia';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '@/db/index';
import { events, users } from '@/db/schema';
import { workspacePlugin } from '@/lib/workspace.plugin';
import { canModerate } from '@/lib/permissions';

// Formats date to iCal: YYYYMMDDTHHmmssZ
function toICalDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Escapes special characters
function icalEscape(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;

    const chunks: string[] = [];
    let start = 0;
    while (start < line.length) {
        const chunk = start === 0 ? line.slice(start, 75) : ' ' + line.slice(start, start + 74);
        chunks.push(chunk);
        start += start === 0 ? 75 : 74;
    }
    return chunks.join('\r\n');
}

function generateICalEvent(event: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startsAt: Date;
    endsAt: Date | null;
    createdAt: Date;
}): string {
    const now = toICalDate(new Date());
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//T-Learning//T-Learning 1.0//PL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${event.id}@t-lerning.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${toICalDate(event.startsAt)}`,
        event.endsAt
            ? `DTEND:${toICalDate(event.endsAt)}`
            : `DTEND:${toICalDate(event.startsAt)}`,
        foldLine(`SUMMARY:${icalEscape(event.title)}`),
        event.description
            ? foldLine(`DESCRIPTION:${icalEscape(event.description)}`)
            : null,
        event.location
            ? foldLine(`LOCATION:${icalEscape(event.location)}`)
            : null,
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean) as string[];

    return lines.join('\r\n');
}

const eventTypes = ['meeting', 'deadline', 'exam'];

const eventBody = t.Object({
    type:        t.Union(eventTypes.map(e => t.Literal(e))),
    title:       t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
    location:    t.Optional(t.String()),
    startsAt:    t.String(),// ISO string
    endsAt:      t.Optional(t.String()),
});

export const eventRoute = new Elysia({ prefix: '/api/workspaces/:slug/events' })
    .use(workspacePlugin)

    // GET /api/workspaces/:slug/events
    // Optional filters: ?from=ISO&to=ISO
    .get('/', async ({ workspace, query }) => {
        const conditions = [eq(events.workspaceId, workspace.id)];

        if (query.from) conditions.push(gte(events.startsAt, new Date(query.from)));
        if (query.to)   conditions.push(lte(events.startsAt, new Date(query.to)));

        return db
            .select({
                id:           events.id,
                type:         events.type,
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
            .where(and(...conditions))
            .orderBy(events.startsAt);
    }, {
        query: t.Object({
            from: t.Optional(t.String()),
            to:   t.Optional(t.String()),
        }),
    })

    // POST /api/workspaces/:slug/events
    .post('/', async ({ user, workspace, role, body, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to create events' });
        }

        const [event] = await db
            .insert(events)
            .values({
                workspaceId: workspace.id,
                userId:      user.id,
                type:        body.type,
                title:       body.title,
                description: body.description,
                location:    body.location,
                startsAt:    new Date(body.startsAt),
                endsAt:      body.endsAt ? new Date(body.endsAt) : null,
            })
            .returning();

        return event;
    }, { 
        body: eventBody
    })

    // PATCH /api/workspaces/:slug/events/:id
    .patch('/:id', async ({ workspace, role, params, body, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to edit events' });
        }

        const [event] = await db
            .select()
            .from(events)
            .where(and(eq(events.id, params.id), eq(events.workspaceId, workspace.id)))
            .limit(1);

        if (!event) return status(404, { message: 'Event not found' });

        const [updated] = await db
            .update(events)
            .set({
                type:        body.type        ?? event.type,
                title:       body.title       ?? event.title,
                description: body.description ?? event.description,
                location:    body.location    ?? event.location,
                startsAt:    body.startsAt    ? new Date(body.startsAt) : event.startsAt,
                endsAt:      body.endsAt      ? new Date(body.endsAt)   : event.endsAt,
                updatedAt:   new Date(),
            })
            .where(eq(events.id, params.id))
            .returning();

        return updated;
    }, {
        body: t.Object({
            type:        t.Optional(t.Union(eventTypes.map(e => t.Literal(e)))),
            title:       t.Optional(t.String({ minLength: 1 })),
            description: t.Optional(t.String()),
            location:    t.Optional(t.String()),
            startsAt:    t.Optional(t.String()),
            endsAt:      t.Optional(t.String()),
        }),
    })

    // DELETE /api/workspaces/:slug/events/:id
    .delete('/:id', async ({ workspace, role, params, status }) => {
        if (!canModerate(role)) {
            return status(403, { message: 'Forbidden - you do not have permission to delete events' });
        }

        const deleted = await db
            .delete(events)
            .where(and(eq(events.id, params.id), eq(events.workspaceId, workspace.id)))
            .returning({ id: events.id });

        if (deleted.length === 0) return status(404, { message: 'Event not found' });

        return status(204, { message: 'Event deleted' });
    })

    // GET /api/workspaces/:slug/events/:id/ical
    // Return .ics file to download
    .get('/:id/ical', async ({ workspace, params, status, set }) => {
        const [event] = await db
            .select()
            .from(events)
            .where(
                and(
                    eq(events.id, params.id),
                    eq(events.workspaceId, workspace.id)
                )
            )
            .limit(1);

        if (!event) return status(404, { message: 'Event not found' });

        const ical = generateICalEvent(event);

        set.headers['Content-Type'] = 'text/calendar; charset=utf-8';
        set.headers['Content-Disposition'] = `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}.ics"`;

        return ical;
    })