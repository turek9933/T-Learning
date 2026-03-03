import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoute } from '@/routes/auth.route';
import { env } from './config/env';

export const app = new Elysia()
    .use(cors({
            origin: env.corsOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization'],
    }))
    .use(authRoute)
    .listen(env.port);