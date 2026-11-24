import type { TodoRepository } from "./port/TodoRepository";
import type { TagRepository } from "./port/TagRepository";
import { TodoRepositoryPrisma } from "../adapter/repository/TodoRepository";
import { TagRepositoryPrisma } from "../adapter/repository/TagRepository";

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

  static getTagRepository(): TagRepository {
    const key = "TagRepository";
    if (!Container.instances.has(key)) {
      const instance = new TagRepositoryPrisma();
      Container.instances.set(key, instance);
    }
    return Container.instances.get(key) as TagRepository;
  }

  static clear(): void {
    Container.instances.clear();
  }

  static override<T>(key: string, instance: T): void {
    Container.instances.set(key, instance);
  }
}

export default Container;
