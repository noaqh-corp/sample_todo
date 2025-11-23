<script lang="ts">
	import type { PageData } from './$types';
	import type { SessionWithUser } from '$lib/types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { Todo } from '$lib/server/features/todo/types';

	let { data }: { data: PageData } = $props();

	const session = $derived(data.session as SessionWithUser | null);
	const user = $derived(session?.user);
	const todos = $derived(('todos' in data ? (data.todos as Todo[]) : []) || []);

	function isDateOverdue(dueDate: Date | string): boolean {
		const due = new Date(dueDate);
		const today = new Date();
		// 時刻を0時0分0秒に設定して日付のみを比較
		due.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		return due.getTime() < today.getTime();
	}
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
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							await invalidateAll();
						};
					}}
				>
					<div class="space-y-3">
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
						<div>
							<label for="create-dueDate" class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
								期限（任意）
							</label>
							<input
								type="date"
								id="create-dueDate"
								name="dueDate"
								class="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
							/>
						</div>
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
							{@const isOverdue = todo.dueDate && isDateOverdue(todo.dueDate) && !todo.completed}
							<div
								class="flex items-center gap-3 p-4 rounded-lg border {isOverdue
									? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
									: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}"
							>
								<form
									method="POST"
									action="?/toggle"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											await invalidateAll();
										};
									}}
								>
									<input type="hidden" name="id" value={todo.id} />
									<button
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
								<div class="flex-1">
									<span
										class="text-gray-900 dark:text-white {todo.completed
											? 'line-through text-gray-500 dark:text-gray-400'
											: ''} {isOverdue ? 'font-semibold' : ''}"
									>
										{todo.title}
									</span>
									{#if todo.dueDate}
										<div class="flex items-center gap-1 mt-1">
											<svg
												class="w-4 h-4 {isOverdue
													? 'text-red-600 dark:text-red-400'
													: 'text-gray-500 dark:text-gray-400'}"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
											<span
												class="text-sm {isOverdue
													? 'text-red-600 dark:text-red-400 font-semibold'
													: 'text-gray-500 dark:text-gray-400'}"
											>
												{new Date(todo.dueDate).toLocaleDateString('ja-JP', {
													year: 'numeric',
													month: '2-digit',
													day: '2-digit'
												})}
											</span>
										</div>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									{#if todo.dueDate}
										<form
											method="POST"
											action="?/updateDueDate"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
												};
											}}
										>
											<input type="hidden" name="id" value={todo.id} />
											<input
												type="date"
												name="dueDate"
												value={new Date(todo.dueDate).toISOString().split('T')[0]}
												on:change={(e) => e.currentTarget.form?.requestSubmit()}
												class="px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
											/>
										</form>
										<form
											method="POST"
											action="?/updateDueDate"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
												};
											}}
										>
											<input type="hidden" name="id" value={todo.id} />
											<input type="hidden" name="dueDate" value="" />
											<button
												type="submit"
												class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
												title="期限を削除"
											>
												削除
											</button>
										</form>
									{:else}
										<form
											method="POST"
											action="?/updateDueDate"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
													await invalidateAll();
												};
											}}
										>
											<input type="hidden" name="id" value={todo.id} />
											<input
												type="date"
												name="dueDate"
												on:change={(e) => e.currentTarget.form?.requestSubmit()}
												class="px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
											/>
										</form>
									{/if}
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												await invalidateAll();
											};
										}}
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
