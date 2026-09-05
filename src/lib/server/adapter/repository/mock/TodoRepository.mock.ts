import type { TodoRepository } from "../../../port/repository/TodoRepository";
import type { Todo } from "../../../features/task-management/types";

export class TodoRepositoryMock implements TodoRepository {
  private todos: Todo[] = [];

  async create(data: Pick<Todo, "userId" | "title" | "completed">): Promise<Todo> {
    const todo: Todo = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.todos.push(todo);
    return structuredClone(todo);
  }

  async find(where: { id: string; userId: string }): Promise<Todo | null> {
    const todo = this.todos.find((item) => item.id === where.id && item.userId === where.userId);
    return todo === undefined ? null : structuredClone(todo);
  }

  async search(
    where: { userId: string },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { createdAt: "asc" | "desc"; id: "asc" | "desc" };
    },
  ): Promise<Todo[]> {
    const todos = this.todos.filter((todo) => todo.userId === where.userId);
    const orderBy = options?.orderBy;
    if (orderBy !== undefined) {
      todos.sort((a, b) => {
        const byDate = a.createdAt.getTime() - b.createdAt.getTime();
        if (byDate !== 0) return orderBy.createdAt === "asc" ? byDate : -byDate;
        const byId = a.id.localeCompare(b.id);
        return orderBy.id === "asc" ? byId : -byId;
      });
    }
    const start = options?.offset === undefined ? 0 : options.offset;
    const end = options?.limit === undefined ? undefined : start + options.limit;
    return structuredClone(todos.slice(start, end));
  }

  async update(
    where: { id: string; userId: string },
    data: Partial<Pick<Todo, "title" | "completed">>,
  ): Promise<boolean> {
    const todo = this.todos.find((item) => item.id === where.id && item.userId === where.userId);
    if (todo === undefined) return false;
    Object.assign(todo, data, { updatedAt: new Date() });
    return true;
  }

  async delete(where: { id: string; userId: string }): Promise<boolean> {
    const index = this.todos.findIndex((item) => item.id === where.id && item.userId === where.userId);
    if (index === -1) return false;
    this.todos.splice(index, 1);
    return true;
  }
}
