import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./schema.ts";
import { env } from '@/config/env.ts';

const connectionString = env.databaseUrl!;
const client = postgres(connectionString);
export const db = drizzle(
    client,
    { schema },
);