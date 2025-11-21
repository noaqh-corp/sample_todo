import Container from "../../../../shared/container";
import type { Todo } from "../../types";

export async function listTodos(userId: string): Promise<Todo[]> {
  if (!userId) {
    return [];
  }

  const repository = Container.getTodoRepository();
  const result = await repository.search(userId);
  return result.items;
}

