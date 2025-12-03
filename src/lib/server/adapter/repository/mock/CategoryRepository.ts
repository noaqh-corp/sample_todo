import type { CategoryRepository } from "../../../shared/port/CategoryRepository";
import type { Category } from "../../../features/todo/types";

export class CategoryRepositoryMock implements CategoryRepository {
  private categories: Category[] = [];
  private todoCountByCategory: Map<string, number> = new Map();

  async create(userId: string, name: string, color: string): Promise<Category> {
    const category: Category = {
      id: `category-${Date.now()}-${Math.random()}`,
      userId,
      name,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.push(category);
    return category;
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
    const userCategories = this.categories.filter(
      (category) => category.userId === userId
    );
    const sortedCategories = userCategories.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const pageSize = limit ?? sortedCategories.length;
    const page = offset ? Math.floor(offset / pageSize) + 1 : 1;
    const items = sortedCategories.slice(
      offset ?? 0,
      (offset ?? 0) + (limit ?? sortedCategories.length)
    );

    return {
      items,
      total: sortedCategories.length,
      page,
      pageSize,
    };
  }

  async get(id: string, userId: string): Promise<Category | null> {
    const category = this.categories.find(
      (c) => c.id === id && c.userId === userId
    );
    return category ?? null;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Category> {
    const index = this.categories.findIndex(
      (c) => c.id === id && c.userId === userId
    );
    if (index === -1) {
      throw new Error("Category not found");
    }

    const updated: Category = {
      ...this.categories[index],
      ...data,
      updatedAt: new Date(),
    };
    this.categories[index] = updated;
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.categories.findIndex(
      (c) => c.id === id && c.userId === userId
    );
    if (index === -1) {
      throw new Error("Category not found");
    }
    this.categories.splice(index, 1);
  }

  async countTodosByCategory(id: string, _userId: string): Promise<number> {
    return this.todoCountByCategory.get(id) ?? 0;
  }

  setTodoCountForCategory(categoryId: string, count: number): void {
    this.todoCountByCategory.set(categoryId, count);
  }

  clear(): void {
    this.categories = [];
    this.todoCountByCategory.clear();
  }
}
