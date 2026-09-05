> 独立した隔離環境での試行記録です。本文のローカルcommit・パス・タグは当時のものです。公開した初期構成は `feabde6856dc25b77559c323df9b5231c8bca0b7`、統合時の補足は [integration.md](integration.md) を参照してください。

# 実装計画: 自分のTodoのタイトル編集

## 目的と受入条件

一覧で自分のTodoのタイトルを書き換えて保存でき、再読込後も正規化済みの値が残る。

| ID | 条件・入力 | 観測する結果 | 検証方法 |
| --- | --- | --- | --- |
| AC-1 | 自分のTodoのタイトルを編集・保存 | 指定したタイトルが再読込後にも残り、一覧に編集欄と保存ボタンがある | presenter、Prisma/Mock契約、実HTTP/SSR |
| AC-2 | 前後に半角・全角空白、タブ、改行を含むタイトル | `trim()` 後の値だけを保存する | presenter、実HTTP/SSR |
| AC-3 | 空文字、空白だけ、title欠落・非文字列、id欠落・空文字 | 400の拒否結果を返し、既存データを変更しない | presenter、実HTTPの空文字/空白 |
| AC-4 | 未ログインで編集 | 401の拒否結果で変更しない | 全actionsを対象にした既存presenterテスト、実HTTP |
| AC-5 | 他人のTodoまたは存在しないIDを編集。フォームのuserIdを偽装 | どちらも404の拒否結果。所有者のTodoと一覧の隔離を維持 | presenter、既存Repository隔離契約、実HTTP |
| AC-6 | 未完了/完了済みを編集。completedやuserIdをフォームに混入 | タイトルのみ更新し、完了状態・所有者・ID・作成日時を維持する | presenter、Prisma/Mock部分更新契約、実HTTP/SSR |
| AC-7 | 既存の作成・一覧・完了/未完了・削除 | 引き続き動作する | 既存テストと実HTTP |

SvelteKitのenhance向けJSON応答ではHTTP 200の包みの `status` / `type` に拒否結果が入る。上記の401/400/404はaction結果のコード。通常HTMLフォーム送信のHTTPコードはフレームワークが反映する。

## 範囲と前提

- 対象: 認証済みTodo一覧に編集フォームを追加し、既存のRepositoryのタイトル部分更新へ接続する。
- 対象外: DBスキーマ変更、名前の最大長や重複禁止など未指定の制約、編集履歴、権限管理の追加、同時編集検出、公開・push・PR・自動レビュー。
- 正典: architecture v2.1.0。`docs/architecture.md` に記録したプラグインcommit `c8ceddaee61b63d926666076e0d05d421e0ac16c` の同梱文書。読んだ節は§1-3、§2-1の所有規則、§3、§7、presenterの§2-4/§5、port/adapterの§4、テストの§10/§11。
- 基準commit: `78d41db2fb36b0497f66957165cd52be2e6b79e7`（ローカルタグ `title-edit-baseline`）。計画開始時の作業ツリーはclean。サンプルの起点は `2f89114c4ded8e090b16cd01e839a5fbd8fbb07b`。
- 仮定: 表示中の各Todoに直接入力欄と保存ボタンを置く。競合時は最後のタイトル保存を採用する。タイトル更新にcompletedを含めないので別途の完了変更を上書きしない。要件上の未決事項はない。

## 配置判断

| 処理 | 読むモデル | 書くモデルと所有 | 副作用・業務判断 | 配置先と根拠 |
| --- | --- | --- | --- | --- |
| 入力/認証とタイトル保存 | 認証済みSessionのuserId。Todoの事前取得は不要 | Todo.title、所有はtask-management | DBへの書込みあり。空白除去・必須判定は入力検証、所有者の絞込みは認証境界。状態遷移の判断や外部副作用はない | §3(1)書込み→(2)Todo所有→(3)1パッケージかつ薄い書込み→(5)presenter。`+page.server.ts` の `actions.rename` からContainer経由で既存Repository.updateを呼ぶ |
| 一覧の入力と保存結果 | Todo（既存loadから） | なし | 表示とフォーム送信のみ | §5のSvelteKit form actions。`+page.svelte` に `?/rename` と `use:enhance` |

既存のTodo書込みには判断付きoperationが存在せず、presenter直の作成・完了指定・削除だけである。判断を迂回する第二の経路は作らない。`TodoRepository.update({id,userId},{title})` が既にあり、Prisma実装は所有者条件付き `updateMany` を使う。独立のrename command、flow、port、adapterメソッド、入力/結果専用型やモデル型のコピーは不要。

## 変更と検証

読むファイル: `AGENTS.md`、`docs/architecture.md`、`schema.zmodel`、`src/routes/+page.server.ts`、`+page.svelte`、`page.server.test.ts`、`src/lib/server/container.ts`、`port/repository/TodoRepository.ts`、Prisma/Mock実装と契約テスト、`package.json`、`scripts/test.ts`、`vite.config.ts`。

変更するファイル:

- `src/routes/page.server.test.ts`: 受入条件の正規化・拒否・偽装・状態保持を追加。
- `tests/repository-contract.ts`: タイトルだけの更新で他属性が維持される契約をPrisma/Mock共通で確認。
- `src/routes/+page.server.ts`: createと共有するタイトル入力schemaを合成し `rename` actionを追加。sessionのuserIdで絞り、titleだけを渡す。
- `src/routes/+page.svelte`: 既存タイトル表示を現在値を持つ編集フォームへ置き換える。inputのラベル、保存ボタン、既存エラー表示を使用する。
- `README.md`: タイトルの編集手順と対象範囲を説明。
- `docs/plans/rename-todo/`: 計画、実装結果、検証ログを保存。初期化時に用意したHTTPスクリプトを `RENAME_ENABLED=1` で使う。

実装順序: (1) presenterと契約テストを追加→実行してrename未実装の失敗を確認。(2) actionとUIを実装。(3) 型生成・lint・型検査・テスト・build。(4) 実認証とSSR/form action経由の確認を実行して結果を記録。

```sh
export PATH=/workspace/scratch/288e23dc9885/tools/bun/package/bin:$PATH
export CHECKPOINT_DISABLE=1
bun run test src/routes/page.server.test.ts # Red確認
bun run db:generate
bun run lint
bun run check
bun run test
bun run build
RENAME_ENABLED=1 bun docs/plans/rename-todo/run-http-smoke.ts
```

前提は初期化済みのローカルSQLiteと `.env`、frozen-lockfileで用意した依存。DBテストは既存スクリプトにより新規一時DBを使う。HTTP確認は隔離プロジェクトの開発DBだけを使い、同じ実行環境内で自分のサーバーを起動/終了する。使用portが埋まっていれば別portにして `.env` の認証URLも合わせる。他プロセスは終了しない。

未検証になりうる範囲: BrowserがローカルURLを `net::ERR_BLOCKED_BY_CLIENT` で拒否したため、ブラウザ上のenhance・入力操作と外観は環境制約として残る。SSRフォームやHTTP保存の結果でブラウザ操作そのものを確認済みとはしない。

## 完了条件

AC-1〜7のサーバー境界・永続化を検証し、機械検証が成功していること。確認した経路と未検証のブラウザ操作を分けて報告し、別工程のレビューへ基準commit・対象差分・証跡を渡す。
