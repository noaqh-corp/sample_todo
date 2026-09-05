> 独立した隔離環境での試行記録です。本文のローカルcommit・パス・タグは当時のものです。公開した初期構成は `feabde6856dc25b77559c323df9b5231c8bca0b7`、統合時の補足は [integration.md](integration.md) を参照してください。

# 初期化記録

実施日: 2026-09-05。作成先: `/workspace/scratch/288e23dc9885/trials/title-edit`。

## 起点と採用版

- 起点: ローカル `sample_todo` の `2f89114c4ded8e090b16cd01e839a5fbd8fbb07b`。`git archive` で追跡ファイルだけを空の作成先へ取り込んだ。起点の作業ツリーに差分はなかった。`.git`、依存、DB、認証情報、生成物のコピーは行っていない。
- 使用スキル: ローカル `noaqh-dev-plugin/plugins/noaqh-dev/skills/arch-init/SKILL.md`。このスキルはプラグインの未commit作業ツリーにある試行版。
- 正典: architecture v2.1.0。プラグインcommit `c8ceddaee61b63d926666076e0d05d421e0ac16c` と一致する同梱文書を読んだ。参照先とSHA-256は `docs/architecture.md` に記録した。サンプルに記載された古い参照commitはローカル取得できず、取得できた同版の正典を明示した。
- 確認節: §1-3、§2-1、§3、§7、および今回のpresenter・Repository・テストに対応する節。
- Todoの所有: `schema.zmodel` の `@package task-management`。User/Session/Accountは認証基盤モデル。公開モデル型は `features/task-management/types.ts`、portは `port/repository/`。旧 `features/todo` / `shared/port` は存在しない。
- 機能追加前の状態をローカルgitにcommitし、タグ `title-edit-baseline` を付ける。実際のcommit IDは後続の `plan.md` と `implementation.md` に記録する。`git rev-parse title-edit-baseline` で再現できる。

## 初期プロジェクトへの調整

アプリ名・package/lockfileのworkspace名を `title-edit-todo` とし、READMEに目的・起点・検証場所を記した。AGENTSに正典・モデル所有の確認先・計画/レビュー入口を追加し、環境変数例に別port時の対応を追記した。DBスキーマや認証・CRUDの実装は変更していない。

## 実行と結果

Bunは `/workspace/scratch/288e23dc9885/tools/bun/package/bin/bun`、実測 `1.4.2`。以降はそのbinをPATH先頭に追加した。

| 手順 | 実測結果・証跡 |
| --- | --- |
| `bun install --frozen-lockfile` | ネットワーク承認取消で実行が中断。後続のオフライン実行で完了を確認した。 |
| `bun install --offline --frozen-lockfile` | 成功。Bunのキャッシュとlockfileから385 installs / 440 packagesを確認。`initial-install.log`。 |
| `CHECKPOINT_DISABLE=1 bun run setup` | setup自体は初回に環境変数なしで成功。新しい `.env`、ランダムsecret、ZenStack/Prisma型を生成し、SQLite `prisma/dev.db` に既存2 migrationを適用した。Prismaの更新確認通信を避ける再現手順には `CHECKPOINT_DISABLE=1` を付ける。 |
| `CHECKPOINT_DISABLE=1 bun run lint` | 成功。`initial-lint.log`。 |
| `CHECKPOINT_DISABLE=1 bun run check` | 0 errors / 0 warnings。`initial-check.log`。 |
| `CHECKPOINT_DISABLE=1 bun run test` | 3 files / 15 tests passed。新規一時DBを生成・削除。`initial-test.log`。 |
| `CHECKPOINT_DISABLE=1 bun run build` | 成功。`initial-build.log`。 |
| `CHECKPOINT_DISABLE=1 bun docs/plans/rename-todo/run-http-smoke.ts` | 128 checks passed。`initial-http.log`。 |

HTTP検証は同じ実行プロセス環境内で `bun run dev` をlocalhost:5007に起動し、5秒後に開始した。未認証の `/`・`/register`・`/login` を確認し、実際のBetter Auth入口で2人の架空検証ユーザーを登録→ログアウト→再ログイン。Cookieを通したSSRとactionsで作成・再読込・完了/未完了・削除、別ユーザーの読み書き隔離を確認した。Todoは後片付けし、検証ユーザーだけが無視対象のローカル開発DBに残る。secret・Cookie・DBはcommitしない。

`run-http-smoke.ts` は自分で起動したサーバーだけSIGTERMで停止する。ログ末尾のexit 143はこの正常な後片付けである。`logs/app.log` は起動5秒後を越えた検証終了時に確認した。アプリの例外はなく、Browserslist/baseline-browser-mappingのデータ鮮度に関する既存警告がある。

## 失敗の切り分けと未検証

- この実行環境では別execから既存サーバーへのloopback接続が拒否された。同一execからサーバー起動とHTTP確認を行うスクリプトで再現可能にした。
- 最初のHTTPテストはSvelteKitのenhance用JSONに対してHTTP 404を期待し失敗。インストール済み `@sveltejs/kit/src/runtime/server/page/actions.js` で、failureもHTTP 200の包みに `status:404` が入る仕様を確認し、HTTP 200とaction内status/typeの両方を検証するよう訂正した。拒否の期待自体は維持した。
- Browserスキルで起動したブラウザは `http://localhost:5007/` を `net::ERR_BLOCKED_BY_CLIENT` で開けなかった。SSRフォームとHTTP経路は検証済みだが、ブラウザ上の登録・ログイン・enhance操作・外観は未検証。画面動作を検証済みとはしない。
- 自動レビュー、push、PR、外部投稿は実施していない。レビューは依頼どおり別工程。
