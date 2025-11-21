import type { Todo } from "../../features/todo/types";

export interface TodoRepository {
  create(userId: string, title: string): Promise<Todo>;
  search(
    userId: string,
    limit?: number,
    offset?: number
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
    data: Partial<Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Todo>;
  delete(id: string, userId: string): Promise<void>;
}

