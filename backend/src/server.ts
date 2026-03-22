import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoute } from '@/routes/auth.route';
import { workspaceRoute } from '@/routes/workspace.route';
import { env } from './config/env';
import { userRoute } from './routes/user.route';

export const app = new Elysia()
    .use(cors({
            origin: env.corsOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization'],
    }))
    .use(authRoute)
    .use(workspaceRoute)
    .use(userRoute)
    .listen(env.port);