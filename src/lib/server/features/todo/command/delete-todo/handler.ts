import Container from "../../../../shared/container";

export async function deleteTodo(id: string, userId: string): Promise<void> {
  const repository = Container.getTodoRepository();
  const todo = await repository.get(id, userId);

  if (!todo) {
    throw new Error("Todoが見つかりません");
  }

  await repository.delete(id, userId);
}

