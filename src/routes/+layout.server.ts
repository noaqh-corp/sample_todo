import type { LayoutServerLoad } from "./$types";

export const load = (({ locals }) => ({
  session: locals.session && locals.user
    ? {
        userId: locals.session.userId,
        user: {
          id: locals.user.id,
          email: locals.user.email,
          name: locals.user.name,
          image: locals.user.image ?? null,
        },
      }
    : null,
})) satisfies LayoutServerLoad;
