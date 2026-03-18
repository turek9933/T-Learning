import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./schema.ts";
import { env } from '@/config/env.ts';

const connectionString = env.dbUrl!;
const client = postgres(connectionString);
export const db = drizzle(
    client,
    { schema },
);