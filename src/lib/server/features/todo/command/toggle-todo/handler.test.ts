import { describe, it, expect, beforeEach } from "vitest";
import { toggleTodo } from "./handler";
import Container from "../../../../shared/container";
import { TodoRepositoryMock } from "../../../../adapter/repository/mock/TodoRepository";

describe("toggleTodo", () => {
  beforeEach(() => {
    Container.clear();
  });

  it("ログイン中のユーザーのTodoの完了状態を切り替えられる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "テストTodo");

    const updated = await toggleTodo(todo.id, "user-1");

    expect(updated.completed).toBe(true);

    const toggled = await toggleTodo(todo.id, "user-1");
    expect(toggled.completed).toBe(false);
  });

  it("他のユーザーのTodoは切り替えられない", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "ユーザー1のTodo");

    await expect(toggleTodo(todo.id, "user-2")).rejects.toThrow();
  });

  it("存在しないTodoの場合はエラーがthrowされる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    await expect(toggleTodo("non-existent-id", "user-1")).rejects.toThrow();
  });
});

