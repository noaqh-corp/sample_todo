import { beforeEach, describe, expect, it } from "vitest";
import { isActionFailure } from "@sveltejs/kit";
import { actions, load } from "./+page.server";
import Container from "$lib/server/container";
import { TodoRepositoryMock } from "$lib/server/adapter/repository/mock/TodoRepository.mock";

function event(fields: Record<string, string>, userId: string | null = "owner"): Parameters<typeof load>[0] {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return {
    request: new Request("http://localhost/", { method: "POST", body: form }),
    locals: {
      session: userId === null ? null : { id: "session", userId, token: "test", createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date() },
      user: null,
    },
  } as Parameters<typeof load>[0];
}

describe("Todo presenter", () => {
  beforeEach(() => {
    Container.clear();
    Container.override("TodoRepository", new TodoRepositoryMock());
  });

  it("未ログインでは変更できず、一覧は空", async () => {
    for (const action of Object.values(actions)) {
      const result = await action(event({}, null));
      expect(isActionFailure(result) && result.status).toBe(401);
    }
    expect(await load(event({}, null))).toEqual({ todos: [] });
  });

  it("タイトルを境界で検証・正規化し、フォームの userId は採用しない", async () => {
    expect(await actions.create(event({ title: "  計画を書く  ", userId: "other" }))).toEqual({ success: true });
    const result = await load(event({}));
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0]).toMatchObject({ title: "計画を書く", userId: "owner", completed: false });
    const invalid = await actions.create(event({ title: "  " }));
    expect(isActionFailure(invalid) && invalid.status).toBe(400);
    expect((await load(event({}))).todos).toHaveLength(1);
  });

  it("同じ完了状態の再送で反転せず、未完了への変更・削除ができる", async () => {
    await actions.create(event({ title: "Todo" }));
    const id = (await load(event({}))).todos[0].id;
    await actions.toggle(event({ id, completed: "true" }));
    await actions.toggle(event({ id, completed: "true" }));
    expect((await load(event({}))).todos[0].completed).toBe(true);
    await actions.toggle(event({ id, completed: "false" }));
    expect((await load(event({}))).todos[0].completed).toBe(false);
    expect(await actions.delete(event({ id }))).toEqual({ success: true });
    expect((await load(event({}))).todos).toEqual([]);
  });

  it("他人の Todo も存在しない Todo も 404、所有者のデータは維持", async () => {
    await actions.create(event({ title: "所有者のTodo" }));
    const id = (await load(event({}))).todos[0].id;
    for (const targetId of [id, "missing"]) {
      const changed = await actions.toggle(event({ id: targetId, completed: "true" }, "other"));
      const deleted = await actions.delete(event({ id: targetId }, "other"));
      expect(isActionFailure(changed) && changed.status).toBe(404);
      expect(isActionFailure(deleted) && deleted.status).toBe(404);
    }
    expect((await load(event({}, "other"))).todos).toEqual([]);
    expect((await load(event({}))).todos[0].completed).toBe(false);
  });

  it("不正な完了値を保存しない", async () => {
    const result = await actions.toggle(event({ id: "todo", completed: "yes" }));
    expect(isActionFailure(result) && result.status).toBe(400);
  });
});
