# 機能仕様書: Todoアプリ

機能名: `1-todo`  
作成日: 2025-01-21  
モデル名: Claude Sonnet 4.5  
仕様書テンプレートバージョン: 1.0.1

## 概要

ユーザーがTodoを作成、一覧表示、完了状態の切り替え、削除を行うことができるシンプルなTodoアプリケーションを実装します。

## 要件 *(必須)*

### 機能実装前後の変更点
#### 機能実装前
- ユーザーはログイン・ログアウト・新規登録のみ可能
- Todoに関する機能は存在しない

#### 機能実装後
- ユーザーは自分のTodoを作成できる
- ユーザーは自分のTodoの一覧を表示できる
- ユーザーは自分のTodoの完了状態を切り替えられる
- ユーザーは自分のTodoを削除できる

### 機能要件

- FR-001: システムはユーザーがTodoを作成できる機能を提供しなければならない (implement_set_1)_1
- FR-002: システムはユーザーが自分のTodoの一覧を取得できる機能を提供しなければならない (implement_set_1)_2
- FR-003: ユーザーは自分のTodoの完了状態を切り替えることができなければならない (implement_set_1)_3
- FR-004: ユーザーは自分のTodoを削除することができなければならない (implement_set_1)_4
- FR-005: システムはTodoデータを永続化しなければならない (implement_set_1)_1

### エンティティ構造

Todoエンティティを新規追加します。ユーザーごとのTodoを管理するため、Userとのリレーションを設定します。

```diff
+ model Todo {
+   id        String   @id @default(cuid())
+   userId    String
+   title     String
+   completed Boolean  @default(false)
+   createdAt DateTime @default(now())
+   updatedAt DateTime @updatedAt
+   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+ 
+   @@index([userId])
+ }
 
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
+   todos         Todo[]
  }
```

## 成功基準 *(必須)*

- ユーザーはログイン後、Todoを作成できる
- ユーザーは自分のTodoのみが一覧表示される
- ユーザーはTodoの完了状態を切り替えられる
- ユーザーは自分のTodoのみを削除できる
- 他のユーザーのTodoは表示・操作できない

### 型定義 *(新規型が必要な場合に含める)*

#### Domain固有型 (features/todo/types.ts)

- `Todo`: Todoエンティティの型定義

#### 共通型 (shared/types/types.ts)

- 新規追加なし（既存のUser型は使用するが、新規追加は不要）

### 実装手順

#### 実装セット implement_set_1_1: Port/Adapter層

##### Repository実装

- 対象ファイル:
  - `prisma/schema.prisma` (修正)
  - `src/lib/server/shared/port/TodoRepository.ts` (新規追加)
  - `src/lib/server/adapter/repository/TodoRepository.ts` (新規追加)
  - `src/lib/server/adapter/repository/mock/TodoRepository.ts` (新規追加)
  - `src/lib/server/shared/container.ts` (新規追加)
- 実装内容: TodoのCRUD操作を提供するRepositoryを実装します。Prismaを使用してSQLiteに永続化します。
- メソッド:
  - `create(userId: string, title: string): Promise<Todo>`
  - `search(userId: string, limit?: number, offset?: number): Promise<{ items: Todo[], total: number, page: number, pageSize: number }>`
  - `get(id: string, userId: string): Promise<Todo | null>`
  - `update(id: string, userId: string, data: Partial<Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Todo>`
  - `delete(id: string, userId: string): Promise<void>`
- テスト項目:
  - Todoを作成できる
  - ユーザーIDでTodoを検索できる
  - ページネーションが正しく動作する
  - Todoを取得できる
  - Todoを更新できる
  - Todoを削除できる
  - 他のユーザーのTodoは取得できない
- 手順:
  - [x] スキーマファイルを更新(prisma/schema.prisma)
  - [x] `bun run db:generate`を実行し、Prismaクライアントを生成
  - [x] `bun run prisma migrate dev --name add_todo`を実行し、マイグレーションを作成
  - [x] Port(インターフェース)定義を作成(src/lib/server/shared/port/TodoRepository.ts)
  - [x] 本番実装を作成(src/lib/server/adapter/repository/TodoRepository.ts)
  - [x] 本番実装のテストを作成(src/lib/server/adapter/repository/TodoRepository.test.ts)
  - [x] `bun run test src/lib/server/adapter/repository/TodoRepository.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] Mock実装を作成(src/lib/server/adapter/repository/mock/TodoRepository.ts)
  - [x] Mock実装のテストを作成(src/lib/server/adapter/repository/mock/TodoRepository.test.ts)
  - [x] `bun run test src/lib/server/adapter/repository/mock/TodoRepository.test.ts`を実行しテストが通ることを確認
  - [x] DIコンテナ(shared/container.ts)を作成し、TodoRepositoryを登録
  - [x] コードスタイルに沿っているか確認し、リファクタリングも合わせて行う。
  - [x] リファクタリング後、再度テストを実行し、すべてのテストが通ることを確認

#### 実装セット implement_set_1_2: 型定義

- 対象ファイル:
  - `src/lib/server/features/todo/types.ts` (新規追加)
- 実装内容: Todo型を定義します。Prisma生成型を元に手書き型として定義します。
- 手順:
  - [x] Todo型を定義(src/lib/server/features/todo/types.ts)

#### 実装セット implement_set_1_3: create-todo実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/create-todo/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/create-todo/handler.test.ts` (新規追加)
- エントリーポイント:
  - `src/routes/+page.server.ts` (修正)
    - 関数: `actions.create({ title: string }): Promise<{ success: boolean }>`
    - 実装前状態: Todo作成機能なし
    - 実装後状態: Todo作成フォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのTodoを作成する
    - 使用するPort: `TodoRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/create-todo/handler.test.ts`
    - テスト項目:
      - ログイン中のユーザーのTodoを作成できる
      - タイトルが空の場合はエラーがthrowされる
- 実装内容: ユーザーIDとタイトルを受け取り、Todoを作成します。
- 手順:
  - [x] createTodoテストを作成(src/lib/server/features/todo/command/create-todo/handler.test.ts)
    - ログイン中のユーザーのTodoを作成できる
    - タイトルが空の場合はエラーがthrowされる
  - [x] createTodoを実装(src/lib/server/features/todo/command/create-todo/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/command/create-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/create-todo/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/command/create-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] +page.server.tsにcreateアクションを追加(src/routes/+page.server.ts)
    - `actions.create`関数を実装
    - `locals.session`から`userId`を取得
    - フォームデータから`title`を取得（`FormData`から取得）
    - `title`のバリデーション（空文字チェック）
    - `createTodo(userId, title)`を呼び出し
    - エラーハンドリングを実装（エラー時は`fail`を返す）
    - 成功時は`redirect`または`invalidateAll`でページを更新
  - [x] 動作確認: サーバーを起動し、Todo作成が動作することを確認

#### 実装セット implement_set_1_4: list-todos実装

- 対象ファイル:
  - `src/lib/server/features/todo/query/list-todos/handler.ts` (新規追加)
  - `src/lib/server/features/todo/query/list-todos/handler.test.ts` (新規追加)
- エントリーポイント:
  - `src/routes/+page.server.ts` (修正)
    - 関数: `load({ locals }): Promise<{ todos: Todo[] }>`
    - 実装前状態: Todo一覧取得機能なし
    - 実装後状態: ログイン中のユーザーのTodo一覧が取得可能
    - 実装内容: ログイン中のユーザーのTodo一覧を取得する
    - 使用するPort: `TodoRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/query/list-todos/handler.test.ts`
    - テスト項目:
      - ログイン中のユーザーのTodo一覧を取得できる
      - 他のユーザーのTodoは取得できない
      - ログインしていない場合は空配列を返す
- 実装内容: ユーザーIDを受け取り、そのユーザーのTodo一覧を取得します。
- 手順:
  - [x] listTodosテストを作成(src/lib/server/features/todo/query/list-todos/handler.test.ts)
    - ログイン中のユーザーのTodo一覧を取得できる
    - 他のユーザーのTodoは取得できない
    - ログインしていない場合は空配列を返す
  - [x] listTodosを実装(src/lib/server/features/todo/query/list-todos/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/query/list-todos/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/query/list-todos/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/query/list-todos/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] +page.server.tsのload関数を修正し、todosを返すようにする(src/routes/+page.server.ts)
    - `load`関数内で`locals.session`から`userId`を取得
    - `userId`が存在する場合のみ`listTodos(userId)`を呼び出し
    - `userId`が存在しない場合は空配列を返す
    - 返り値に`todos`を追加（既存の`session`と合わせて返す）
  - [x] 動作確認: サーバーを起動し、Todo一覧が表示されることを確認

#### 実装セット implement_set_1_5: toggle-todo実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/toggle-todo/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/toggle-todo/handler.test.ts` (新規追加)
- エントリーポイント:
  - `src/routes/+page.server.ts` (修正)
    - 関数: `actions.toggle({ id: string }): Promise<{ success: boolean }>`
    - 実装前状態: Todo完了状態切り替え機能なし
    - 実装後状態: Todo完了状態切り替えフォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのTodoの完了状態を切り替える
    - 使用するPort: `TodoRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/toggle-todo/handler.test.ts`
    - テスト項目:
      - ログイン中のユーザーのTodoの完了状態を切り替えられる
      - 他のユーザーのTodoは切り替えられない
      - 存在しないTodoの場合はエラーがthrowされる
- 実装内容: Todo IDとユーザーIDを受け取り、完了状態を切り替えます。
- 手順:
  - [x] toggleTodoテストを作成(src/lib/server/features/todo/command/toggle-todo/handler.test.ts)
    - ログイン中のユーザーのTodoの完了状態を切り替えられる
    - 他のユーザーのTodoは切り替えられない
    - 存在しないTodoの場合はエラーがthrowされる
  - [x] toggleTodoを実装(src/lib/server/features/todo/command/toggle-todo/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/command/toggle-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/toggle-todo/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/command/toggle-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] +page.server.tsにtoggleアクションを追加(src/routes/+page.server.ts)
    - `actions.toggle`関数を実装
    - `locals.session`から`userId`を取得
    - フォームデータから`id`を取得（`FormData`から取得）
    - `id`のバリデーション（空文字チェック）
    - `toggleTodo(id, userId)`を呼び出し
    - エラーハンドリングを実装（エラー時は`fail`を返す）
    - 成功時は`redirect`または`invalidateAll`でページを更新
  - [x] 動作確認: サーバーを起動し、Todo完了状態切り替えが動作することを確認

#### 実装セット implement_set_1_6: delete-todo実装

- 対象ファイル:
  - `src/lib/server/features/todo/command/delete-todo/handler.ts` (新規追加)
  - `src/lib/server/features/todo/command/delete-todo/handler.test.ts` (新規追加)
- エントリーポイント:
  - `src/routes/+page.server.ts` (修正)
    - 関数: `actions.delete({ id: string }): Promise<{ success: boolean }>`
    - 実装前状態: Todo削除機能なし
    - 実装後状態: Todo削除フォームアクションが利用可能
    - 実装内容: ログイン中のユーザーのTodoを削除する
    - 使用するPort: `TodoRepository`
- 対象テストファイル:
  - `src/lib/server/features/todo/command/delete-todo/handler.test.ts`
    - テスト項目:
      - ログイン中のユーザーのTodoを削除できる
      - 他のユーザーのTodoは削除できない
      - 存在しないTodoの場合はエラーがthrowされる
- 実装内容: Todo IDとユーザーIDを受け取り、Todoを削除します。
- 手順:
  - [x] deleteTodoテストを作成(src/lib/server/features/todo/command/delete-todo/handler.test.ts)
    - ログイン中のユーザーのTodoを削除できる
    - 他のユーザーのTodoは削除できない
    - 存在しないTodoの場合はエラーがthrowされる
  - [x] deleteTodoを実装(src/lib/server/features/todo/command/delete-todo/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/command/delete-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] コードスタイルを参考にしながらリファクタリングを行う(src/lib/server/features/todo/command/delete-todo/handler.ts)
  - [x] `bun run test src/lib/server/features/todo/command/delete-todo/handler.test.ts`を実行しテストが通ることを確認する。テストが通らない場合はエラー内容を確認し、エラー内容に沿って修正を行う。
  - [x] +page.server.tsにdeleteアクションを追加(src/routes/+page.server.ts)
    - `actions.delete`関数を実装
    - `locals.session`から`userId`を取得
    - フォームデータから`id`を取得（`FormData`から取得）
    - `id`のバリデーション（空文字チェック）
    - `deleteTodo(id, userId)`を呼び出し
    - エラーハンドリングを実装（エラー時は`fail`を返す）
    - 成功時は`redirect`または`invalidateAll`でページを更新
  - [x] 動作確認: サーバーを起動し、Todo削除が動作することを確認

#### 実装セット implement_set_1_7: UI実装

- 対象ファイル:
  - `src/routes/+page.svelte` (修正)
- 実装内容: Todo作成フォーム、Todo一覧表示、完了状態切り替えボタン、削除ボタンを実装します。
- 影響ページ:
  - `/`: Todo一覧と操作UIを追加
- 手順:
  - [x] UI実装(src/routes/+page.svelte)
    - `data.todos`からTodo一覧を取得
    - Todo作成フォームを追加
      - `form`要素で`action={create}`を使用
      - `input`要素で`name="title"`を設定
      - `use:enhance`でフォーム送信を処理
    - Todo一覧を表示
      - `{#each}`でTodoをループ表示
      - 各Todoに`title`と`completed`状態を表示
    - 各Todoに完了状態切り替えボタンを追加
      - `form`要素で`action={toggle}`を使用
      - `input type="hidden" name="id"`でTodo IDを送信
      - `use:enhance`でフォーム送信を処理
    - 各Todoに削除ボタンを追加
      - `form`要素で`action={delete}`を使用
      - `input type="hidden" name="id"`でTodo IDを送信
      - `use:enhance`でフォーム送信を処理
    - エラーメッセージの表示（`$page.form`からエラーを取得）
  - [x] 動作確認: サーバーを起動し、UIが正しく動作することを確認

### 影響ページ

- `/` : Todo作成フォーム、Todo一覧表示、完了状態切り替え、削除機能を追加

### 確認すべき項目

#### ローカル確認できる項目

- Todo作成機能:
  確認すべき理由: 基本的なCRUD操作の一つであり、アプリの核心機能です。
  確認すべき内容: ログイン後、タイトルを入力してTodoを作成できること。作成後、一覧に表示されること。
  確認方法: ブラウザで`localhost:5007`にアクセスし、ログイン後、Todo作成フォームにタイトルを入力して送信。一覧に新しいTodoが表示されることを確認。

- Todo一覧表示機能:
  確認すべき理由: 作成したTodoが正しく表示されることを確認する必要があります。
  確認すべき内容: ログイン中のユーザーのTodoのみが表示されること。他のユーザーのTodoは表示されないこと。
  確認方法: 複数のユーザーアカウントでログインし、それぞれのTodoが正しく表示されることを確認。

- Todo完了状態切り替え機能:
  確認すべき理由: Todoの状態管理が正しく動作することを確認する必要があります。
  確認すべき内容: 完了状態を切り替えられること。切り替え後、状態が永続化されること。
  確認方法: Todoの完了状態切り替えボタンをクリックし、状態が変更されることを確認。ページをリロードしても状態が保持されることを確認。

- Todo削除機能:
  確認すべき理由: 不要なTodoを削除できることを確認する必要があります。
  確認すべき内容: 自分のTodoを削除できること。他のユーザーのTodoは削除できないこと。
  確認方法: Todoの削除ボタンをクリックし、Todoが削除されることを確認。他のユーザーのTodoの削除を試み、エラーが発生することを確認。

#### デプロイ環境でのみ確認できる項目

- なし（すべてローカルで確認可能）

