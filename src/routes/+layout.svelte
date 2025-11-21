<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';
	import type { SessionWithUser } from '$lib/types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const clientSession = authClient.useSession();

	// サーバーサイドのセッションとクライアントサイドのセッションを統合
	// クライアントサイドのセッションが利用可能な場合はそれを使用、そうでない場合はサーバーサイドのセッションを使用
	const session = $derived((clientSession.data || data.session) as SessionWithUser | null);

	async function handleLogout() {
		await authClient.signOut();
		await goto('/login');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-950">
	<nav class="border-b border-gray-100 dark:border-gray-800">
		<div class="max-w-5xl mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<a href="/" class="text-lg font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
					Todo App
				</a>
				<div class="flex items-center gap-6">
					{#if session?.user}
						<span class="text-sm text-gray-600 dark:text-gray-400">
							{session.user.name || session.user.email}
						</span>
						<button
							on:click={handleLogout}
							class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
						>
							ログアウト
						</button>
					{:else}
						<a
							href="/login"
							class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
						>
							ログイン
						</a>
						<a
							href="/register"
							class="text-sm px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
						>
							新規登録
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	{@render children?.()}
</div>
