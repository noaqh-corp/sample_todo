import { describe, it, expect, beforeEach } from "vitest";
import { listTodos } from "./handler";
import Container from "../../../../shared/container";
import { TodoRepositoryMock } from "../../../../adapter/repository/mock/TodoRepository";

describe("listTodos", () => {
  beforeEach(() => {
    Container.clear();
  });

  it("ログイン中のユーザーのTodo一覧を取得できる", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    await Container.getTodoRepository().create("user-1", "Todo1");
    await Container.getTodoRepository().create("user-1", "Todo2");

    const todos = await listTodos("user-1");

    expect(todos).toHaveLength(2);
    expect(todos[0].title).toBe("Todo2");
    expect(todos[1].title).toBe("Todo1");
  });

  it("他のユーザーのTodoは取得できない", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    await Container.getTodoRepository().create("user-1", "ユーザー1のTodo");
    await Container.getTodoRepository().create("user-2", "ユーザー2のTodo");

    const todos = await listTodos("user-1");

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe("ユーザー1のTodo");
  });

  it("ログインしていない場合は空配列を返す", async () => {
    Container.override("TodoRepository", new TodoRepositoryMock());

    const todos = await listTodos("");

    expect(todos).toHaveLength(0);
  });
});

