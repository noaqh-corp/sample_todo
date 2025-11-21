<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { Button, Card, Label, Textinput, Alert } from "flowbite-svelte";

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

<div class="flex items-center justify-center min-h-screen px-4 py-8">
	<Card class="w-full max-w-md">
		<div class="text-center mb-6">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">新規登録</h1>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">新しいアカウントを作成してください</p>
		</div>

		{#if error}
			<Alert color="red" class="mb-4">
				<span class="font-medium">エラー:</span> {error}
			</Alert>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-6">
			<div>
				<Label for="name" class="mb-2">名前（任意）</Label>
				<Textinput
					id="name"
					type="text"
					placeholder="山田太郎"
					bind:value={name}
					disabled={loading}
					class="w-full"
				/>
			</div>

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
				{loading ? "登録中..." : "登録"}
			</Button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				既にアカウントをお持ちの方は
				<a href="/login" class="text-blue-600 hover:underline dark:text-blue-500 font-medium">
					こちらからログイン
				</a>
			</p>
		</div>
	</Card>
</div>

