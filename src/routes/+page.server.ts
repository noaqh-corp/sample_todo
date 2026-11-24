import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/auth';
import { createTodo } from '$lib/server/features/todo/command/create-todo/handler';
import { listTodos } from '$lib/server/features/todo/query/list-todos/handler';
import { toggleTodo } from '$lib/server/features/todo/command/toggle-todo/handler';
import { deleteTodo } from '$lib/server/features/todo/command/delete-todo/handler';
import { fail } from '@sveltejs/kit';
import { attachTag } from '$lib/server/features/tag/command/attach-tag/handler';
import { removeTag } from '$lib/server/features/tag/command/remove-tag/handler';
import { getTagsForTodos } from '$lib/server/features/tag/query/tags-for-todos/handler';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session || null;
	
	// sessionにuserを追加
	if (session?.userId) {
		const user = await prisma.user.findUnique({
			where: { id: session.userId },
			select: {
				id: true,
				email: true,
				name: true,
				image: true,
			},
		});
		
		const todos = await listTodos(session.userId);
		const tagsByTodo = await getTagsForTodos(
			session.userId,
			todos.map((t) => t.id)
		);

		return {
			session: user ? { ...session, user } : session,
			todos,
			tagsByTodo,
		};
	}
	
	return {
		session,
		todos: [],
		tagsByTodo: {},
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString() ?? '';

		if (!title || title.trim() === '') {
			return fail(400, { error: 'タイトルは必須です' });
		}

		try {
			await createTodo(session.userId, title);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Todoの作成に失敗しました',
			});
		}
	},
	toggle: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';

		if (!id || id.trim() === '') {
			return fail(400, { error: 'IDは必須です' });
		}

		try {
			await toggleTodo(id, session.userId);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Todoの更新に失敗しました',
			});
		}
	},
	delete: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';

		if (!id || id.trim() === '') {
			return fail(400, { error: 'IDは必須です' });
		}

		try {
			await deleteTodo(id, session.userId);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Todoの削除に失敗しました',
			});
		}
	},

	attachTag: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const todoId = formData.get('todoId')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';

		if (!todoId || todoId.trim() === '') {
			return fail(400, { error: 'TodoIDは必須です' });
		}

		try {
			await attachTag(session.userId, todoId, name);
			return { success: true };
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'タグの付与に失敗しました',
			});
		}
	},

	removeTag: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const todoId = formData.get('todoId')?.toString() ?? '';
		const tagId = formData.get('tagId')?.toString() ?? '';

		if (!todoId || !tagId) {
			return fail(400, { error: 'IDは必須です' });
		}

		try {
			await removeTag(session.userId, todoId, tagId);
			return { success: true };
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'タグの削除に失敗しました',
			});
		}
	},
};
