import { describe, it, expect, beforeEach } from "vitest";
import { TodoRepositoryMock } from "./TodoRepository";

describe("TodoRepositoryMock", () => {
  const repository = new TodoRepositoryMock();

  beforeEach(() => {
    repository.clear();
  });

  it("Todoを作成できる", async () => {
    const todo = await repository.create("user-1", "テストTodo");

    expect(todo).toMatchObject({
      userId: "user-1",
      title: "テストTodo",
      completed: false,
    });
    expect(todo.id).toBeDefined();
    expect(todo.createdAt).toBeInstanceOf(Date);
    expect(todo.updatedAt).toBeInstanceOf(Date);
  });

  it("ユーザーIDでTodoを検索できる", async () => {
    await repository.create("user-1", "ユーザー1のTodo1");
    await repository.create("user-1", "ユーザー1のTodo2");
    await repository.create("user-2", "ユーザー2のTodo1");

    const result = await repository.search("user-1");

    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("ユーザー1のTodo2");
    expect(result.items[1].title).toBe("ユーザー1のTodo1");
    expect(result.total).toBe(2);
  });

  it("ページネーションが正しく動作する", async () => {
    for (let i = 1; i <= 5; i++) {
      await repository.create("user-1", `Todo${i}`);
    }

    const page1 = await repository.search("user-1", 2, 0);
    expect(page1.items).toHaveLength(2);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
    expect(page1.total).toBe(5);

    const page2 = await repository.search("user-1", 2, 2);
    expect(page2.items).toHaveLength(2);
    expect(page2.page).toBe(2);
    expect(page2.pageSize).toBe(2);
    expect(page2.total).toBe(5);
  });

  it("Todoを取得できる", async () => {
    const created = await repository.create("user-1", "テストTodo");
    const retrieved = await repository.get(created.id, "user-1");

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.title).toBe("テストTodo");
  });

  it("Todoを更新できる", async () => {
    const created = await repository.create("user-1", "テストTodo");
    const updated = await repository.update(created.id, "user-1", {
      title: "更新されたTodo",
      completed: true,
    });

    expect(updated.title).toBe("更新されたTodo");
    expect(updated.completed).toBe(true);
  });

  it("Todoを削除できる", async () => {
    const created = await repository.create("user-1", "テストTodo");
    await repository.delete(created.id, "user-1");

    const retrieved = await repository.get(created.id, "user-1");
    expect(retrieved).toBeNull();
  });

  it("他のユーザーのTodoは取得できない", async () => {
    const todo1 = await repository.create("user-1", "ユーザー1のTodo");
    const retrieved = await repository.get(todo1.id, "user-2");

    expect(retrieved).toBeNull();
  });
});

