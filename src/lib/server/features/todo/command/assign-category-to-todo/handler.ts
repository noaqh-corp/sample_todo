import Container from "../../../../shared/container";
import type { Todo } from "../../types";

export async function assignCategoryToTodo(
  todoId: string,
  userId: string,
  categoryId: string | null
): Promise<Todo> {
  if (!todoId) {
    throw new Error("TodoIDは必須です");
  }

  const todoRepository = Container.getTodoRepository();
  const existing = await todoRepository.get(todoId, userId);

  if (!existing) {
    throw new Error("Todoが見つかりません");
  }

  if (categoryId !== null) {
    const categoryRepository = Container.getCategoryRepository();
    const category = await categoryRepository.get(categoryId, userId);
    if (!category) {
      throw new Error("カテゴリが見つかりません");
    }
  }

  return await todoRepository.update(todoId, userId, { categoryId });
}
