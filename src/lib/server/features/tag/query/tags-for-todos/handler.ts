import Container from "../../../../shared/container";
import type { Tag } from "../../types";

/** 指定したTodoに付与されたタグを取得する */
export async function getTagsForTodos(
userId: string,
todoIds: string[]
): Promise<Record<string, Tag[]>> {
if (!userId || todoIds.length === 0) {
return {};
}

const repository = Container.getTagRepository();
const relations = await repository.listByTodoIds(todoIds, userId);

const result: Record<string, Tag[]> = {};
for (const { todoId, tag } of relations) {
(result[todoId] ??= []).push(tag);
}
return result;
}
