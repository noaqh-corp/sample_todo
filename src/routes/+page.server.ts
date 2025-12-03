import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/auth';
import { createTodo } from '$lib/server/features/todo/command/create-todo/handler';
import { listTodos } from '$lib/server/features/todo/query/list-todos/handler';
import { toggleTodo } from '$lib/server/features/todo/command/toggle-todo/handler';
import { deleteTodo } from '$lib/server/features/todo/command/delete-todo/handler';
import { listCategories } from '$lib/server/features/todo/query/list-categories/handler';
import { assignCategoryToTodo } from '$lib/server/features/todo/command/assign-category-to-todo/handler';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session || null;
	const categoryId = url.searchParams.get('categoryId') ?? undefined;
	
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
		
		const [todos, categories] = await Promise.all([
			listTodos(session.userId, categoryId),
			listCategories(session.userId),
		]);
		
		return {
			session: user ? { ...session, user } : session,
			todos,
			categories,
			selectedCategoryId: categoryId ?? null,
		};
	}
	
	return {
		session,
		todos: [],
		categories: [],
		selectedCategoryId: null,
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
	assignCategory: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const todoId = formData.get('todoId')?.toString() ?? '';
		const categoryIdValue = formData.get('categoryId')?.toString() ?? '';
		const categoryId = categoryIdValue === '' ? null : categoryIdValue;

		if (!todoId || todoId.trim() === '') {
			return fail(400, { error: 'TodoIDは必須です' });
		}

		try {
			await assignCategoryToTodo(todoId, session.userId, categoryId);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'カテゴリの割り当てに失敗しました',
			});
		}
	},
};

