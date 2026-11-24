import type { TagRepository } from "../../../shared/port/TagRepository";
import type { Tag } from "../../../features/tag/types";

export class TagRepositoryMock implements TagRepository {
	private tags: Tag[] = [];
	private todoTags: { todoId: string; tagId: string }[] = [];

	constructor(
		initial?: {
			tags?: Tag[];
			todoTags?: { todoId: string; tagId: string }[];
		}
	) {
		if (initial?.tags) this.tags = [...initial.tags];
		if (initial?.todoTags) this.todoTags = [...initial.todoTags];
	}

	async findByName(userId: string, name: string): Promise<Tag | null> {
		return this.tags.find((t) => t.userId === userId && t.name === name) ?? null;
	}

	async create(userId: string, name: string): Promise<Tag> {
		const tag: Tag = {
			id: `tag-${Date.now()}-${Math.random()}`,
			userId,
			name,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.tags.push(tag);
		return tag;
	}

	async attach(todoId: string, tagId: string): Promise<void> {
		if (!this.todoTags.some((r) => r.todoId === todoId && r.tagId === tagId)) {
			this.todoTags.push({ todoId, tagId });
		}
	}

	async detach(todoId: string, tagId: string): Promise<void> {
		this.todoTags = this.todoTags.filter(
			(r) => !(r.todoId === todoId && r.tagId === tagId)
		);
	}

	async listByTodoIds(
		todoIds: string[],
		userId: string
	): Promise<{ todoId: string; tag: Tag }[]> {
		const result: { todoId: string; tag: Tag }[] = [];
		for (const todoId of todoIds) {
			const relations = this.todoTags.filter((r) => r.todoId === todoId);
			for (const rel of relations) {
				const tag = this.tags.find((t) => t.id === rel.tagId && t.userId === userId);
				if (tag) {
					result.push({ todoId, tag });
				}
			}
		}
		return result;
	}

	async delete(id: string, userId: string): Promise<void> {
		this.tags = this.tags.filter((t) => !(t.id === id && t.userId === userId));
		this.todoTags = this.todoTags.filter((r) => r.tagId !== id);
	}

	clear(): void {
		this.tags = [];
		this.todoTags = [];
	}
}
