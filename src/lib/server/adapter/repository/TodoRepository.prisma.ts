import type { PrismaClient } from "@prisma/client";
import type { TodoRepository } from "../../port/repository/TodoRepository";
import type { Todo } from "../../features/task-management/types";

export class TodoRepositoryPrisma implements TodoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Pick<Todo, "userId" | "title" | "completed">): Promise<Todo> {
    return this.prisma.todo.create({ data });
  }

  async find(where: { id: string; userId: string }): Promise<Todo | null> {
    return this.prisma.todo.findFirst({ where });
  }

  async search(
    where: { userId: string },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { createdAt: "asc" | "desc"; id: "asc" | "desc" };
    },
  ): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy === undefined
        ? undefined
        : [{ createdAt: options.orderBy.createdAt }, { id: options.orderBy.id }],
    });
  }

  async update(
    where: { id: string; userId: string },
    data: Partial<Pick<Todo, "title" | "completed">>,
  ): Promise<boolean> {
    const result = await this.prisma.todo.updateMany({ where, data });
    return result.count > 0;
  }

  async delete(where: { id: string; userId: string }): Promise<boolean> {
    const result = await this.prisma.todo.deleteMany({ where });
    return result.count > 0;
  }
}
