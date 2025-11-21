<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import type { PageData } from './$types';
	import type { SessionWithUser } from '$lib/types';
	import { Card, Button, Alert } from 'flowbite-svelte';

	let { data }: { data: PageData } = $props();
	
	const session = $derived(data.session as SessionWithUser | null);
	const user = $derived(session?.user);
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
				Welcome to Todo App
			</h1>
			<p class="text-lg text-gray-600 dark:text-gray-400">
				SvelteKitとFlowbiteで構築されたモダンなTodoアプリケーション
			</p>
		</div>

		{#if session?.userId}
			<Card class="mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
						ログイン中のユーザー情報
					</h2>
				</div>
				<div class="space-y-3">
					<div class="flex items-center">
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">ユーザーID:</span>
						<span class="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
							{session.userId}
						</span>
					</div>
					{#if user?.name}
						<div class="flex items-center">
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">名前:</span>
							<span class="text-sm text-gray-900 dark:text-white">
								{user.name}
							</span>
						</div>
					{/if}
					{#if user?.email}
						<div class="flex items-center">
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">メールアドレス:</span>
							<span class="text-sm text-gray-900 dark:text-white">
								{user.email}
							</span>
						</div>
					{/if}
				</div>
			</Card>
		{:else}
			<Alert color="blue" class="mb-6">
				<span class="font-medium">ログインが必要です</span>
				<p class="mt-2 text-sm">アプリケーションを使用するには、ログインまたは新規登録を行ってください。</p>
			</Alert>
			<div class="flex justify-center gap-4 mb-8">
				<Button href="/login" color="blue" size="lg">ログイン</Button>
				<Button href="/register" color="light" size="lg">新規登録</Button>
			</div>
		{/if}

		<Card>
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
				ドキュメント
			</h3>
			<p class="text-gray-600 dark:text-gray-400 mb-4">
				SvelteKitの詳細なドキュメントを確認して、アプリケーションの開発を続けましょう。
			</p>
			<Button href="https://svelte.dev/docs/kit" color="blue" target="_blank" rel="noopener noreferrer">
				SvelteKit ドキュメントを見る
			</Button>
		</Card>
	</div>
</div>
