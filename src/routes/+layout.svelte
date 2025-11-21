<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Button } from 'flowbite-svelte';
	import type { LayoutData } from './$types';
	import type { SessionWithUser } from '$lib/types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const clientSession = authClient.useSession();
	
	// サーバーサイドのセッションとクライアントサイドのセッションを統合
	// クライアントサイドのセッションが利用可能な場合はそれを使用、そうでない場合はサーバーサイドのセッションを使用
	const session = $derived((clientSession.data || data.session) as SessionWithUser | null);

	let mobileMenuOpen = $state(false);

	async function handleLogout() {
		await authClient.signOut();
		await goto('/login');
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<nav class="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
		<div class="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
			<a href="/" class="flex items-center">
				<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Todo App</span>
			</a>
			<div class="flex items-center lg:order-2">
				{#if session?.user}
					<span class="mr-4 text-sm text-gray-700 dark:text-gray-300">
						ようこそ、{session.user.name || session.user.email}さん
					</span>
					<Button color="red" size="sm" on:click={handleLogout}>ログアウト</Button>
				{:else}
					<a href="/login" class="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
						ログイン
					</a>
					<a href="/register" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
						新規登録
					</a>
				{/if}
				<button
					type="button"
					class="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
					on:click={toggleMobileMenu}
					aria-label="Toggle menu"
				>
					<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
					</svg>
				</button>
			</div>
			<div class="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1" id="mobile-menu-2">
				<!-- デスクトップメニューは上に表示 -->
			</div>
		</div>
		{#if mobileMenuOpen}
			<div class="lg:hidden mt-2">
				{#if session?.user}
					<div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
						ようこそ、{session.user.name || session.user.email}さん
					</div>
					<Button color="red" size="sm" class="w-full mb-2" on:click={handleLogout}>ログアウト</Button>
				{:else}
					<a href="/login" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
						ログイン
					</a>
					<a href="/register" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
						新規登録
					</a>
				{/if}
			</div>
		{/if}
	</nav>

	{@render children?.()}
</div>
