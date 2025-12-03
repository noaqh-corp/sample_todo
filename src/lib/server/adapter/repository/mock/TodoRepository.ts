import type { TodoRepository } from "../../../shared/port/TodoRepository";
import type { Todo, Category } from "../../../features/todo/types";

export class TodoRepositoryMock implements TodoRepository {
  private todos: Todo[] = [];
  private categories: Map<string, Category> = new Map();
  private counter = 0;

  async create(
    userId: string,
    title: string,
    categoryId?: string
  ): Promise<Todo> {
    const category = categoryId ? this.categories.get(categoryId) : null;
    const now = new Date();
    // Add counter to ensure unique timestamps for sorting
    now.setMilliseconds(now.getMilliseconds() + this.counter++);
    const todo: Todo = {
      id: `todo-${Date.now()}-${Math.random()}`,
      userId,
      title,
      completed: false,
      categoryId: categoryId ?? null,
      category: category ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.push(todo);
    return todo;
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
    let userTodos = this.todos.filter((todo) => todo.userId === userId);

    if (categoryId !== undefined) {
      userTodos = userTodos.filter((todo) => todo.categoryId === categoryId);
    }

    const sortedTodos = userTodos.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const pageSize = limit ?? sortedTodos.length;
    const page = offset ? Math.floor(offset / pageSize) + 1 : 1;
    const items = sortedTodos.slice(
      offset ?? 0,
      (offset ?? 0) + (limit ?? sortedTodos.length)
    );

    return {
      items,
      total: sortedTodos.length,
      page,
      pageSize,
    };
  }

  async get(id: string, userId: string): Promise<Todo | null> {
    const todo = this.todos.find((t) => t.id === id && t.userId === userId);
    return todo ?? null;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<
      Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt" | "category">
    >
  ): Promise<Todo> {
    const index = this.todos.findIndex(
      (t) => t.id === id && t.userId === userId
    );
    if (index === -1) {
      throw new Error("Todo not found");
    }

    const categoryId = data.categoryId ?? this.todos[index].categoryId;
    const category = categoryId ? this.categories.get(categoryId) : null;

    const updated: Todo = {
      ...this.todos[index],
      ...data,
      category: category ?? null,
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

  setCategory(category: Category): void {
    this.categories.set(category.id, category);
  }

  clear(): void {
    this.todos = [];
    this.categories.clear();
    this.counter = 0;
  }
}

