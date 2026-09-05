import type { Todo } from "../../features/task-management/types";

export interface TodoRepository {
  create(data: Pick<Todo, "userId" | "title" | "completed">): Promise<Todo>;
  find(where: { id: string; userId: string }): Promise<Todo | null>;
  search(
    where: { userId: string },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { createdAt: "asc" | "desc"; id: "asc" | "desc" };
    },
  ): Promise<Todo[]>;
  update(
    where: { id: string; userId: string },
    data: Partial<Pick<Todo, "title" | "completed">>,
  ): Promise<boolean>;
  delete(where: { id: string; userId: string }): Promise<boolean>;
}
