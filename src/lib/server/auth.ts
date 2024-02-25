import { Lucia } from "lucia";
import { db, drizzle_adapter } from "./db";
import * as schema from "./schema";
import { dev } from "$app/environment";

export const lucia = new Lucia(drizzle_adapter, {
  sessionCookie: {
    attributes: { secure: !dev }
  },
  getUserAttributes: (attributes : DatabaseUserAttributes) => {
    return {
      username: attributes.username
    }
  }
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  username: string;
}
