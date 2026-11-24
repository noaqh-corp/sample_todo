import type { Tag } from "../../features/tag/types";

export interface TagRepository {
	findByName(userId: string, name: string): Promise<Tag | null>;
	create(userId: string, name: string): Promise<Tag>;
	attach(todoId: string, tagId: string): Promise<void>;
	detach(todoId: string, tagId: string): Promise<void>;
	listByTodoIds(
		todoIds: string[],
		userId: string
	): Promise<{ todoId: string; tag: Tag }[]>;
	delete(id: string, userId: string): Promise<void>;
}
