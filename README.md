# noaqh Todo サンプル

noaqh-dev のアーキテクチャ v2.1.0 に沿って、認証付き Todo を小さく実装するサンプルです。計画・実装・レビュー・lint を実際に試す基準リポジトリとして使います。

## 起動

Bun 1.3.5 以降を使います。SQLite のため、DB サーバーは不要です。

```sh
bun install --frozen-lockfile
bun run setup
bun run dev
```

`http://localhost:5007` を開き、新規登録後に Todo を作成します。`setup` は未作成の場合だけ `.env` と開発用のランダムな認証 secret を作り、型生成とマイグレーションを実行します。既存の `.env` は保持します。`.env.example` から手動作成する場合、`BETTER_AUTH_SECRET` を生成して設定してください。

## 配置

採用版、正典の参照先、判断の基準は [docs/architecture.md](docs/architecture.md) を参照してください。

| 場所 | 責務 |
| --- | --- |
| `schema.zmodel` | DB 定義、Todo の所有パッケージ `task-management` |
| `src/routes/+page.server.ts` | 入力検証、本人の Todo の CRUD、レスポンス |
| `src/lib/server/features/task-management/types.ts` | 生成した Todo 型の公開 |
| `src/lib/server/port/repository/TodoRepository.ts` | 保存・検索の契約 |
| `src/lib/server/adapter/repository/` | Prisma 実装とテスト用 Mock |
| `src/lib/server/container.ts` | 接続と実装の配線、テスト差し替え |
| `src/lib/server/providers/` | Prisma と Better Auth の初期化 |

現在の Todo 操作には業務判断がないため、command/query/flow は作りません。完了操作は画面から希望する状態を送り、同じリクエストの再送で逆転しない更新です。並び順は presenter で明示し、同時刻の場合は ID で順序を確定します。

認証用の User/Session/Account は基盤管理モデルとして所有宣言の対象外です。Prisma スキーマと型は `bun run db:generate` で再生成します。スキーマ変更時のマイグレーションは `bunx --bun prisma migrate dev --name <変更名>` で作成してください。

## 検証

```sh
bun run db:generate
bun run lint
bun run check
bun run test
bun run build
# 全体をまとめて実行
bun run verify
```

`bun run test` は毎回新しい一時 SQLite DB にマイグレーションし、完了後に削除します。既存の `DATABASE_URL` はテスト用に置き換えます。直接 `vitest` を実行した場合は DB テストを拒否します。

Prisma と Mock に同じ契約テストを適用し、他人の Todo の読み書き防止、明示的なソート・ページ範囲、状態の永続化を確認します。presenter では未ログイン、入力検証、userId の偽装、同じ完了更新の再送を確認します。

開発ログはリポジトリ内 `logs/app.log` です。ビルド成功は型検査・テスト・画面確認の代わりにはなりません。未実施の確認は未実施として残します。

初期リポジトリの `spec/1-todo/` は履歴資料です。そこにあるチェック済みの項目は今回の検証証跡には使いません。
