# タイトル編集のレビュー

## 判定

INCOMPLETE

今回の実装について、確定したBlockerはない。サーバー境界と永続化は受入条件を満たす証拠があるが、必須のUI動作確認が残る。特に、正規化後のタイトルが保存済み値と同じ場合の保存後表示を確認する必要がある。

## 比較基準・対象

- 比較基準: `684a24641f4902aba2a8d1f6f09582fc7a476ea5`。レビュー開始時のHEADも同一。基準から作業ツリーまでの差分と未追跡ファイルを確認した。
- 実装対象: `src/routes/+page.server.ts`、`src/routes/+page.svelte`、`src/routes/page.server.test.ts`、`tests/repository-contract.ts`、`README.md`。
- 計画: `docs/plans/rename-todo/plan.md`。統合時の差異と最終結果は`integration.md`、`integration-verify.log`、`integration-http.log`を優先した。その他の同ディレクトリの記録は隔離試行の証跡として扱った。
- 規範: `AGENTS.md`、`docs/architecture.md`で採用されたarchitecture v2.1.0。プラグイン同梱正典のblobは`ba64b7adfa8463cac5e60daaa1a258ada742a90b`で、統合記録の採用版と一致した。§1-3、§2-1、§3、§4、§5、§7〜11の関連規則を確認した。
- 所有宣言、Container、RepositoryのportとPrisma/Mock実装は配置・契約の根拠として読んだ。これらの既存実装や既存lint方式の全体監査は対象に追加していない。

## 確認した証拠

| 観点 | 確認結果と根拠 |
| --- | --- |
| 配置・依存 | `Todo`の所有は`task-management`。`rename`は入力検証と単一モデルの部分更新で、既存の判断付きoperationを迂回しない。§3(5)・§5に従いactions内でContainerから既存Repositoryを取得する。loadへの副作用や新しい層・型・DB変更はない。 |
| 正規化・拒否 | 生成Zod由来のタイトルschemaをcreateと共有し、`trim().min(1)`を適用する。presenterテストは半角・全角空白、タブ・改行、空文字、空白のみ、欠落、Blob、不正IDの拒否と保存状態不変を確認する。 |
| 認証・所有者隔離 | sessionのuserIdとIDを更新条件に使い、フォームのuserIdを採用しない。未認証401、他人と不存在404をテストする。Prismaの`updateMany({ where, data })`と共通契約でも所有者条件を確認した。 |
| 部分更新 | 更新値はtitleだけ。presenterとPrisma/Mock契約は完了・未完了の両方、所有者・ID・作成日時の維持を確認し、混入したcompletedを採用しない。 |
| 画面の接続 | 各行にID・現在タイトル・保存ボタンを持つ`?/rename`フォームを追加し、既存のエラー表示を使用する。HTTPスクリプトは保存後のSSR入力値と完了状態を再取得して確認する。ブラウザでの入力・enhance実行の証拠ではない。 |

`integration-verify.log`は型生成、lint、型検査0 errors / 0 warnings、3ファイル・23テスト、buildの成功を示す。`integration-http.log`の216はassertion数であり、登録・再ログイン、既存CRUD、rename、所有者隔離のHTTP経路が成功している。停止時の143は検証プロセスへのSIGTERMとして記録されている。これらの検証コマンドはレビューで再実行していない。

追加確認は下記U-01の具体的な疑いに限定した。Bunで開発サーバーを起動し、control-browserで`http://localhost:5007`への接続を試みたが、`net::ERR_BLOCKED_BY_CLIENT`で失敗した。起動から5秒以上経過後の`logs/app.log`を確認し、自分で起動したサーバーを停止した。限定的なSvelteランタイム確認の結果もU-01に記す。アプリコードは編集していない。

## Blocker

なし。

## Suggestion

なし。

## Unverified

### U-01: enhance経由の保存後表示とUI動作確認

- 箇所: `src/routes/+page.svelte`のrenameフォーム（127行の`use:enhance`、134行の`value={todo.title}`）。
- 必須確認の根拠: `AGENTS.md`9〜10行のUI変更時の動作確認・未実行を完了扱いにしない規則、およびAC-1の画面からのタイトル編集。`integration.md`27行にもブラウザ入力・enhance・外観の未検証が明記されている。
- 具体的な疑い: インストール済みSvelteKitの既定enhanceは成功時にフォームをresetしてからloadを再実行する。一方、Svelteの生成コードが呼ぶ`set_value`は直前と同じ値ならDOM更新を省く。正規化後のタイトルが以前と同じ場合、フォームのreset後に入力表示が空欄のまま残る可能性がある。通常のタイトル変更が成功することや、SSRの再取得だけではこの組合せを確認できない。
- 追加確認で観測した事実: ローカルの実際の`set_value`をBunで呼び、初期値`Todo A`を設定後、reset相当のvalue初期化を行うと、再度`Todo A`を設定しても空欄のまま、`Todo B`に変えると更新された。これは値更新のキャッシュ動作だけの限定確認で、ブラウザのフォーム送信・reset・画面再描画を一体で再現した結果ではないため、不具合として確定していない。
- 必要な追加証拠: 実ブラウザでタイトルを変更して保存した後、同じタイトルの再保存、および前後空白だけを追加した保存を行い、正規化済みタイトルが入力欄に残ることを確認する。新規作成した行と再読込した行、完了済みの行も対象とし、空白だけの拒否時のエラー表示と再編集を確認する。
- 上記の症状を再現した場合の最小方針: 編集フォームのresetと入力表示の同期を調整し、サーバーが正規化した保存値を表示へ確実に反映する。その後、この事項に限定して再確認する。

今回が初回レビュー。UIの追加証拠または修正後の再確認では、本記録のU-01と修正に伴う影響を対象にする。
