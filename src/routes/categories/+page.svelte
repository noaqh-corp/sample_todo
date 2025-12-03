<script lang="ts">
	import type { PageData } from './$types';
	import type { SessionWithUser } from '$lib/types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { Category } from '$lib/server/features/todo/types';

	let { data }: { data: PageData } = $props();

	const session = $derived(data.session as SessionWithUser | null);
	const categories = $derived(
		('categories' in data ? (data.categories as Category[]) : []) || []
	);

	let editingCategoryId = $state<string | null>(null);
	let editName = $state('');
	let editColor = $state('');

	function startEdit(category: Category) {
		editingCategoryId = category.id;
		editName = category.name;
		editColor = category.color;
	}

	function cancelEdit() {
		editingCategoryId = null;
		editName = '';
		editColor = '';
	}

	const presetColors = [
		'#EF4444',
		'#F97316',
		'#EAB308',
		'#22C55E',
		'#14B8A6',
		'#3B82F6',
		'#8B5CF6',
		'#EC4899',
		'#6B7280',
	];
</script>

<div class="max-w-5xl mx-auto px-6 py-16">
	<div class="text-center mb-16">
		<h1 class="text-5xl font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">
			カテゴリ管理
		</h1>
		<p class="text-lg text-gray-500 dark:text-gray-400">Todoのカテゴリを管理します</p>
	</div>

	{#if session?.userId}
		<div class="max-w-2xl mx-auto space-y-8">
			<div
				class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800"
			>
				<h2 class="text-xl font-medium text-gray-900 dark:text-white mb-6">
					新しいカテゴリを作成
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
					<div class="space-y-4">
						<div>
							<label
								for="name"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>
								カテゴリ名
							</label>
							<input
								type="text"
								id="name"
								name="name"
								placeholder="カテゴリ名を入力"
								required
								class="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
							/>
						</div>
						<div>
							<label
								for="color"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
							>
								カラー
							</label>
							<div class="flex flex-wrap gap-2 mb-2">
								{#each presetColors as presetColor}
									<button
										type="button"
										onclick={(e) => {
											const input = document.getElementById('color') as HTMLInputElement;
											if (input) input.value = presetColor;
										}}
										class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 transition-transform"
										style="background-color: {presetColor}"
										title={presetColor}
									></button>
								{/each}
							</div>
							<input
								type="text"
								id="color"
								name="color"
								placeholder="#3B82F6"
								value="#3B82F6"
								required
								class="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
							/>
						</div>
						<button
							type="submit"
							class="w-full px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
						>
							作成
						</button>
					</div>
				</form>
			</div>

			<div
				class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800"
			>
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-medium text-gray-900 dark:text-white">カテゴリ一覧</h2>
					<a
						href="/"
						class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						Todo一覧に戻る
					</a>
				</div>
				{#if categories.length === 0}
					<p class="text-gray-500 dark:text-gray-400 text-center py-8">
						カテゴリがありません
					</p>
				{:else}
					<div class="space-y-3">
						{#each categories as category (category.id)}
							<div
								class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
							>
								{#if editingCategoryId === category.id}
									<form
										method="POST"
										action="?/update"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
												await invalidateAll();
												cancelEdit();
											};
										}}
										class="flex-1 flex items-center gap-3"
									>
										<input type="hidden" name="id" value={category.id} />
										<div
											class="w-6 h-6 rounded-full flex-shrink-0"
											style="background-color: {editColor}"
										></div>
										<input
											type="text"
											name="name"
											bind:value={editName}
											required
											class="flex-1 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
										/>
										<input
												type="text"
												name="color"
												bind:value={editColor}
												required
												class="w-24 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
											/>
										<button
											type="submit"
											class="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
										>
											保存
										</button>
										<button
											type="button"
											onclick={cancelEdit}
											class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
										>
											キャンセル
										</button>
									</form>
								{:else}
									<div
										class="w-6 h-6 rounded-full flex-shrink-0"
										style="background-color: {category.color}"
									></div>
									<span class="flex-1 text-gray-900 dark:text-white">
										{category.name}
									</span>
									<span class="text-sm text-gray-500 dark:text-gray-400">
										{category.color}
									</span>
									<button
										type="button"
										onclick={() => startEdit(category)}
										class="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
									>
										編集
									</button>
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
										<input type="hidden" name="id" value={category.id} />
										<button
											type="submit"
											class="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
										>
											削除
										</button>
									</form>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="max-w-md mx-auto text-center">
			<p class="text-gray-600 dark:text-gray-400 mb-8">
				カテゴリを管理するには、ログインが必要です
			</p>
			<a
				href="/login"
				class="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
			>
				ログイン
			</a>
		</div>
	{/if}
</div>
