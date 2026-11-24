import { PrismaClient } from "@prisma/client";
import type { TagRepository } from "../../shared/port/TagRepository";
import type { Tag } from "../../features/tag/types";

const prisma = new PrismaClient();

export class TagRepositoryPrisma implements TagRepository {
	async findByName(userId: string, name: string): Promise<Tag | null> {
		const tag = await prisma.tag.findFirst({
			where: { userId, name },
		});
		return tag ? this.mapToDomain(tag) : null;
	}

	async create(userId: string, name: string): Promise<Tag> {
		const tag = await prisma.tag.create({
			data: { userId, name },
		});
		return this.mapToDomain(tag);
	}

	async attach(todoId: string, tagId: string): Promise<void> {
		await prisma.todoTag.create({
			data: { todoId, tagId },
		});
	}

	async detach(todoId: string, tagId: string): Promise<void> {
		await prisma.todoTag.deleteMany({
			where: { todoId, tagId },
		});
	}

	async listByTodoIds(
		todoIds: string[],
		userId: string
	): Promise<{ todoId: string; tag: Tag }[]> {
		if (todoIds.length === 0) {
			return [];
		}
		const rows = await prisma.todoTag.findMany({
			where: {
				todoId: { in: todoIds },
				tag: { userId },
			},
			include: { tag: true },
			orderBy: { createdAt: "asc" },
		});
		return rows.map((row) => ({
			todoId: row.todoId,
			tag: this.mapToDomain(row.tag),
		}));
	}

	async delete(id: string, userId: string): Promise<void> {
		await prisma.tag.delete({
			where: { id, userId },
		});
	}

	private mapToDomain(tag: {
		id: string;
		userId: string;
		name: string;
		createdAt: Date;
		updatedAt: Date;
	}): Tag {
		return {
			id: tag.id,
			userId: tag.userId,
			name: tag.name,
			createdAt: tag.createdAt,
			updatedAt: tag.updatedAt,
		};
	}
}
