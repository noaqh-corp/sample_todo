import { describe, it, expect, beforeEach } from "vitest";
import { TodoRepositoryPrisma } from "./TodoRepository";
import { prisma } from "../../auth";

describe("TodoRepositoryPrisma", () => {
  const repository = new TodoRepositoryPrisma();

  beforeEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  it("Todoを作成できる", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const todo = await repository.create(user.id, "テストTodo");

    expect(todo).toMatchObject({
      userId: user.id,
      title: "テストTodo",
      completed: false,
    });
    expect(todo.id).toBeDefined();
    expect(todo.createdAt).toBeInstanceOf(Date);
    expect(todo.updatedAt).toBeInstanceOf(Date);
  });

  it("期限を設定してTodoを作成できる", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const dueDate = new Date("2024-12-31");
    const todo = await repository.create(user.id, "テストTodo", dueDate);

    expect(todo.dueDate).toEqual(dueDate);
  });

  it("期限を設定せずにTodoを作成できる", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const todo = await repository.create(user.id, "テストTodo");

    expect(todo.dueDate).toBeUndefined();
  });

  it("作成したTodoに期限が正しく保存される", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const dueDate = new Date("2024-12-31");
    const created = await repository.create(user.id, "テストTodo", dueDate);
    const retrieved = await repository.get(created.id, user.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.dueDate).toEqual(dueDate);
  });

  it("ユーザーIDでTodoを検索できる", async () => {
    const user1 = await prisma.user.create({
      data: {
        email: "user1@example.com",
        emailVerified: true,
      },
    });
    const user2 = await prisma.user.create({
      data: {
        email: "user2@example.com",
        emailVerified: true,
      },
    });

    await repository.create(user1.id, "ユーザー1のTodo1");
    await repository.create(user1.id, "ユーザー1のTodo2");
    await repository.create(user2.id, "ユーザー2のTodo1");

    const result = await repository.search(user1.id);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("ユーザー1のTodo2");
    expect(result.items[1].title).toBe("ユーザー1のTodo1");
    expect(result.total).toBe(2);
  });

  it("ページネーションが正しく動作する", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    for (let i = 1; i <= 5; i++) {
      await repository.create(user.id, `Todo${i}`);
    }

    const page1 = await repository.search(user.id, 2, 0);
    expect(page1.items).toHaveLength(2);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
    expect(page1.total).toBe(5);

    const page2 = await repository.search(user.id, 2, 2);
    expect(page2.items).toHaveLength(2);
    expect(page2.page).toBe(2);
    expect(page2.pageSize).toBe(2);
    expect(page2.total).toBe(5);
  });

  it("Todoを取得できる", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const created = await repository.create(user.id, "テストTodo");
    const retrieved = await repository.get(created.id, user.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.title).toBe("テストTodo");
  });

  it("Todoを更新できる", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const created = await repository.create(user.id, "テストTodo");
    const updated = await repository.update(created.id, user.id, {
      title: "更新されたTodo",
      completed: true,
    });

    expect(updated.title).toBe("更新されたTodo");
    expect(updated.completed).toBe(true);
  });

  it("期限が設定されているTodoの期限を削除できる（undefinedを渡した場合にnullが設定される）", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const dueDate = new Date("2024-12-31");
    const created = await repository.create(user.id, "テストTodo", dueDate);
    expect(created.dueDate).toEqual(dueDate);

    const updated = await repository.update(created.id, user.id, {
      dueDate: undefined,
    });

    expect(updated.dueDate).toBeUndefined();
    
    const retrieved = await repository.get(created.id, user.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.dueDate).toBeUndefined();
  });

  it("Todoを削除できる", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        emailVerified: true,
      },
    });

    const created = await repository.create(user.id, "テストTodo");
    await repository.delete(created.id, user.id);

    const retrieved = await repository.get(created.id, user.id);
    expect(retrieved).toBeNull();
  });

  it("他のユーザーのTodoは取得できない", async () => {
    const user1 = await prisma.user.create({
      data: {
        email: "user1@example.com",
        emailVerified: true,
      },
    });
    const user2 = await prisma.user.create({
      data: {
        email: "user2@example.com",
        emailVerified: true,
      },
    });

    const todo1 = await repository.create(user1.id, "ユーザー1のTodo");
    const retrieved = await repository.get(todo1.id, user2.id);

    expect(retrieved).toBeNull();
  });
});

