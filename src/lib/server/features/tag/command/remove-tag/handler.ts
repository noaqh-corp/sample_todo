import Container from "../../../../shared/container";

/** Todoからタグを外す */
export async function removeTag(
userId: string,
todoId: string,
tagId: string
): Promise<void> {
const repository = Container.getTagRepository();
// userIdのタグか確認するため、該当タグがユーザーのものかlistByTodoIds経由で検証
const relations = await repository.listByTodoIds([todoId], userId);
if (!relations.some((r) => r.tag.id === tagId)) {
throw new Error("タグが見つかりません");
}
await repository.detach(todoId, tagId);
}
