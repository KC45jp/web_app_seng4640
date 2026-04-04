# Deployment Notes: k3s, AWS, Frontend, MongoDB

> Note:
> This memo reflects an earlier backend-focused k3s design discussion.
> The actual staging startup flow in `scripts/stg_server_start` builds the
> frontend as a Docker image and runs it in a Docker container on EC2, while
> the backend is deployed through k3s.

## このメモの目的

このメモは、今回話した「何を k3s に載せるか」「frontend は Docker 化すべきか」「MongoDB はどこで動かすのが自然か」を整理したものです。

このメモを書いた時点での方針:

- backend は k3s で動かす
- frontend はいったんローカル起動のまま
- MongoDB は Docker Compose のまま

---

## 今回の学習方針

backend だけを k3s に載せるのは十分に自然です。

理由:

- `Deployment`
- `Service`
- `Secret`
- readiness / liveness probe
- Pod から外部 DB へ接続する考え方

をまとめて学べるからです。

一方で frontend は静的配信寄りなので、Kubernetes の学習対象としては backend ほど優先度が高くありません。

---

## 現実の運用では Kubernetes は使われるか

はい、かなり使われます。

2026-01-20 公開の CNCF Annual Survey 2025 では、コンテナ利用組織の 82% が本番で Kubernetes を使っているとされています。

ただしこれは「アプリ全体の基盤として Kubernetes が広く使われている」という意味であって、静的 frontend を必ず Kubernetes で配るという意味ではありません。

ここから先は実務感を含む推論ですが:

- backend / API / worker は Kubernetes と相性が良い
- 静的 frontend は CDN や専用ホスティング基盤の方が自然なことが多い

Source:

- https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/

---

## frontend を Kubernetes に載せる価値

### 学習目的では価値がある

- frontend と backend を同じ基盤で扱える
- Ingress / Service / rollout の流れを通しで学べる
- image build から deploy まで一連の流れが見える

### 実運用ではケース次第

今の frontend は Vite build 後に静的ファイルを配る構成です。
この場合、Kubernetes に載せるより CDN 系の方が自然なことが多いです。

### frontend を Docker 化する意味が出やすいケース

- frontend を backend と同じ運用にそろえたい
- EC2 / ECS / EKS に統一したい
- SSR や Node ベースの frontend server を動かす
- nginx を含めて再現可能な配布物にしたい

### frontend を Docker 化しなくてもよいケース

- ただの静的 SPA
- CDN で配るだけで十分
- build 成果物を S3 + CloudFront のような仕組みに置ける

---

## AWS では frontend をどう載せるのが自然か

### 1. 静的 frontend: CDN / hosting 系

いちばん自然なのはこの系統です。

- Amplify Hosting
- S3 + CloudFront

AWS の公式ドキュメントでも、S3 にある静的サイトを Amplify Hosting で配備する流れが案内されており、CloudFront ベースの CDN 配信、HTTPS、リダイレクト/リライトなどが使えます。

つまり、静的 frontend は「EC2 1 台で nginx を建てる」より、まず CDN 系を検討するのが自然です。

Sources:

- https://docs.aws.amazon.com/AmazonS3/latest/userguide/website-hosting-amplify.html
- https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html

### 2. コンテナ運用したい frontend: ECS / EKS / EC2 + Docker

Docker 化に意味があるのは、frontend もコンテナとして統一運用したいときです。

たとえば:

- backend も frontend も同じ CI/CD に寄せたい
- ECS / Fargate / EKS を使いたい
- SSR を含む frontend server を動かしたい

AWS 公式では ECS はコンテナを実行・管理するためのフルマネージドサービスです。
静的 frontend だけなら少し大きい構成ですが、アプリ全体の統一基盤としては自然です。

Source:

- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html

---

## 「EC2 1 台でも frontend を Docker 化した方がよいか」

結論:

- 必須ではない
- でも運用統一のために Docker 化するのはあり

今の frontend が静的 SPA であることを考えると、単体で見れば CDN 系の方が勝ちやすいです。

ただし、次のような意図があるなら Docker 化は十分ありです。

- backend とデプロイ手順をそろえたい
- nginx 設定ごと artifact 化したい
- 将来 ECS / EKS に寄せたい

ここは実務判断ですが、静的 frontend 単体なら「Docker 必須」ではありません。

---

## MongoDB は Kubernetes に載せるべきか

結論:

- 学習では後回しでよい
- 実運用では外部 managed service や別基盤がかなり自然

MongoDB は replica set で複数ノードに展開できます。
これは Kubernetes でもできますが、DB は stateful なので運用難易度が上がります。

自前でやる場合の代表パターン:

- VM / 物理サーバで replica set を組む
- Kubernetes 上で StatefulSet や Operator を使う
- MongoDB Atlas のような managed service を使う

ここから先は実務感を含む推論ですが:

- app は Kubernetes
- DB は外部 managed

という構成はかなり自然です。

そのため、今回の

- backend: k3s
- frontend: ローカルのまま
- MongoDB: Docker Compose

は学習順序としてかなり良いです。

ただし、最終の staging 起動フローではこの前提をそのまま採用しているわけではありません。
実際の `stg_server_start` では frontend も Docker image を build して
EC2 上の Docker container として起動しています。

Sources:

- https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/
- https://www.mongodb.com/docs/current/core/replica-set-architectures/
- https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
- https://www.mongodb.com/docs/kubernetes/current/tutorial/deploy-replica-set/

---

## 今回のプロジェクトに対する結論

いま優先すべきなのは backend を k3s で安定して動かすことです。

おすすめの順番:

1. backend Dockerfile を固める
2. backend image を build する
3. backend を k3s に deploy する
4. frontend は `VITE_API_BASE_URL=http://<NODE_IP>:30500` でローカル起動する
5. MongoDB は Docker Compose のまま使う

この部分は backend-only 学習メモとしての提案です。
現在の staging 運用では frontend の Dockerfile も実際に使われています。
