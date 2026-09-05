import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import Container from "$lib/server/container";
import { TodoCreateSchema, TodoSchema } from "$lib/server/generated/zod/models/Todo.schema";

const createSchema = TodoCreateSchema.pick({ title: true }).extend({
  title: TodoCreateSchema.shape.title.trim().min(1, "タイトルは必須です"),
});
const idSchema = TodoSchema.pick({ id: true }).extend({
  id: TodoSchema.shape.id.min(1, "IDは必須です"),
});
const completionSchema = idSchema.extend({ completed: z.enum(["true", "false"]) });

export const load = (async ({ locals }) => {
  if (!locals.session) return { todos: [] };
  const todos = await Container.getTodoRepository().search(
    { userId: locals.session.userId },
    { orderBy: { createdAt: "desc", id: "desc" } },
  );
  return { todos };
}) satisfies PageServerLoad;

export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.session) return fail(401, { error: "ログインが必要です" });
    const parsed = createSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: "タイトルは必須です" });
    await Container.getTodoRepository().create({
      userId: locals.session.userId,
      title: parsed.data.title,
      completed: false,
    });
    return { success: true };
  },
  toggle: async ({ request, locals }) => {
    if (!locals.session) return fail(401, { error: "ログインが必要です" });
    const parsed = completionSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: "IDと完了状態を指定してください" });
    const updated = await Container.getTodoRepository().update(
      { id: parsed.data.id, userId: locals.session.userId },
      { completed: parsed.data.completed === "true" },
    );
    if (!updated) return fail(404, { error: "Todoが見つかりません" });
    return { success: true };
  },
  delete: async ({ request, locals }) => {
    if (!locals.session) return fail(401, { error: "ログインが必要です" });
    const parsed = idSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: "IDは必須です" });
    const deleted = await Container.getTodoRepository().delete({
      id: parsed.data.id,
      userId: locals.session.userId,
    });
    if (!deleted) return fail(404, { error: "Todoが見つかりません" });
    return { success: true };
  },
} satisfies Actions;
