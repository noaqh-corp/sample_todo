import { describe, it, expect, beforeEach } from "vitest";
import { createTodo } from "./handler";
import Container from "../../../../shared/container";
import { TodoRepositoryMock } from "../../../../adapter/repository/mock/TodoRepository";

describe("createTodo", () => {
  beforeEach(() => {
    Container.clear();
  });

  it("ログイン中のユーザーのTodoを作成できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const todo = await createTodo("user-1", "テストTodo");

    expect(todo).toMatchObject({
      userId: "user-1",
      title: "テストTodo",
      completed: false,
    });
    expect(todo.id).toBeDefined();
  });

  it("タイトルが空の場合はエラーがthrowされる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    await expect(createTodo("user-1", "")).rejects.toThrow();
  });

  it("期限を設定してTodoを作成できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const dueDate = new Date("2024-12-31");
    const todo = await createTodo("user-1", "テストTodo", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("期限を設定せずにTodoを作成できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const todo = await createTodo("user-1", "テストTodo");

    expect(todo.dueDate).toBeUndefined();
  });

  it("期限が正しく保存される", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const dueDate = new Date("2024-12-31");
    const todo = await createTodo("user-1", "テストTodo", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
    expect(todo.title).toBe("テストTodo");
  });
});

