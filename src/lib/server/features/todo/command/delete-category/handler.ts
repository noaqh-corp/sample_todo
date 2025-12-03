import Container from "../../../../shared/container";

export async function deleteCategory(
  id: string,
  userId: string
): Promise<void> {
  if (!id) {
    throw new Error("カテゴリIDは必須です");
  }

  const repository = Container.getCategoryRepository();
  const existing = await repository.get(id, userId);

  if (!existing) {
    throw new Error("カテゴリが見つかりません");
  }

  const todoCount = await repository.countTodosByCategory(id, userId);
  if (todoCount > 0) {
    throw new Error(
      "このカテゴリにはTodoが存在するため削除できません。先にTodoを別のカテゴリに移動するか削除してください。"
    );
  }

  await repository.delete(id, userId);
}
