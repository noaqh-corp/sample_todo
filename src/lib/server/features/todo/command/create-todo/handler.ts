import Container from "../../../../shared/container";
import type { Todo } from "../../types";

export async function createTodo(
  userId: string,
  title: string
): Promise<Todo> {
  if (!title || title.trim() === "") {
    throw new Error("タイトルは必須です");
  }

  const repository = Container.getTodoRepository();
  return await repository.create(userId, title.trim());
}

