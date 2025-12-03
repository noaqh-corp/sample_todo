import type { Todo } from "../../features/todo/types";

export interface TodoRepository {
  create(userId: string, title: string, categoryId?: string): Promise<Todo>;
  search(
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
  }>;
  get(id: string, userId: string): Promise<Todo | null>;
  update(
    id: string,
    userId: string,
    data: Partial<Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt" | "category">>
  ): Promise<Todo>;
  delete(id: string, userId: string): Promise<void>;
}

