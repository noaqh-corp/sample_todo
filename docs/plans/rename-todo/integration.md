# 試行からの取り込み

独立したエージェントがarch-init / arch-plan / arch-implementを使い、初期化、計画、タイトル編集を実施した。ここに保存したplan・initialization・implementation・ログはその試行の記録である。

- 試行の起点はローカルsample移行commit `2f89114c4ded8e090b16cd01e839a5fbd8fbb07b`、隔離環境の機能追加前commitは `78d41db2fb36b0497f66957165cd52be2e6b79e7`。
- 公開して再利用する初期構成は `feabde6856dc25b77559c323df9b5231c8bca0b7`。同じ移行に、生成Zodスキーマから入力検証を派生させる補正を含む。
- アプリ名や一時環境の絶対パスなど、隔離試行用の設定変更は元サンプルへ取り込まない。
- 新規actionとフォーム、受入テストを取り込み、titleSchema/idSchemaは公開初期構成の生成Zod由来を維持した。業務要件・配置・拒否条件は変更していない。
- 正典のローカルsnapshot `c8cedda...` は、元リポジトリ `0fc641f0b319f482858a054ffcb775dca0fe858f` のarchitecture.mdと同じblob `ba64b7adfa8463cac5e60daaa1a258ada742a90b` を持つ。採用版はv2.1.0のままである。

## 再現用の確認

BunがPATHにある環境で、READMEの導入・setup後に実行する。

```sh
CHECKPOINT_DISABLE=1 bun run verify
RENAME_ENABLED=1 CHECKPOINT_DISABLE=1 bun docs/plans/rename-todo/run-http-smoke.ts
```

HTTPスクリプトはローカル開発DBに架空の検証ユーザーを作る。隔離した検証コピーで使用する。実装試行の初期/最終ログは `initial-*.log` / `final-*.log`。基盤の補正を含む統合後の確認は `integration-*.log` に残す。HTTP経路の成功はブラウザ操作・外観の確認を意味しない。

## 統合後の実測

- `CHECKPOINT_DISABLE=1 bun run verify`: 終了コード0。型生成・lint・型検査（0 errors / 0 warnings）・23テスト・ビルド成功。
- `RENAME_ENABLED=1 CHECKPOINT_DISABLE=1 bun docs/plans/rename-todo/run-http-smoke.ts`: 終了コード0。登録、再ログイン、CRUD、所有者隔離、タイトル編集・拒否・完了状態保持をHTTP経路で確認。ログの216はassertion数であり、独立したテストシナリオ数ではない。
- サーバーは検証後に停止。ログのvite終了143は検証用プロセスのSIGTERMによる。
- ブラウザ入力・enhance・外観は未検証。初期化時の接続制約をHTTPの成功で置き換えない。

## 独立レビューからの限定修正

- 初回の独立レビューは確定Blockerなし、必須UI確認が残るため `INCOMPLETE`。保存値が変わらない場合の既定enhanceによるフォームresetと入力更新の組合せを、具体的な未検証事項U-01として報告した。
- renameフォームだけ `update({ reset: false })` を指定し、保存後の自動resetを止めた。サーバー処理・入力検証・Repositoryは変更していない。
- 修正後の `bun run check` / `bun run build` は終了コード0。結果は `recheck-build.log`。前節の23テストとHTTP結果は、このフォーム修正前の統合結果として区別する。
- 初回記録は `review.md`、前回指摘と修正影響だけの再確認は `review-recheck.md`。ブラウザでの保存・同値再保存・前後空白・拒否後の再編集は、実ブラウザの証拠が得られるまで未検証のまま扱う。
