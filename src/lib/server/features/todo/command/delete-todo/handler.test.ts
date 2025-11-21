import { describe, it, expect, beforeEach } from "vitest";
import { deleteTodo } from "./handler";
import Container from "../../../../shared/container";
import { TodoRepositoryMock } from "../../../../adapter/repository/mock/TodoRepository";

describe("deleteTodo", () => {
  beforeEach(() => {
    Container.clear();
  });

  it("ログイン中のユーザーのTodoを削除できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "テストTodo");

    await deleteTodo(todo.id, "user-1");

    const retrieved = await repository.get(todo.id, "user-1");
    expect(retrieved).toBeNull();
  });

  it("他のユーザーのTodoは削除できない", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "ユーザー1のTodo");

    await expect(deleteTodo(todo.id, "user-2")).rejects.toThrow();
  });

  it("存在しないTodoの場合はエラーがthrowされる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    await expect(deleteTodo("non-existent-id", "user-1")).rejects.toThrow();
  });
});

