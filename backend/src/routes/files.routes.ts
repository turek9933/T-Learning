import { Elysia, t } from 'elysia';
import { auth } from '@/auth/config';
import { db } from '@/db/index';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { conversations } from '@/db/schema';
import {
    storageKeys,
    getPresignedGetUrl,
    getPresignedPutUrl,
    deleteObject,
} from '@/lib/minio';
import { getUserRole } from '@/routes/workspaces.route';

const MAX_SIZE = {
    post:       10 * 1024 * 1024,// 10 MB
    homework:   20 * 1024 * 1024,// 20 MB
    submission: 20 * 1024 * 1024,// 20 MB
    material:   50 * 1024 * 1024,// 50 MB
    chat:       10 * 1024 * 1024,// 10 MB
} as const;

type UploadContext = keyof typeof MAX_SIZE;


function isOwnerOrAdmin(role: string) {
    return role === 'owner' || role === 'admin';
}

export const fileRoute = new Elysia({ prefix: '/api/files' })
    .derive(async ({ status, request: { headers } }) => {
        const session = await auth.api.getSession({ headers });
        if (!session) {
            return status(401, { message: 'Unauthorized' });
        }
        return { user: session.user }
    })

    // POST /api/files/upload-url
    // 1: Frontend asks for presigned PUT URL.
    // 2: Frontend veryfies file size and type, after that sends file directly to MinIO via presigned URL.
    // 3: Frontend puts file metadata to DB via endpoint (post/homework/material).

    // context      — where the file comes from: post | homework | submission | material | chat
    // contextId    — ID of the general context file belongs to (workspaceId or chatId)
    // secondaryId  — (if required) second ID that determines the exact context (postId, homeworkId)
    // mimeType     — file type determined by browser
    // size         — file size in bytes, validated before upload
    .post('/upload-url', async ({ user, body, status }) => {
        const { context, contextId, secondaryId, mimeType, size, fileName } = body;

        if (size > MAX_SIZE[context as UploadContext]) {
            return status(413, {
                message: `File exceeds maximum size ${MAX_SIZE[context as UploadContext] / 1024 / 1024} MB for context: ${context}`,
            });
        }

        const fileId = randomUUID();
        let storageKey: string;

        // Generates storage key based on context
        // contextId nad secondaryId depend on context
        switch (context) {
            case 'post':
                // contextId = workspaceId, secondaryId = postId
                if (!secondaryId) return status(400, { message: 'secondaryId (postId) is required' });
                storageKey = storageKeys.postAttachment(contextId, secondaryId, fileId);
                break;

            case 'homework':
                // contextId = workspaceId, secondaryId = homeworkId
                if (!secondaryId) return status(400, { message: 'secondaryId (homeworkId) is required' });
                storageKey = storageKeys.homeworkAttachment(contextId, secondaryId, fileId);
                break;

            case 'submission':
                // contextId = workspaceId, secondaryId = homeworkId
                if (!secondaryId) return status(400, { message: 'secondaryId (homeworkId) is required' });
                storageKey = storageKeys.submissionAttachment(contextId, secondaryId, user.id, fileId);
                break;

            case 'material':
                // contextId = workspaceId
                storageKey = storageKeys.material(contextId, fileId);
                break;

            case 'chat':
                // contextId = conversationId
                storageKey = storageKeys.chatAttachment(contextId, fileId);
                break;

            default:
                return status(400, { message: 'Invalid context for uploaded file' });
        }

        const uploadUrl = await getPresignedPutUrl(storageKey);

        return {
            uploadUrl,
            storageKey,
            fileId,
            maxSize: MAX_SIZE[context as UploadContext],
        };
    }, {
        body: t.Object({
            context:     t.Union([
                t.Literal('post'),
                t.Literal('homework'),
                t.Literal('submission'),
                t.Literal('material'),
                t.Literal('chat'),
            ]),
            contextId:   t.String(),
            secondaryId: t.Optional(t.String()),
            mimeType:    t.String(),
            size:        t.Number(),
            fileName:    t.String(),
        }),
    })

    // GET /api/files/view?key={storageKey}
    // Returns presigned GET URL for a file view.
    // Verifies user permissions.
    .get('/view', async ({ user, query, status }) => {
        // storageKey is passed as a query param encoded by encodeURIComponent, because it may contain slashes.
        const storageKey = decodeURIComponent(query.key);

        const authorized = await checkReadPermission(user.id, storageKey);
        if (!authorized) {
            return status(403, { message: 'No permission to view this file' });
        }

        const url = await getPresignedGetUrl(storageKey);
        return { url };
    }, {
        query: t.Object({
            key: t.String(),
        }),
    })

    // GET /api/files/max-size
    .get('/max-size', async ({ query, status }) => {
        const context = query.context;
        if (!context) return status(400, { message: 'context is required' });
        return { maxSize: MAX_SIZE[context as UploadContext] };
    }, {
        query: t.Object({
            context: t.Union([
                t.Literal('post'),
                t.Literal('homework'),
                t.Literal('submission'),
                t.Literal('material'),
                t.Literal('chat'),
            ]),
        }),
    })
    .get('/max-size', async ({ status }) => {
        return MAX_SIZE;
    })

    // DELETE /api/files
    // Deletes a file from MinIO and file metadata from DB.
    .delete('/', async ({ user, body, status }) => {
        const { storageKey } = body;

        const authorized = await checkWritePermission(user.id, storageKey);
        if (!authorized) {
            return status(403, { message: 'No permission to delete this file' });
        }

        await deleteObject(storageKey);
        
        return status(200, { message: 'File deleted' });
    }, {
        body: t.Object({
            storageKey: t.String(),
        }),
    })


// MinIO keys:
//   workspaces/{workspaceId}/posts/{postId}/{fileId}
//   workspaces/{workspaceId}/homeworks/{homeworkId}/attachments/{fileId}
//   workspaces/{workspaceId}/homeworks/{homeworkId}/submissions/{userId}/{fileId}
//   workspaces/{workspaceId}/materials/{fileId}
//   conversations/{conversationId}/{fileId}
//
// Premissions depends on context and user role

async function checkReadPermission(userId: string, storageKey: string): Promise<boolean> {
    const parts = storageKey.split('/');

    if (parts[0] === 'workspaces') {
        const workspaceId = parts[1];
        if (!workspaceId) return false;
        const membershipRole = await getUserRole(userId, workspaceId);
        if (!membershipRole) return false;

        // submission_attachments — only owner or admin or member who has submitted
        if (parts[2] === 'homeworks' && parts[4] === 'submissions') {
            const submissionUserId = parts[5];
            return submissionUserId === userId || isOwnerOrAdmin(membershipRole);
        }

        // Rest — every person in workspace
        return true;
    }

    if (parts[0] === 'conversations') {
        const conversationId = parts[1];
        if (!conversationId) return false;

        const [conv] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, conversationId))
            .limit(1);

        if (!conv) return false;
        return conv.participantAId === userId || conv.participantBId === userId;
    }

    return false;
}

async function checkWritePermission(userId: string, storageKey: string): Promise<boolean> {
    const parts = storageKey.split('/');

    if (parts[0] === 'workspaces') {
        const workspaceId = parts[1];
        if (!workspaceId) return false;
        const membership = await getUserRole(userId, workspaceId);
        if (!membership) return false;

        // submission — only homework submission owner
        if (parts[2] === 'homeworks' && parts[4] === 'submissions') {
            const submissionUserId = parts[5];
            return submissionUserId === userId;
        }

        // Rest — owner/admin
        return isOwnerOrAdmin(membership);
    }

    if (parts[0] === 'conversations') {
        const conversationId = parts[1];
        if (!conversationId) return false;
        const [conv] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, conversationId))
            .limit(1);

        if (!conv) return false;
        return conv.participantAId === userId || conv.participantBId === userId;
    }

    return false;
}