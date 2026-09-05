> 独立した隔離環境での試行記録です。本文のローカルcommit・パス・タグは当時のものです。公開した初期構成は `feabde6856dc25b77559c323df9b5231c8bca0b7`、統合時の補足は [integration.md](integration.md) を参照してください。

# タイトル編集の実装結果

実施日: 2026-09-05。機能は実装済み。サーバー・永続化・SSRフォームの検証は成功し、ブラウザ上の入力操作・enhance・外観は環境制約で未検証。

## 基準と対象

- 対象: `/workspace/scratch/288e23dc9885/trials/title-edit`。
- 基準commit: `78d41db2fb36b0497f66957165cd52be2e6b79e7`（`title-edit-baseline`）。作業開始時の差分は計画ファイルのみ。
- サンプル起点: `2f89114c4ded8e090b16cd01e839a5fbd8fbb07b`。初期化の再現条件・15件の基礎テスト・128項目のHTTP確認は `initialization.md`。
- 使用スキル: arch-plan → arch-implement。正典は計画記載のarchitecture v2.1.0。

| 変更ファイル | 内容 |
| --- | --- |
| `src/routes/+page.server.ts` | title schemaを作成と共有。`rename` actionがsessionのuserIdとIDで既存Repository.updateを呼び、titleだけを更新する。認証・入力・対象不在を401/400/404のaction結果で返す。 |
| `src/routes/+page.svelte` | 各行に現在タイトルを持つ入力欄と保存ボタンを置き、`?/rename` form actionへ接続。入力ラベル・既存エラー表示・完了表示を維持。 |
| `src/routes/page.server.test.ts` | 正規化、非文字列などの拒否、所有者偽装、完了状態維持を4件追加。未認証は全actionsの既存テストで検証。 |
| `tests/repository-contract.ts` | 完了/未完了でtitleだけを更新したときの保存済み属性を、Prisma/Mockに共通適用する2件ずつの契約を追加。 |
| `README.md` | 編集・保存の操作と正規化・空文字拒否・完了状態保持を記載。 |
| `docs/plans/rename-todo/` | 計画と結果、検証ログ。HTTP検証用スクリプトは基準commitで準備済み。 |

配置は計画どおりpresenter → Container → 既存Repository。業務判断や新規モデルはなく、command/query/flow・型・port・adapter・DBスキーマ・依存の追加はない。計画からの機能変更はない。

## 受入条件の結果

| ID | 結果 | 証拠・範囲 |
| --- | --- | --- |
| AC-1 | サーバー/保存/SSR成功、ブラウザ操作未検証 | 実HTTPのrename送信後に再取得したSSR input.valueが変更後タイトルと一致。Prisma/Mockでも取得値を確認。 |
| AC-2 | 成功 | presenterで半角/全角/タブ/改行の前後空白を除去。実HTTPで正規化後の保存値を確認。内部の空白は保持。 |
| AC-3 | 成功 | 空文字・空白・title欠落/Blob・ID欠落/空文字の400拒否と保存状態不変。実HTTPでも空文字/空白を拒否。 |
| AC-4 | 成功 | 未ログインの全actionsの401と実HTTPのrename 401を確認。 |
| AC-5 | 成功 | 他人/不存在で同じ404、偽装したuserIdを採用しない。元データ不変と2ユーザーの一覧隔離を確認。 |
| AC-6 | 成功 | completed=false/trueの両方で維持。フォームにcompleted/userIdを混入しても採用せず、ID・作成日時・所有者も維持。 |
| AC-7 | 成功 | 既存の作成・一覧・完了/未完了・削除テストと実HTTPの再読込が成功。 |

## 実行した検証

Bun 1.4.2をPATHに追加し、不要なPrisma更新確認通信を避けるため `CHECKPOINT_DISABLE=1` を設定した。

| コマンド | 結果 | 証跡 |
| --- | --- | --- |
| `bun run test src/routes/page.server.test.ts`（実装前） | 想定どおり失敗: rename未定義で4 failed / 5 passed | `red-test.log` |
| `bun run db:generate` | 成功、追跡済みスキーマ差分なし | `final-db-generate.log` |
| `bun run lint` | 成功 | `final-lint.log` |
| `bun run check` | 0 errors / 0 warnings | `final-check.log` |
| `bun run test` | 3 files / 23 tests passed、一時DB生成・削除 | `final-test.log` |
| `bun run build` | 成功 | `final-build.log` |
| `RENAME_ENABLED=1 bun docs/plans/rename-todo/run-http-smoke.ts` | 216 checks passed、認証・CRUD・所有者隔離・rename | `final-http.log` |
| `git diff --check` | 成功 | 空白エラーなし |

HTTP確認は実際のBetter Auth登録/ログアウト/ログインを使い、Cookie付きのフォーム送信とSSR再取得を経由した。enhance用JSONのfailureはHTTP 200の包みなので、action結果のstatusとtypeで401/400/404を検証している。

HTTP確認のサーバーはlocalhost:5007で起動し、5秒経過後に確認を開始した。検証後に自分のプロセスだけ停止。`logs/app.log`をその後に読み、アプリ例外がないことを確認した。末尾のexit 143は意図したSIGTERMによる停止で、Browserslist/baseline-browser-mappingの鮮度警告は基準状態にもある。

## 残件と引継ぎ

- 確定した今回の実装不具合・規約違反: なし。ただし別工程のアーキテクチャレビューは未実施。
- 環境待ち/未検証: Browserがlocalhostを `net::ERR_BLOCKED_BY_CLIENT` で拒否した。実ブラウザでログインし、入力→保存→エラー表示と再読込、完了済みの編集、enhance経路と外観を確認する。AC-1の画面操作まで完了したとは扱わない。
- 任意の改善: 今回はなし。データ鮮度の依存警告は本機能の修正範囲外。
- レビューの入口は本書・`plan.md`・基準commitとの差分。rawログとHTTPスクリプトは中間評価の再現用証跡。push、PR、公開、外部投稿、自動レビューは実行していない。
