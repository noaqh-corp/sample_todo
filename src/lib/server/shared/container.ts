import type { TodoRepository } from "./port/TodoRepository";
import { TodoRepositoryPrisma } from "../adapter/repository/TodoRepository";

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

  static clear(): void {
    Container.instances.clear();
  }

  static override<T>(key: string, instance: T): void {
    Container.instances.set(key, instance);
  }
}

export default Container;

