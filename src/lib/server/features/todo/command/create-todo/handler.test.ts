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
});

