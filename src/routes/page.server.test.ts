import { beforeEach, describe, expect, it } from "vitest";
import { isActionFailure } from "@sveltejs/kit";
import { actions, load } from "./+page.server";
import Container from "$lib/server/container";
import { TodoRepositoryMock } from "$lib/server/adapter/repository/mock/TodoRepository.mock";

function event(fields: Record<string, string | Blob>, userId: string | null = "owner"): Parameters<typeof load>[0] {
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

  it.each([false, true])("タイトルを正規化して保存し、完了状態 %s と所有者を維持する", async (completed) => {
    // Arrange
    await actions.create(event({ title: "編集前" }));
    const id = (await load(event({}))).todos[0].id;
    await actions.toggle(event({ id, completed: String(completed) }));
    const before = (await load(event({}))).todos[0];

    // Act: 余計なフィールドを混入してもタイトル以外の更新には使わない。
    const result = await actions.rename(event({
      id, title: " \t　編集 後　\n ", userId: "other", completed: String(!completed),
    }));

    // Assert
    expect(result).toEqual({ success: true });
    expect((await load(event({}))).todos[0]).toMatchObject({
      id, title: "編集 後", completed, userId: "owner", createdAt: before.createdAt,
    });
    expect((await load(event({}, "other"))).todos).toEqual([]);
  });

  it("空文字・空白・欠落・非文字列のタイトルや不正IDを拒否し、元のTodoを維持する", async () => {
    // Arrange
    await actions.create(event({ title: "元のタイトル" }));
    const before = (await load(event({}))).todos[0];
    const invalidFields: Record<string, string | Blob>[] = [
      { id: before.id, title: "" },
      { id: before.id, title: " \t\n　" },
      { id: before.id },
      { id: before.id, title: new Blob(["ファイルはタイトルにしない"]) },
      { title: "更新" },
      { id: "", title: "更新" },
    ];

    for (const fields of invalidFields) {
      // Act / Assert
      const result = await actions.rename(event(fields));
      expect(isActionFailure(result) && result.status).toBe(400);
      expect((await load(event({}))).todos).toEqual([before]);
    }
  });

  it("他人のTodoと不存在の編集は同じ404で拒否し、userIdの偽装を採用しない", async () => {
    // Arrange
    await actions.create(event({ title: "所有者のタイトル" }));
    const before = (await load(event({}))).todos[0];

    for (const id of [before.id, "missing"]) {
      // Act / Assert
      const result = await actions.rename(event({ id, title: "改変", userId: "owner" }, "other"));
      expect(isActionFailure(result) && result.status).toBe(404);
      expect((await load(event({}))).todos).toEqual([before]);
    }
    const missing = await actions.rename(event({ id: "missing", title: "更新" }));
    expect(isActionFailure(missing) && missing.status).toBe(404);
  });
});
