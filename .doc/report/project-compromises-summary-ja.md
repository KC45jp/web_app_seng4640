# 今回のプロジェクトでの妥協点・割り切りまとめ

このメモは、各 `.md` に散らばっていた「今回のプロジェクトでどこを割り切ったか」「何を後回しにしたか」を、最終レポートや発表で使いやすいようにまとめたものです。

## 結論

今回のプロジェクトでは、**限られた時間・予算・運用負荷の中で、まず要求の中核である「役割別 EC サイト」と「Flash Sale での oversell 防止」を成立させることを優先**しました。

そのため、長期運用ではより自然な選択肢がある部分でも、今回は以下のような現実的な妥協をしています。

実際の staging 構成としては、

- 1 台の EC2 インスタンス上で frontend と backend を動かす
- backend: その EC2 上の single-node k3s
- frontend: 同じ EC2 上の別 Docker container
- MongoDB: backend と別レイヤ

というハイブリッド構成になっています。

## 1. インフラ構成の妥協

### 1 台の EC2 に寄せ、backend も single-node k3s に留めた

今回の staging では、frontend と backend を 1 台の EC2 インスタンス上に集約し、backend はその中の single-node k3s で動かす形を採用しました。frontend は同じ EC2 上の Docker container として動かし、MongoDB は別レイヤで扱っています。

ここで重要なのは、**frontend と backend が同じコンテナに入っているわけではない**という点です。実際には backend は k3s の Pod 側、frontend は別 Docker container 側ですが、**どちらも同じ 1 台の EC2 ホストに同居している**のが staging の実態です。

今回の妥協点としてより本質的だったのは、**サービスをホスト単位で分離せず、単一 EC2 に寄せたこと**と、**k3s も multi-node ではなく single-node に留めたこと**です。

この判断の理由は次の通りです。

- まずは Flash Sale の整合性や role-based EC 機能を成立させることが優先だった
- backend 側だけでも `Deployment`、`Service`、`Secret`、health check、外部 DB 接続などを重点的に学べる
- multi-node 化や host 分離まで進めると、構築・監視・トラブルシュートの負荷が大きく増える
- frontend、backend、DB をそれぞれ独立基盤として分けるより、まずは説明可能で再現しやすい staging を作るほうが重要だった

つまり、**「複数ノード・複数ホストに分けた本格構成」よりも、「1 台で確実に動く staging を作る」ことを優先した**という妥協です。

### オーケストレーションの完全統一は後回しにした

frontend は静的 SPA に近い構成ですが、staging では同じ EC2 上の Docker container として動かしています。そのため、今回後回しにしたのは Docker 化そのものではなく、**frontend も含めて deployment 経路を完全に統一し、さらに host 分離まで行うこと**でした。

この判断は、

- 静的 frontend は backend ほど Kubernetes 学習の中心ではない
- 同一ホスト上の EC2 + Docker でも課題要件を満たすには十分だった
- 単体の静的 frontend なら CDN 系の配布のほうが自然なことも多い
- backend と比べて Kubernetes 学習上の優先度が低い
- frontend を k3s / Ingress / CDN まで含めて最適化したり、frontend/backend を別ホスト化したりするより backend の安定化を優先したい

という理由によるものです。

つまり、**frontend は Docker で実運用しつつも、staging 全体を multi-node / multi-host 前提の統一構成へ発展させることは将来改善項目に回した**、という割り切りです。

### MongoDB の Kubernetes 運用は後回しにした

MongoDB を Kubernetes 上で本格的に運用するには、`StatefulSet`、永続ボリューム、レプリカセット運用、障害復旧など、アプリ本体とは別の難しさがあります。

そのため今回は、

- app は Kubernetes
- DB は外部または別基盤

という、実務でもよくある分離構成に寄せました。

これは **「DB まで全部クラスタに閉じ込める」より、「まずアプリの要件を満たす」ことを優先した妥協**です。

## 2. 画像保存方式の妥協

### S3 ではなく GridFS を採用した

長期的な本番運用だけを考えると、商品画像は S3 互換ストレージや CDN 前提の構成のほうが一般に有利です。

それでも今回は GridFS を採用しました。主な理由は、

- 追加のバケット設定や認証情報管理を減らせる
- backend API の管理下で画像取得を統一しやすい
- 課題規模では「大規模メディア配信」より「実装の完結性」のほうが重要

だったためです。

つまり、**長期スケーラビリティより、短期の実装容易性・一体運用性を優先した**という妥協です。

また、GridFS 採用に伴い、画像の用途もかなり限定しています。

- 対象は商品画像のみ
- 画像サイズは小さめに制限
- 大容量メディアや汎用ファイルホスティング用途は想定しない

これは **「何でも保存できる仕組み」ではなく、「課題に必要な範囲だけ安全に扱う」ための割り切り**です。

## 3. 性能と正しさのトレードオフ

### Flash Sale では応答速度より oversell 防止を優先した

checkout 系では、最重要要件を **negative stock を出さないこと、つまり oversell 防止** に置きました。

その結果、

- 在庫の条件付き減算
- トランザクション
- cart version check
- transient conflict の retry

のような仕組みを入れて、正しさを守る設計にしています。

一方で、load test の結果から分かる通り、高い競合時には

- correctness は保てる
- しかし latency は悪化する
- timeout するクライアントも出る

という弱点があります。

これはまさに、**「速さ」より「在庫整合性」を優先したために受け入れた妥協**です。

## 4. データベース運用の妥協

### Atlas Free Tier や軽量構成の限界を受け入れた

Flash Sale の高競合時に性能が落ちる要因として、MongoDB 側の shared resource や free tier 制約が効いている可能性が高いと整理しています。

本来であれば、より安定した構成として

- 専用 DB サーバ
- より上位の managed DB tier
- あるいは別アーキテクチャ

を検討できます。

それでも今回は、専用 EC2 に MongoDB を移す案を見送りました。理由は、

- セットアップと保守の負荷が大きい
- バックアップや復旧、監視など運用責任が一気に増える
- 課題期間内に増える作業の割に、説明コストも高い

ためです。

つまり、**理想的な DB 性能より、運用可能な範囲に収めることを優先した**という妥協です。

## 5. 本番品質に対する妥協

### プロトタイプとしての安全側の簡略化を選んだ

今回のシステムは、商用サービスとしての完全性よりも、課題としての検証可能性と安全性を優先しています。

たとえば、

- 支払いは `credit_card` / `paypal` という方法ラベルを扱うだけで、実カード情報を保存しない
- 認証は JWT と role-based access control で成立させる
- 画像アップロードは制約を強めて、自由度より安全性を優先する

という方針を取っています。

これは **「本物の商用決済・本格的なメディア基盤・高可用構成」まで広げると課題のスコープを超えるため、プロトタイプとして必要十分な範囲に留めた**という妥協です。

## 6. スコープ管理上の妥協

### “全部きれいにやる” より “評価対象を落とさない” を優先した

今回の docs と staging 実装全体を見ると、一貫しているのは次の優先順位です。

1. ロール別機能を成立させる
2. Flash Sale で oversell を防ぐ
3. 自動テストと load test の証拠を残す
4. デプロイ可能な形にする
5. その上で、将来改善できる点は将来課題として明示する

そのため、以下のようなものは意図的に後回し、または簡略化されています。

- single-node k3s からの multi-node 化
- frontend / backend のホスト分離や高可用化
- frontend の配備方式の完全統一
- MongoDB の Kubernetes 運用
- object storage / CDN 前提の画像基盤
- 高負荷時のレスポンス最適化
- 本番運用レベルの可用性・監視・秘密情報管理
- 完全なアクセシビリティ監査や法務レベルの privacy/compliance 実装

これは雑に省いたというより、**課題の中心評価項目に対して優先順位を付けた結果の妥協**と整理できます。

## レポート向けに短く言うなら

今回の設計では、限られた期間と予算の中で、まず Flash Sale における在庫整合性と、役割別 EC サイトとしての基本要件を確実に満たすことを優先した。実際の staging では、frontend と backend を 1 台の EC2 に集約し、backend は single-node k3s、frontend は同一ホスト上の Docker container、MongoDB は別レイヤという構成を採用している。そのため、multi-node 化やホスト分離による高可用化、frontend まで含めた配備方式の完全統一、MongoDB の本格的なクラスタ運用、S3 ベースの画像配信、専用 DB 基盤への移行、高負荷時のレスポンス最適化などは将来改善項目として後回しにした。言い換えると、本プロジェクトは「長期商用運用の理想構成」よりも、「課題要件を安全かつ説明可能な形で満たす現実的な構成」を選んだ点に設計上の妥協がある。

## もともと近い内容が書かれていたファイル

妥協点が完全に 1 つにまとまっていたわけではありませんが、特に近かったのは以下です。

- `doc/backend/gridfs-image-storage.md`
- `.doc/operation/aws-k3s-notes.md`
- `.doc/operation/k8s-guide.md`
- `doc/operation/flash-sale-load-testing-summary.md`
- `.doc/report/environmental-societal-safety-economic-limitations-draft-en.md`

## 使い分けメモ

- 画像保存の妥協だけを説明したいとき:
  - `doc/backend/gridfs-image-storage.md`
- デプロイ構成の割り切りを説明したいとき:
  - `.doc/operation/aws-k3s-notes.md`
  - `.doc/operation/k8s-guide.md`
- 性能より correctness を優先した話をしたいとき:
  - `doc/operation/flash-sale-load-testing-summary.md`
- レポートの Limitations 章に寄せたいとき:
  - `.doc/report/environmental-societal-safety-economic-limitations-draft-en.md`
