import { PrismaClient } from "@prisma/client";
import type { TodoRepository } from "../../shared/port/TodoRepository";
import type { Todo } from "../../features/todo/types";

const prisma = new PrismaClient();

export class TodoRepositoryPrisma implements TodoRepository {
  async create(userId: string, title: string, dueDate?: Date): Promise<Todo> {
    const todo = await prisma.todo.create({
      data: {
        userId,
        title,
        dueDate,
      },
    });
    return this.mapToDomain(todo);
  }

  async search(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{
    items: Todo[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const [items, total] = await Promise.all([
      prisma.todo.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.todo.count({
        where: { userId },
      }),
    ]);

    const pageSize = limit ?? items.length;
    const page = offset ? Math.floor(offset / pageSize) + 1 : 1;

    return {
      items: items.map((item) => this.mapToDomain(item)),
      total,
      page,
      pageSize,
    };
  }

  async get(id: string, userId: string): Promise<Todo | null> {
    const todo = await prisma.todo.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!todo) {
      return null;
    }

    return this.mapToDomain(todo);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Todo> {
    const todo = await prisma.todo.update({
      where: {
        id,
        userId,
      },
      data,
    });

    return this.mapToDomain(todo);
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.todo.delete({
      where: {
        id,
        userId,
      },
    });
  }

  private mapToDomain(todo: {
    id: string;
    userId: string;
    title: string;
    completed: boolean;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Todo {
    return {
      id: todo.id,
      userId: todo.userId,
      title: todo.title,
      completed: todo.completed,
      dueDate: todo.dueDate ?? undefined,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }
}

