import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN } from "$env/static/private";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import * as schema from "./schema";

const client = createClient({
  url: TURSO_CONNECTION_URL,
  authToken: TURSO_AUTH_TOKEN
});

export const db = drizzle(client);
export const drizzle_adapter = new DrizzleSQLiteAdapter(db, schema.session, schema.user);
