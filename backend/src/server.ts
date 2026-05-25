import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoute } from '@/routes/auth.route';
import { workspaceRoute } from '@/routes/workspaces.route';
import { env } from './config/env';
import { userRoute } from './routes/users.route';
import { chatRoute } from './routes/chats.route';
import { chatWs } from './ws/chat.ws';
import { fileRoute } from './routes/files.routes';
import { postRoute } from './routes/posts.route';
import { eventRoute } from './routes/events.route';
import { homeworkRoute } from './routes/homeworks.route';
import { materialRoute } from './routes/materials.route';
import { feedRoute } from './routes/feeds.route';
import { meRoute } from './routes/me.route';

export const app = new Elysia()
    .use(cors({
            origin: env.corsOrigin.split(',').map(origin => origin.trim()),
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization'],
    }))
    .use(authRoute)
    .use(workspaceRoute)
    .use(userRoute)
    .use(chatRoute)
    .use(chatWs)
    .use(fileRoute)
    .use(postRoute)
    .use(eventRoute)
    .use(homeworkRoute)
    .use(materialRoute)
    .use(feedRoute)
    .use(meRoute)
    .listen({
        hostname: env.host,
        port: env.port
    });