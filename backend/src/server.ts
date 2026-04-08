import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoute } from '@/routes/auth.route';
import { workspaceRoute } from '@/routes/workspaces.route';
import { env } from './config/env';
import { userRoute } from './routes/users.route';

export const app = new Elysia()
    .use(cors({
            origin: env.corsOrigin.split(',').map(origin => origin.trim()),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization'],
    }))
    .use(authRoute)
    .use(workspaceRoute)
    .use(userRoute)
    .listen({
        hostname: '0.0.0.0',
        port: env.port
    });
