# このサンプルの設計

採用規約は noaqh-dev の architecture.md v2.1.0。
参照元: [noaqh-dev-plugin / architecture.md](https://github.com/noaqh-corp/noaqh-dev-plugin/blob/0fc641f0b319f482858a054ffcb775dca0fe858f/plugins/noaqh-dev/docs/architecture.md)。全文の閲覧には同リポジトリへのアクセスが必要です。プラグイン利用時は同梱ファイルを参照できます。

この文書はサンプルへの適用説明であり、新しい規約ではありません。

## このサンプルが示すこと

- `schema.zmodel` をモデルの原本とし、`Todo` の所有を `task-management` と宣言します。認証基盤のモデルは業務パッケージの所有判定から除きます。
- 入力の検証と認証済み利用者の取得はSvelteKitの境界で行います。
- 業務判断を持たない作成・一覧・完了状態の指定・削除は、presenterからContainer経由でRepositoryを呼びます。転送するだけのcommand/queryは作りません。
- DB接続はproviders、永続化はadapter、契約はportに置きます。モデル型は所有パッケージのtypes.tsから参照します。
- 通常実行はPrisma実装を使い、テストでMockを差し替えます。DBを使うテストは専用の一時DBに閉じます。

## 機能を足すとき

1. 要件の受入条件を短く書き、読むモデル・書くモデル・所有パッケージを特定します。
2. 正典 §3 の決定木で配置を決めます。業務判断がある処理はoperation、薄いCRUDはpresenterが基本です。同じモデルへの既存の判断付き書込み経路がある場合は、判断を迂回する経路を追加しません。
3. 操作単位の判断や拒否結果をテストし、lint・型検査・必要な境界の確認を実行します。

複数Repositoryを使うだけでflowを作りません。単一パッケージへの多段書込みはcommand、複数パッケージの単純な読みはpresenter合成です。flowが必要な案件では、正典 §2-3 の採用条件を改めて確認します。

このサンプルはCRUDを中心とするため、flow・外部Service・複数パッケージをまたぐ業務処理の完成例は含みません。空の層も生成しません。

## lintの適用範囲

試行用の `@noaqh/lint/config/architecture` は、機能間のimportとfeaturesからflowsへのimportを検査します。業務判断の正しさ、書込み所有、全レイヤーの依存、operationの独立性をすべて機械検査するものではありません。

正典 §7 が指定する eslint-plugin-boundaries と既存noaqh-lintの実装手段の違いは、正式採用前の議論事項です。このサンプルで既存ルールの修正版を試すことを、正典全体への機械的な適合保証とは扱いません。
