<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { Button, Card, Label, Textinput, Alert } from "flowbite-svelte";

	let email = $state("");
	let password = $state("");
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleLogin() {
		error = null;
		loading = true;

		try {
			const result = await authClient.signIn.email({
				email,
				password,
				callbackURL: "/",
			});

			if (result.error) {
				error = result.error.message || "ログインに失敗しました";
				return;
			}

			await goto("/");
		} catch (err) {
			error = err instanceof Error ? err.message : "ログインに失敗しました";
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen px-4 py-8">
	<Card class="w-full max-w-md">
		<div class="text-center mb-6">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">ログイン</h1>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">アカウントにログインしてください</p>
		</div>

		{#if error}
			<Alert color="red" class="mb-4">
				<span class="font-medium">エラー:</span> {error}
			</Alert>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-6">
			<div>
				<Label for="email" class="mb-2">メールアドレス</Label>
				<Textinput
					id="email"
					type="email"
					placeholder="name@example.com"
					bind:value={email}
					required
					disabled={loading}
					class="w-full"
				/>
			</div>

			<div>
				<Label for="password" class="mb-2">パスワード</Label>
				<Textinput
					id="password"
					type="password"
					placeholder="••••••••"
					bind:value={password}
					required
					disabled={loading}
					class="w-full"
				/>
			</div>

			<Button type="submit" color="blue" class="w-full" disabled={loading}>
				{loading ? "ログイン中..." : "ログイン"}
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				アカウントをお持ちでない方は
				<a href="/register" class="text-blue-600 hover:underline dark:text-blue-500 font-medium">
					こちらから新規登録
				</a>
			</p>
		</div>
	</Card>
</div>

