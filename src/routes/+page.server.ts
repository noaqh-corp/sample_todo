import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/auth';
import { createTodo } from '$lib/server/features/todo/command/create-todo/handler';
import { listTodos } from '$lib/server/features/todo/query/list-todos/handler';
import { toggleTodo } from '$lib/server/features/todo/command/toggle-todo/handler';
import { deleteTodo } from '$lib/server/features/todo/command/delete-todo/handler';
import { updateTodoDueDate } from '$lib/server/features/todo/command/update-todo-due-date/handler';
import { fail } from '@sveltejs/kit';

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
		
		return {
			session: user ? { ...session, user } : session,
			todos,
		};
	}
	
	return {
		session,
		todos: [],
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
		const dueDateStr = formData.get('dueDate')?.toString();

		if (!title || title.trim() === '') {
			return fail(400, { error: 'タイトルは必須です' });
		}

		const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

		try {
			await createTodo(session.userId, title, dueDate);
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
	updateDueDate: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const dueDateStr = formData.get('dueDate')?.toString();

		if (!id || id.trim() === '') {
			return fail(400, { error: 'IDは必須です' });
		}

		const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

		try {
			await updateTodoDueDate(id, session.userId, dueDate);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Todoの期限更新に失敗しました',
			});
		}
	},
};

