# 機能仕様書: カテゴリ機能

機能名: `2-category`  
作成日: 2025-12-03  
モデル名: Claude Sonnet 4  
仕様書テンプレートバージョン: 1.0.1

## 概要

Todoにカテゴリを追加し、カテゴリごとにTodoを分類・フィルタリングできるようにする

## 要件 *(必須)*

### 機能実装前後の変更点
#### 機能実装前
- ユーザーはTodoを作成、一覧表示、完了状態の切り替え、削除が可能
- Todoにはカテゴリの概念がない
- Todoの分類やフィルタリング機能がない

#### 機能実装後
- ユーザーは自分のカテゴリを作成できる（名前と色を設定）
- ユーザーは自分のカテゴリの一覧を表示できる
- ユーザーは自分のカテゴリを編集できる（名前と色の変更）
- ユーザーは自分のカテゴリを削除できる（Todoが存在しない場合のみ）
- ユーザーはTodoにカテゴリを割り当てることができる（任意、未分類も可）
- ユーザーはカテゴリでTodoをフィルタリングできる
- カテゴリは色付きラベルとして表示される

### 機能要件

- FR-001: システムはユーザーがカテゴリを作成できる機能を提供しなければならない (category)_1
- FR-002: システムはユーザーが自分のカテゴリの一覧を取得できる機能を提供しなければならない (category)_2
- FR-003: ユーザーは自分のカテゴリの名前と色を編集することができなければならない (category)_3
- FR-004: ユーザーは自分のカテゴリを削除することができなければならない（Todoが存在しない場合のみ） (category)_4
- FR-005: ユーザーはTodoにカテゴリを割り当てることができなければならない (category)_5
- FR-006: システムはカテゴリでTodoをフィルタリングできる機能を提供しなければならない (category)_6
- FR-007: システムはカテゴリデータを永続化しなければならない (category)_1

### エンティティ構造

Categoryエンティティを新規追加します。ユーザーごとのカテゴリを管理するため、Userとのリレーションを設定します。
また、TodoエンティティにcategoryIdを追加し、Categoryとのリレーションを設定します。
カテゴリの色はHEXカラーコード（例: #FF5733）として保存します。
カテゴリ削除時にTodoが存在する場合は削除を禁止するため、onDeleteはRestrictを設定します。

```diff
+ model Category {
+   id        String   @id @default(cuid())
+   userId    String
+   name      String
+   color     String   // HEXカラーコード (例: "#FF5733")
+   createdAt DateTime @default(now())
+   updatedAt DateTime @updatedAt
+   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+   todos     Todo[]
+ 
+   @@index([userId])
+ }

  model Todo {
    id        String   @id @default(cuid())
    userId    String
    title     String
    completed Boolean  @default(false)
+   categoryId String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+   category  Category? @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  
    @@index([userId])
+   @@index([categoryId])
  }

  model User {
    id            String    @id @default(cuid())
    email         String    @unique
    emailVerified Boolean   @default(false)
    name          String?
    image         String?
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt
    sessions      Session[]
    accounts      Account[]
    todos         Todo[]
+   categories    Category[]
  }
```

## 成功基準 *(必須)*

- ユーザーはログイン後、カテゴリを作成できる
- ユーザーは自分のカテゴリのみが一覧表示される
- ユーザーはカテゴリの名前と色を編集できる
- ユーザーはTodoが存在しないカテゴリのみを削除できる
- ユーザーはTodoにカテゴリを割り当てることができる
- ユーザーはカテゴリでTodoをフィルタリングできる
- カテゴリは色付きラベルとして表示される
- 他のユーザーのカテゴリは表示・操作できない

### 型定義 *(新規型が必要な場合に含める)*

#### Domain固有型 (features/todo/types.ts)

- `Category`: カテゴリエンティティの型定義
- `Todo`: 既存のTodo型にcategoryIdとcategoryを追加

#### 共通型 (shared/types/types.ts)

- 新規追加なし

### 実装手順

#### 実装セット category_1: Port/Adapter層

##### Repository実装

- 対象ファイル:
  - `prisma/schema.prisma` (修正)
  - `src/lib/server/shared/port/CategoryRepository.ts` (新規追加)
  - `src/lib/server/adapter/repository/CategoryRepository.ts` (新規追加)
  - `src/lib/server/adapter/repository/mock/CategoryRepository.ts` (新規追加)
  - `src/lib/server/shared/port/TodoRepository.ts` (修正)
  - `src/lib/server/adapter/repository/TodoRepository.ts` (修正)
  - `src/lib/server/adapter/repository/mock/TodoRepository.ts` (修正)
  - `src/lib/server/shared/container.ts` (修正)
- 実装内容: CategoryのCRUD操作を提供するRepositoryを実装します。また、TodoRepositoryにカテゴリ関連の機能を追加します。
- メソッド (CategoryRepository):
  - `create(userId: string, name: string, color: string): Promise<Category>`
  - `search(userId: string, limit?: number, offset?: number): Promise<{ items: Category[], total: number, page: number, pageSize: number }>`
  - `get(id: string, userId: string): Promise<Category | null>`
  - `update(id: string, userId: string, data: Partial<Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Category>`
  - `delete(id: string, userId: string): Promise<void>`
  - `countTodosByCategory(id: string, userId: string): Promise<number>`
- メソッド (TodoRepository 追加・修正):
  - `search(userId: string, categoryId?: string | null, limit?: number, offset?: number): Promise<{ items: Todo[], total: number, page: number, pageSize: number }>` (修正: categoryIdフィルタ追加)
  - `updateCategory(id: string, userId: string, categoryId: string | null): Promise<Todo>` (新規追加)
- テスト項目 (CategoryRepository):
  - カテゴリを作成できる
  - ユーザーIDでカテゴリを検索できる
  - ページネーションが正しく動作する
  - カテゴリを取得できる
  - カテゴリを更新できる
  - カテゴリを削除できる
  - 他のユーザーのカテゴリは取得できない
  - カテゴリに属するTodoの数を取得できる
- テスト項目 (TodoRepository 追加):
  - カテゴリIDでTodoをフィルタリングできる
  - TodoのカテゴリIDを更新できる
- 手順:
  - [] スキーマファイルを更新(prisma/schema.prisma)
  - [] `bun run db:generate`を実行し、Prismaクライアントを生成
  - [] `bun run prisma migrate dev --name add_category`を実行し、マイグレーションを作成
  - [] Port(インターフェース)定義を作成(src/lib/server/shared/port/CategoryRepository.ts)
  - [] 本番実装を作成(src/lib/server/adapter/repository/CategoryRepository.ts)
  - [] 本番実装のテストを作成(src/lib/server/adapter/repository/CategoryRepository.test.ts)
  - [] `bun run test src/lib/server/adapter/repository/CategoryRepository.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] Mock実装を作成(src/lib/server/adapter/repository/mock/CategoryRepository.ts)
  - [] Mock実装のテストを作成(src/lib/server/adapter/repository/mock/CategoryRepository.test.ts)
  - [] `bun run test src/lib/server/adapter/repository/mock/CategoryRepository.test.ts`を実行しテストが通ることを確認
  - [] TodoRepository Portを修正(src/lib/server/shared/port/TodoRepository.ts)
  - [] TodoRepository本番実装を修正(src/lib/server/adapter/repository/TodoRepository.ts)
  - [] TodoRepository本番実装のテストを修正(src/lib/server/adapter/repository/TodoRepository.test.ts)
  - [] `bun run test src/lib/server/adapter/repository/TodoRepository.test.ts`を実行しテストが通ることを確認する。
  - [] TodoRepository Mock実装を修正(src/lib/server/adapter/repository/mock/TodoRepository.ts)
  - [] TodoRepository Mock実装のテストを修正(src/lib/server/adapter/repository/mock/TodoRepository.test.ts)
  - [] `bun run test src/lib/server/adapter/repository/mock/TodoRepository.test.ts`を実行しテストが通ることを確認
  - [] DIコンテナ(shared/container.ts)にCategoryRepositoryを登録
  - [] コードスタイルに沿っているか確認し、リファクタリングも合わせて行う。
  - [] リファクタリング後、再度テストを実行し、すべてのテストが通ることを確認

#### 実装セット category_2: 型定義

- 対象ファイル:
  - `src/lib/server/features/todo/types.ts` (修正)
- 実装内容: Category型を追加し、Todo型にcategoryIdとcategoryを追加します。
- 手順:
  - [] Category型を定義(src/lib/server/features/todo/types.ts)
  - [] Todo型にcategoryIdとcategoryを追加(src/lib/server/features/todo/types.ts)

#### 実装セット category_3: create-category実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/create-category/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/create-category/handler.test.ts` (新規追加)
- エントリーポイント:
  - 新規追加: `src/routes/categories/+page.server.ts`
    - 関数: `actions.create({ name: string, color: string }): Promise<{ success: boolean }>`
    - 実装前状態: カテゴリ作成機能なし
    - 実装後状態: カテゴリ作成フォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのカテゴリを作成する
    - 使用するPort: `CategoryRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/create-category/handler.test.ts`
- テスト項目:
  - ログイン中のユーザーのカテゴリを作成できる
  - カテゴリ名が空の場合はエラーがthrowされる
  - 色が不正なHEXカラーコードの場合はエラーがthrowされる
- 実装内容: ユーザーID、カテゴリ名、色を受け取り、カテゴリを作成します。
- 手順:
  - [] createCategoryテストを作成(src/lib/server/features/todo/command/create-category/handler.test.ts)
    - ログイン中のユーザーのカテゴリを作成できる
    - カテゴリ名が空の場合はエラーがthrowされる
    - 色が不正なHEXカラーコードの場合はエラーがthrowされる
  - [] createCategoryを実装(src/lib/server/features/todo/command/create-category/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/create-category/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/create-category/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/create-category/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。

#### 実装セット category_4: list-categories実装

- 対象ファイル:
  - `src/lib/server/features/todo/query/list-categories/handler.ts` (新規追加)
  - `src/lib/server/features/todo/query/list-categories/handler.test.ts` (新規追加)
- エントリーポイント:
  - 新規追加: `src/routes/categories/+page.server.ts`
    - 関数: `load({ locals }): Promise<{ categories: Category[] }>`
    - 実装前状態: カテゴリ一覧取得機能なし
    - 実装後状態: ログイン中のユーザーのカテゴリ一覧が取得可能
    - 実装内容: ログイン中のユーザーのカテゴリ一覧を取得する
    - 使用するPort: `CategoryRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/query/list-categories/handler.test.ts`
- テスト項目:
  - ログイン中のユーザーのカテゴリ一覧を取得できる
  - 他のユーザーのカテゴリは取得できない
  - ログインしていない場合は空配列を返す
- 実装内容: ユーザーIDを受け取り、そのユーザーのカテゴリ一覧を取得します。
- 手順:
  - [] listCategoriesテストを作成(src/lib/server/features/todo/query/list-categories/handler.test.ts)
    - ログイン中のユーザーのカテゴリ一覧を取得できる
    - 他のユーザーのカテゴリは取得できない
    - ログインしていない場合は空配列を返す
  - [] listCategoriesを実装(src/lib/server/features/todo/query/list-categories/handler.ts)
  - [] `bun run test src/lib/server/features/todo/query/list-categories/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/query/list-categories/handler.ts)
  - [] `bun run test src/lib/server/features/todo/query/list-categories/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。

#### 実装セット category_5: update-category実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/update-category/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/update-category/handler.test.ts` (新規追加)
- エントリーポイント:
  - 修正: `src/routes/categories/+page.server.ts`
    - 関数: `actions.update({ id: string, name?: string, color?: string }): Promise<{ success: boolean }>`
    - 実装前状態: カテゴリ編集機能なし
    - 実装後状態: カテゴリ編集フォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのカテゴリを編集する
    - 使用するPort: `CategoryRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/update-category/handler.test.ts`
- テスト項目:
  - ログイン中のユーザーのカテゴリの名前を更新できる
  - ログイン中のユーザーのカテゴリの色を更新できる
  - 他のユーザーのカテゴリは更新できない
  - 存在しないカテゴリの場合はエラーがthrowされる
  - カテゴリ名が空の場合はエラーがthrowされる
  - 色が不正なHEXカラーコードの場合はエラーがthrowされる
- 実装内容: カテゴリID、ユーザーID、更新データを受け取り、カテゴリを更新します。
- 手順:
  - [] updateCategoryテストを作成(src/lib/server/features/todo/command/update-category/handler.test.ts)
    - ログイン中のユーザーのカテゴリの名前を更新できる
    - ログイン中のユーザーのカテゴリの色を更新できる
    - 他のユーザーのカテゴリは更新できない
    - 存在しないカテゴリの場合はエラーがthrowされる
    - カテゴリ名が空の場合はエラーがthrowされる
    - 色が不正なHEXカラーコードの場合はエラーがthrowされる
  - [] updateCategoryを実装(src/lib/server/features/todo/command/update-category/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/update-category/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/update-category/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/update-category/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。

#### 実装セット category_6: delete-category実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/delete-category/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/delete-category/handler.test.ts` (新規追加)
- エントリーポイント:
  - 修正: `src/routes/categories/+page.server.ts`
    - 関数: `actions.delete({ id: string }): Promise<{ success: boolean }>`
    - 実装前状態: カテゴリ削除機能なし
    - 実装後状態: カテゴリ削除フォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのカテゴリを削除する（Todoが存在しない場合のみ）
    - 使用するPort: `CategoryRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/delete-category/handler.test.ts`
- テスト項目:
  - ログイン中のユーザーのカテゴリを削除できる
  - 他のユーザーのカテゴリは削除できない
  - 存在しないカテゴリの場合はエラーがthrowされる
  - Todoが存在するカテゴリは削除できない
- 実装内容: カテゴリID、ユーザーIDを受け取り、カテゴリを削除します。Todoが存在する場合はエラーをthrowします。
- 手順:
  - [] deleteCategoryテストを作成(src/lib/server/features/todo/command/delete-category/handler.test.ts)
    - ログイン中のユーザーのカテゴリを削除できる
    - 他のユーザーのカテゴリは削除できない
    - 存在しないカテゴリの場合はエラーがthrowされる
    - Todoが存在するカテゴリは削除できない
  - [] deleteCategoryを実装(src/lib/server/features/todo/command/delete-category/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/delete-category/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/delete-category/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/delete-category/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。

#### 実装セット category_7: assign-category-to-todo実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/assign-category-to-todo/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/assign-category-to-todo/handler.test.ts` (新規追加)
- エントリーポイント:
  - 修正: `src/routes/+page.server.ts`
    - 関数: `actions.assignCategory({ todoId: string, categoryId: string | null }): Promise<{ success: boolean }>`
    - 実装前状態: Todoへのカテゴリ割り当て機能なし
    - 実装後状態: Todoへのカテゴリ割り当てフォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのTodoにカテゴリを割り当てる
    - 使用するPort: `TodoRepository`, `CategoryRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/assign-category-to-todo/handler.test.ts`
- テスト項目:
  - ログイン中のユーザーのTodoにカテゴリを割り当てられる
  - カテゴリをnullに設定して未分類にできる
  - 他のユーザーのTodoにはカテゴリを割り当てられない
  - 他のユーザーのカテゴリは割り当てられない
  - 存在しないTodoの場合はエラーがthrowされる
  - 存在しないカテゴリの場合はエラーがthrowされる
- 実装内容: Todo ID、ユーザーID、カテゴリIDを受け取り、Todoにカテゴリを割り当てます。
- 手順:
  - [] assignCategoryToTodoテストを作成(src/lib/server/features/todo/command/assign-category-to-todo/handler.test.ts)
    - ログイン中のユーザーのTodoにカテゴリを割り当てられる
    - カテゴリをnullに設定して未分類にできる
    - 他のユーザーのTodoにはカテゴリを割り当てられない
    - 他のユーザーのカテゴリは割り当てられない
    - 存在しないTodoの場合はエラーがthrowされる
    - 存在しないカテゴリの場合はエラーがthrowされる
  - [] assignCategoryToTodoを実装(src/lib/server/features/todo/command/assign-category-to-todo/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/assign-category-to-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/assign-category-to-todo/handler.ts)
  - [] `bun run test src/lib/server/features/todo/command/assign-category-to-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。

#### 実装セット category_8: list-todos修正（カテゴリフィルタリング）

- 対象ファイル:
  - `src/lib/server/features/todo/query/list-todos/handler.ts` (修正)
  - `src/lib/server/features/todo/query/list-todos/handler.test.ts` (修正)
- エントリーポイント:
  - 修正: `src/routes/+page.server.ts`
    - 関数: `load({ locals, url }): Promise<{ todos: Todo[], categories: Category[] }>`
    - 実装前状態: カテゴリフィルタリング機能なし
    - 実装後状態: URLパラメータでカテゴリフィルタリングが可能
    - 実装内容: ログイン中のユーザーのTodo一覧をカテゴリでフィルタリングして取得する
    - 使用するPort: `TodoRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/query/list-todos/handler.test.ts`
- テスト項目 (追加):
  - カテゴリIDでTodoをフィルタリングできる
  - 未分類のTodoのみをフィルタリングできる（categoryId=null）
- 実装内容: ユーザーIDとオプションのカテゴリIDを受け取り、そのユーザーのTodo一覧を取得します。
- 手順:
  - [] listTodosテストを修正(src/lib/server/features/todo/query/list-todos/handler.test.ts)
    - カテゴリIDでTodoをフィルタリングできる
    - 未分類のTodoのみをフィルタリングできる（categoryId=null）
  - [] listTodosを修正(src/lib/server/features/todo/query/list-todos/handler.ts)
  - [] `bun run test src/lib/server/features/todo/query/list-todos/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/query/list-todos/handler.ts)
  - [] `bun run test src/lib/server/features/todo/query/list-todos/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。

#### 実装セット category_9: UI実装

- 対象ファイル:
  - `src/routes/+page.svelte` (修正)
  - `src/routes/+page.server.ts` (修正)
  - `src/routes/categories/+page.svelte` (新規追加)
  - `src/routes/categories/+page.server.ts` (新規追加)
- 実装内容:
  - カテゴリ管理ページ（/categories）を新規作成
    - カテゴリ一覧表示（色付きラベル）
    - カテゴリ作成フォーム（名前、色選択）
    - カテゴリ編集機能（インライン編集またはモーダル）
    - カテゴリ削除ボタン（Todoが存在する場合は無効化）
  - メインページ（/）を修正
    - Todo一覧にカテゴリラベルを表示
    - カテゴリフィルタリングUI（ドロップダウンまたはタブ）
    - Todo作成時にカテゴリを選択できるようにする
    - Todoのカテゴリを変更できるようにする
  - ナビゲーションにカテゴリ管理ページへのリンクを追加
- 影響ページ:
  - `/` (メインページ)
  - `/categories` (カテゴリ管理ページ - 新規)
- 手順:
  - [] カテゴリ管理ページのサーバーサイドを実装(src/routes/categories/+page.server.ts)
    - load関数でカテゴリ一覧を取得
    - actions.createでカテゴリを作成
    - actions.updateでカテゴリを更新
    - actions.deleteでカテゴリを削除
  - [] カテゴリ管理ページのUIを実装(src/routes/categories/+page.svelte)
    - カテゴリ一覧表示（色付きラベル）
    - カテゴリ作成フォーム（名前入力、カラーピッカー）
    - カテゴリ編集機能
    - カテゴリ削除ボタン
  - [] メインページのサーバーサイドを修正(src/routes/+page.server.ts)
    - load関数でカテゴリ一覧も取得
    - URLパラメータからカテゴリフィルタを取得
    - actions.assignCategoryでTodoにカテゴリを割り当て
  - [] メインページのUIを修正(src/routes/+page.svelte)
    - Todo一覧にカテゴリラベルを表示
    - カテゴリフィルタリングUI
    - Todo作成時のカテゴリ選択
    - Todoのカテゴリ変更UI
  - [] ナビゲーションにカテゴリ管理ページへのリンクを追加(src/routes/+layout.svelte)
  - [] UI実装(注意: テストは実装しない)

### 影響ページ

- `/` (メインページ): Todo一覧にカテゴリラベルが表示され、カテゴリでフィルタリングできるようになる。Todo作成時にカテゴリを選択でき、既存Todoのカテゴリを変更できる。
- `/categories` (カテゴリ管理ページ - 新規): カテゴリの作成、一覧表示、編集、削除ができる。

### 確認すべき項目

#### ローカル確認できる項目

- カテゴリ作成:
  - 確認すべき理由: カテゴリ機能の基本となる作成機能が正しく動作することを確認するため
  - 確認すべき内容: カテゴリ名と色を入力して作成ボタンを押すと、カテゴリが作成され一覧に表示される
  - 確認方法: /categoriesページでカテゴリ名と色を入力し、作成ボタンをクリック。一覧に新しいカテゴリが表示されることを確認

- カテゴリ編集:
  - 確認すべき理由: カテゴリの名前や色を変更できることを確認するため
  - 確認すべき内容: 既存のカテゴリの名前と色を変更できる
  - 確認方法: /categoriesページで既存カテゴリの編集ボタンをクリックし、名前や色を変更して保存。変更が反映されることを確認

- カテゴリ削除:
  - 確認すべき理由: Todoが存在しないカテゴリのみ削除できることを確認するため
  - 確認すべき内容: Todoが存在しないカテゴリは削除でき、Todoが存在するカテゴリは削除できない
  - 確認方法: /categoriesページでTodoが存在しないカテゴリの削除ボタンをクリックし、削除されることを確認。Todoが存在するカテゴリの削除ボタンが無効化されているか、エラーメッセージが表示されることを確認

- Todoへのカテゴリ割り当て:
  - 確認すべき理由: Todoにカテゴリを割り当てる機能が正しく動作することを確認するため
  - 確認すべき内容: Todoにカテゴリを割り当てると、Todo一覧にカテゴリラベルが表示される
  - 確認方法: メインページでTodoのカテゴリ選択UIからカテゴリを選択。Todo一覧にカテゴリラベルが表示されることを確認

- カテゴリフィルタリング:
  - 確認すべき理由: カテゴリでTodoをフィルタリングできることを確認するため
  - 確認すべき内容: 特定のカテゴリを選択すると、そのカテゴリに属するTodoのみが表示される
  - 確認方法: メインページでカテゴリフィルタUIから特定のカテゴリを選択。そのカテゴリに属するTodoのみが表示されることを確認

- 未分類Todoの表示:
  - 確認すべき理由: カテゴリが割り当てられていないTodoも正しく表示されることを確認するため
  - 確認すべき内容: カテゴリが割り当てられていないTodoは「未分類」として表示される
  - 確認方法: カテゴリを割り当てていないTodoがメインページに表示され、フィルタで「未分類」を選択するとそのTodoのみが表示されることを確認

- 他ユーザーのカテゴリ・Todoへのアクセス制限:
  - 確認すべき理由: セキュリティ上、他ユーザーのデータにアクセスできないことを確認するため
  - 確認すべき内容: 他のユーザーのカテゴリやTodoは表示・操作できない
  - 確認方法: 別のユーザーでログインし、最初のユーザーが作成したカテゴリやTodoが表示されないことを確認

#### デプロイ環境でのみ確認できる項目

- 該当なし（すべての機能はローカル環境で確認可能）
