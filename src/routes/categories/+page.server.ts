import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/auth';
import { listCategories } from '$lib/server/features/todo/query/list-categories/handler';
import { createCategory } from '$lib/server/features/todo/command/create-category/handler';
import { updateCategory } from '$lib/server/features/todo/command/update-category/handler';
import { deleteCategory } from '$lib/server/features/todo/command/delete-category/handler';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session || null;

	if (!session?.userId) {
		throw redirect(302, '/login');
	}

	const user = await prisma.user.findUnique({
		where: { id: session.userId },
		select: {
			id: true,
			email: true,
			name: true,
			image: true,
		},
	});

	const categories = await listCategories(session.userId);

	return {
		session: user ? { ...session, user } : session,
		categories,
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString() ?? '';
		const color = formData.get('color')?.toString() ?? '#3B82F6';

		if (!name || name.trim() === '') {
			return fail(400, { error: 'カテゴリ名は必須です' });
		}

		try {
			await createCategory(session.userId, name, color);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'カテゴリの作成に失敗しました',
			});
		}
	},
	update: async ({ request, locals }) => {
		const session = locals.session;
		if (!session?.userId) {
			return fail(401, { error: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const name = formData.get('name')?.toString();
		const color = formData.get('color')?.toString();

		if (!id || id.trim() === '') {
			return fail(400, { error: 'カテゴリIDは必須です' });
		}

		try {
			await updateCategory(id, session.userId, { name, color });
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'カテゴリの更新に失敗しました',
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
			return fail(400, { error: 'カテゴリIDは必須です' });
		}

		try {
			await deleteCategory(id, session.userId);
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'カテゴリの削除に失敗しました',
			});
		}
	},
};
