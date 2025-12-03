import type { Category } from "../../features/todo/types";

export interface CategoryRepository {
  create(userId: string, name: string, color: string): Promise<Category>;
  search(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<{
    items: Category[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  get(id: string, userId: string): Promise<Category | null>;
  update(
    id: string,
    userId: string,
    data: Partial<Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Category>;
  delete(id: string, userId: string): Promise<void>;
  countTodosByCategory(id: string, userId: string): Promise<number>;
}
