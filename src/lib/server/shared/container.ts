import type { TodoRepository } from "./port/TodoRepository";
import type { CategoryRepository } from "./port/CategoryRepository";
import { TodoRepositoryPrisma } from "../adapter/repository/TodoRepository";
import { CategoryRepositoryPrisma } from "../adapter/repository/CategoryRepository";

class Container {
  private static instances = new Map<string, unknown>();

  static getTodoRepository(): TodoRepository {
    const key = "TodoRepository";
    if (!Container.instances.has(key)) {
      const instance = new TodoRepositoryPrisma();
      Container.instances.set(key, instance);
    }
    return Container.instances.get(key) as TodoRepository;
  }

  static getCategoryRepository(): CategoryRepository {
    const key = "CategoryRepository";
    if (!Container.instances.has(key)) {
      const instance = new CategoryRepositoryPrisma();
      Container.instances.set(key, instance);
    }
    return Container.instances.get(key) as CategoryRepository;
  }

  static clear(): void {
    Container.instances.clear();
  }

  static override<T>(key: string, instance: T): void {
    Container.instances.set(key, instance);
  }
}

export default Container;

