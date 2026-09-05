import type { TodoRepository } from "./port/repository/TodoRepository";
import { TodoRepositoryPrisma } from "./adapter/repository/TodoRepository.prisma";
import { prisma } from "./providers/prisma";

export default class Container {
  private static todoRepository: TodoRepository | undefined;

  static getTodoRepository(): TodoRepository {
    if (Container.todoRepository === undefined) {
      Container.todoRepository = new TodoRepositoryPrisma(prisma);
    }
    return Container.todoRepository;
  }

  static override(key: "TodoRepository", instance: TodoRepository): void {
    Container.todoRepository = instance;
  }

  static clear(): void {
    Container.todoRepository = undefined;
  }
}
