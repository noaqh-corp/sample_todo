import type { LayoutServerLoad } from './$types';
import { prisma } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ locals }) => {
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
		
		return {
			session: user ? { ...session, user } : session,
		};
	}
	
	return {
		session,
	};
};

