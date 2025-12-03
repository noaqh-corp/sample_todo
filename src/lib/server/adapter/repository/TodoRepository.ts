import { PrismaClient } from "@prisma/client";
import type { TodoRepository } from "../../shared/port/TodoRepository";
import type { Todo, Category } from "../../features/todo/types";

const prisma = new PrismaClient();

export class TodoRepositoryPrisma implements TodoRepository {
  async create(
    userId: string,
    title: string,
    categoryId?: string
  ): Promise<Todo> {
    const todo = await prisma.todo.create({
      data: {
        userId,
        title,
        categoryId: categoryId ?? null,
      },
      include: {
        category: true,
      },
    });
    return this.mapToDomain(todo);
  }

  async search(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      categoryId?: string;
    }
  ): Promise<{
    items: Todo[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { limit, offset, categoryId } = options ?? {};
    const where = {
      userId,
      ...(categoryId !== undefined ? { categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
        },
      }),
      prisma.todo.count({
        where,
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
      include: {
        category: true,
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
    data: Partial<
      Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt" | "category">
    >
  ): Promise<Todo> {
    const todo = await prisma.todo.update({
      where: {
        id,
        userId,
      },
      data,
      include: {
        category: true,
      },
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
    categoryId: string | null;
    category: {
      id: string;
      userId: string;
      name: string;
      color: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  }): Todo {
    return {
      id: todo.id,
      userId: todo.userId,
      title: todo.title,
      completed: todo.completed,
      categoryId: todo.categoryId,
      category: todo.category
        ? this.mapCategoryToDomain(todo.category)
        : null,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }

  private mapCategoryToDomain(category: {
    id: string;
    userId: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

