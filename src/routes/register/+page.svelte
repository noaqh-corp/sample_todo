<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";

	let email = $state("");
	let password = $state("");
	let name = $state("");
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleRegister() {
		error = null;
		loading = true;

		try {
			const result = await authClient.signUp.email({
				email,
				password,
				name: name || undefined,
			});

			if (result.error) {
				error = result.error.message || "登録に失敗しました";
				return;
			}

			await goto("/");
		} catch (err) {
			error = err instanceof Error ? err.message : "登録に失敗しました";
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-md mx-auto px-6 py-16">
	<div class="text-center mb-12">
		<h1 class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">新規登録</h1>
		<p class="text-gray-500 dark:text-gray-400">新しいアカウントを作成してください</p>
	</div>

	{#if error}
		<div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
			<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-6">
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				名前（任意）
			</label>
			<input
				id="name"
				type="text"
				placeholder="山田太郎"
				bind:value={name}
				disabled={loading}
				class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
			/>
		</div>

		<div>
			<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				メールアドレス
			</label>
			<input
				id="email"
				type="email"
				placeholder="name@example.com"
				bind:value={email}
				required
				disabled={loading}
				class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				パスワード
			</label>
			<input
				id="password"
				type="password"
				placeholder="••••••••"
				bind:value={password}
				required
				disabled={loading}
				class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
		>
			{loading ? "登録中..." : "登録"}
		</button>
	</form>

	<div class="mt-8 text-center">
		<p class="text-sm text-gray-600 dark:text-gray-400">
			既にアカウントをお持ちの方は
			<a href="/login" class="text-gray-900 dark:text-white hover:underline font-medium">
				こちらからログイン
			</a>
		</p>
	</div>
</div>

