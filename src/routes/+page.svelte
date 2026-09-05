<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const session = $derived(data.session);
	const user = $derived(session?.user);
	const todos = $derived(data.todos);
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

	{#if form && "error" in form}
		<p role="alert" class="text-red-600 mb-6">{form.error}</p>
	{/if}

	{#if session?.userId}
		<div class="max-w-2xl mx-auto space-y-8">
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

			<div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
				<h2 class="text-xl font-medium text-gray-900 dark:text-white mb-6">
					Todo作成
				</h2>
				<form
					method="POST"
					action="?/create"
					use:enhance
				>
					<div class="flex gap-3">
						<input
							type="text"
							name="title"
							placeholder="Todoのタイトルを入力"
							required
							class="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
						/>
						<button
							type="submit"
							class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
						>
							作成
						</button>
					</div>
				</form>
			</div>

			<div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
				<h2 class="text-xl font-medium text-gray-900 dark:text-white mb-6">
					Todo一覧
				</h2>
				{#if todos.length === 0}
					<p class="text-gray-500 dark:text-gray-400 text-center py-8">
						Todoがありません
					</p>
				{:else}
					<div class="space-y-3">
						{#each todos as todo (todo.id)}
							<div
								class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
							>
								<form
									method="POST"
									action="?/toggle"
									use:enhance
								>
									<input type="hidden" name="id" value={todo.id} />
									<input type="hidden" name="completed" value={String(!todo.completed)} />
									<button
										aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
										type="submit"
										class="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center transition-colors {todo.completed
											? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
											: ''}"
									>
										{#if todo.completed}
											<svg
												class="w-3 h-3 text-white dark:text-gray-900"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{/if}
									</button>
								</form>
								<form
									method="POST"
									action="?/rename"
									use:enhance={() => async ({ update }) => {
										await update({ reset: false });
									}}
									class="min-w-0 flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2"
								>
									<input type="hidden" name="id" value={todo.id} />
									<input
										type="text"
										name="title"
										value={todo.title}
										aria-label="Todoのタイトル"
										required
										class="min-w-0 w-full flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white {todo.completed
											? 'line-through text-gray-500 dark:text-gray-400'
											: ''}"
									/>
									<button
										type="submit"
										class="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
									>
										保存
									</button>
								</form>
								<form
									method="POST"
									action="?/delete"
									use:enhance
								>
									<input type="hidden" name="id" value={todo.id} />
									<button
										type="submit"
										class="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
									>
										削除
									</button>
								</form>
							</div>
						{/each}
					</div>
				{/if}
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
