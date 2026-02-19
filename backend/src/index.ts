import { Elysia } from 'elysia'
import { auth } from '@/auth/config'

const app = new Elysia()
    .all('/api/auth/*', async ({request}) => {
        return auth.handler(request);
    })
    .listen(process.env.PORT!);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
