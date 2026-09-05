import { building } from "$app/environment";
import { auth } from "$lib/server/providers/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  if (building) return resolve(event);
  if (event.url.pathname.startsWith("/api/auth/")) return auth.handler(event.request);
  const response = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = response?.session ?? null;
  event.locals.user = response?.user ?? null;
  return resolve(event);
};
