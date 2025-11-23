import Container from "../../../../shared/container";
import type { Todo } from "../../types";

export async function updateTodoDueDate(
  id: string,
  userId: string,
  dueDate?: Date
): Promise<Todo> {
  const repository = Container.getTodoRepository();
  const todo = await repository.get(id, userId);

  if (!todo) {
    throw new Error("Todoが見つかりません");
  }

  return await repository.update(id, userId, {
    dueDate,
  });
}

