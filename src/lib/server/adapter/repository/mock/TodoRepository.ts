import type { TodoRepository } from "../../../shared/port/TodoRepository";
import type { Todo } from "../../../features/todo/types";

export class TodoRepositoryMock implements TodoRepository {
  private todos: Todo[] = [];

  async create(userId: string, title: string, dueDate?: Date): Promise<Todo> {
    const todo: Todo = {
      id: `todo-${Date.now()}-${Math.random()}`,
      userId,
      title,
      completed: false,
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.todos.push(todo);
    return todo;
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
    const userTodos = this.todos.filter((todo) => todo.userId === userId);
    const sortedTodos = userTodos.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const pageSize = limit ?? sortedTodos.length;
    const page = offset ? Math.floor(offset / pageSize) + 1 : 1;
    const items = sortedTodos.slice(offset ?? 0, (offset ?? 0) + (limit ?? sortedTodos.length));

    return {
      items,
      total: sortedTodos.length,
      page,
      pageSize,
    };
  }

  async get(id: string, userId: string): Promise<Todo | null> {
    const todo = this.todos.find(
      (t) => t.id === id && t.userId === userId
    );
    return todo ?? null;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Todo> {
    const index = this.todos.findIndex(
      (t) => t.id === id && t.userId === userId
    );
    if (index === -1) {
      throw new Error("Todo not found");
    }

    const updated: Todo = {
      ...this.todos[index],
      ...data,
      updatedAt: new Date(),
    };
    this.todos[index] = updated;
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.todos.findIndex(
      (t) => t.id === id && t.userId === userId
    );
    if (index === -1) {
      throw new Error("Todo not found");
    }
    this.todos.splice(index, 1);
  }

  clear(): void {
    this.todos = [];
  }
}

