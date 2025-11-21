<script lang="ts">
	import type { PageData } from './$types';
	import type { SessionWithUser } from '$lib/types';

	let { data }: { data: PageData } = $props();

	const session = $derived(data.session as SessionWithUser | null);
	const user = $derived(session?.user);
</script>

<div class="max-w-5xl mx-auto px-6 py-16">
	<div class="text-center mb-16">
		<h1 class="text-5xl font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">
			Todo App
		</h1>
		<p class="text-lg text-gray-500 dark:text-gray-400">
			シンプルでモダンなタスク管理
		</p>
	</div>

	{#if session?.userId}
		<div class="max-w-2xl mx-auto">
			<div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
				<h2 class="text-xl font-medium text-gray-900 dark:text-white mb-6">
					ユーザー情報
				</h2>
				<div class="space-y-4">
					{#if user?.name}
						<div class="flex items-baseline gap-3">
							<span class="text-sm text-gray-500 dark:text-gray-400 min-w-[80px]">名前</span>
							<span class="text-gray-900 dark:text-white">
								{user.name}
							</span>
						</div>
					{/if}
					{#if user?.email}
						<div class="flex items-baseline gap-3">
							<span class="text-sm text-gray-500 dark:text-gray-400 min-w-[80px]">メール</span>
							<span class="text-gray-900 dark:text-white">
								{user.email}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="max-w-md mx-auto text-center">
			<div class="mb-8">
				<p class="text-gray-600 dark:text-gray-400 mb-8">
					アプリケーションを使用するには、ログインまたは新規登録を行ってください
				</p>
				<div class="flex flex-col sm:flex-row justify-center gap-3">
					<a
						href="/login"
						class="px-6 py-3 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg transition-colors"
					>
						ログイン
					</a>
					<a
						href="/register"
						class="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
					>
						新規登録
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
