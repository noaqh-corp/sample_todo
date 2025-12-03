import { PrismaClient } from "@prisma/client";
import type { CategoryRepository } from "../../shared/port/CategoryRepository";
import type { Category } from "../../features/todo/types";

const prisma = new PrismaClient();

export class CategoryRepositoryPrisma implements CategoryRepository {
  async create(userId: string, name: string, color: string): Promise<Category> {
    const category = await prisma.category.create({
      data: {
        userId,
        name,
        color,
      },
    });
    return this.mapToDomain(category);
  }

  async search(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{
    items: Category[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.count({
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

  async get(id: string, userId: string): Promise<Category | null> {
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      return null;
    }

    return this.mapToDomain(category);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Category> {
    const category = await prisma.category.update({
      where: {
        id,
        userId,
      },
      data,
    });

    return this.mapToDomain(category);
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.category.delete({
      where: {
        id,
        userId,
      },
    });
  }

  async countTodosByCategory(id: string, userId: string): Promise<number> {
    return prisma.todo.count({
      where: {
        categoryId: id,
        userId,
      },
    });
  }

  private mapToDomain(category: {
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
