import { describe, it, expect, beforeEach } from "vitest";
import { updateTodoDueDate } from "./handler";
import Container from "../../../../shared/container";
import { TodoRepositoryMock } from "../../../../adapter/repository/mock/TodoRepository";

describe("updateTodoDueDate", () => {
  beforeEach(() => {
    Container.clear();
  });

  it("既存のTodoの期限を更新できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "テストTodo", new Date("2024-01-01"));
    
    const dueDate = new Date("2024-12-31");
    const updated = await updateTodoDueDate(todo.id, "user-1", dueDate);

    expect(updated.dueDate).toEqual(dueDate);
  });

  it("期限が設定されていないTodoに期限を設定できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "テストTodo");
    
    const dueDate = new Date("2024-12-31");
    const updated = await updateTodoDueDate(todo.id, "user-1", dueDate);

    expect(updated.dueDate).toEqual(dueDate);
  });

  it("期限が設定されているTodoの期限を削除できる（undefinedを設定）", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "テストTodo", new Date("2024-01-01"));
    
    const updated = await updateTodoDueDate(todo.id, "user-1", undefined);

    expect(updated.dueDate).toBeUndefined();
  });

  it("存在しないTodoの期限を更新しようとした場合はエラーがthrowされる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const dueDate = new Date("2024-12-31");
    await expect(updateTodoDueDate("non-existent-id", "user-1", dueDate)).rejects.toThrow("Todoが見つかりません");
  });

  it("他のユーザーのTodoの期限を更新しようとした場合はエラーがthrowされる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const repository = Container.getTodoRepository();
    const todo = await repository.create("user-1", "テストTodo");
    
    const dueDate = new Date("2024-12-31");
    await expect(updateTodoDueDate(todo.id, "user-2", dueDate)).rejects.toThrow("Todoが見つかりません");
  });
});

