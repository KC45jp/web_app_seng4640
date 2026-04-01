# k3s デプロイガイド（backend のみ Kubernetes）

## このガイドの目的

今回は役割を分けます。

- frontend: いままで通りローカル起動
- MongoDB: Docker Compose
- backend: k3s

この切り分けはかなり自然です。
backend だけを k3s に載せても、`Deployment`、`Service`、`Secret`、health check、外部 DB 接続の流れは十分学べます。

---

## 全体像

```text
Browser
  │
  ├─→ frontend local dev server
  │      │
  │      └─→ http://<NODE_IP>:30500
  │
  └─→ backend Service (NodePort)
         │
         └─→ backend Pod on k3s
                │
                └─→ MongoDB on Docker Compose
```

ポイントは 2 つです。

- backend Pod から見た `localhost` は backend Pod 自身
- frontend から backend へは k3s の NodePort でアクセスする

---

## 必要なファイル

```text
web_app_seng4640/
├── .dockerignore
├── db/
│   └── docker-compose.yml
├── k8s/
│   ├── namespace.yml
│   └── backend/
│       ├── deployment.yml
│       ├── secret.yml
│       └── service.yml
└── packages/
    ├── shared/
    ├── backend/
    │   └── Dockerfile
    └── frontend/
        ├── package.json
        └── src/
```

---

## Step 0: MongoDB を Docker Compose で起動する

```bash
docker compose -f db/docker-compose.yml up -d
docker compose -f db/docker-compose.yml ps
```

ログ確認:

```bash
docker compose -f db/docker-compose.yml logs mongodb
docker compose -f db/docker-compose.yml logs mongo-init-replica
```

### 注意: backend から `localhost` ではつながらない

backend は Pod の中で動きます。
そのため、MongoDB には `localhost:27017` ではなく、k3s ノードの IP 経由でつなぎます。

ノード IP の取得:

```bash
NODE_IP=$(sudo kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "$NODE_IP"
```

backend 用の `MONGO_URI` はこうなります。

```text
mongodb://<NODE_IP>:27017/seng4640?replicaSet=rs0&directConnection=true
```

必要なら接続プール上限も env で明示できます。
Atlas free を使う場合は、backend の `.env` または Kubernetes env に `MONGO_MAX_POOL_SIZE=20` のように入れておくと扱いやすいです。

`<NODE_IP>` はプレースホルダです。
[`k8s/backend/deployment.yml`](/home/keishi/tru/web_seng4640/web_app_seng4640/k8s/backend/deployment.yml) の `MONGO_URI` に、そのまま `<NODE_IP>` を残さず実際の IP へ置き換えてから保存し、`kubectl apply` してください。

例:

```text
mongodb://172.27.202.96:27017/seng4640?replicaSet=rs0&directConnection=true
```

もし `<NODE_IP>` のまま apply すると、backend ログに `Unable to parse <NODE_IP>:27017 with URL` が出て、`/api/products` など DB を使う API が 500 になります。

### 注意: replica set の host 名

今の [`db/docker-compose.yml`](/home/keishi/tru/web_seng4640/web_app_seng4640/db/docker-compose.yml) では、replica set 初期化時の member host が `mongodb:27017` になっています。
これは Docker Compose ネットワーク内では自然ですが、k3s の Pod からはその名前を引けません。

まずは `directConnection=true` 付きで試せます。
もし MongoDB 接続で詰まったら、`rs.initiate()` に登録している host 名を、Pod から到達できるアドレスへ合わせるのが次の確認ポイントです。

---

## Step 1: frontend はローカルのまま起動する

frontend は今回は k3s に載せません。
いままで通り Vite dev server を使います。

backend が k3s の NodePort `30500` で見える前提なら、frontend は次のように起動できます。

```bash
NODE_IP=$(sudo kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

cd packages/frontend
VITE_API_BASE_URL=http://${NODE_IP}:30500 npm run dev -- --host 0.0.0.0
```

これで frontend は browser から backend の NodePort を叩きます。
同じマシンからなら `http://localhost:5173/`、LAN 内の別端末からなら `http://<FRONTEND_HOST_IP>:5173/` で開けます。

---

## Step 2: backend 用 Dockerfile を使う

backend は `file:../shared` に依存しているので、Docker build の中に `packages/shared` が必要です。
そのため backend Dockerfile では、`shared` を先に build してから backend を install します。

現在の方針では、frontend の Dockerfile は必須ではありません。
残しておいても問題ありませんが、今回の backend-only k3s 構成では使いません。

### backend ビルド

リポジトリルートで実行:

```bash
docker build -f packages/backend/Dockerfile -t seng4640-backend:latest .
```

### `.dockerignore`

Docker build context にホストの `node_modules` や `dist` を混ぜないため、ルートの [`.dockerignore`](/home/keishi/tru/web_seng4640/web_app_seng4640/.dockerignore) を使います。

このリポジトリでは `docker build -f packages/backend/Dockerfile .` のように build context をルート `.` にしているので、ルート `.dockerignore` が効きます。

---

## Step 3: backend の Kubernetes マニフェスト

### namespace

[`k8s/namespace.yml`](/home/keishi/tru/web_seng4640/web_app_seng4640/k8s/namespace.yml)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: seng4640
```

### Secret

[`k8s/backend/secret.yml`](/home/keishi/tru/web_seng4640/web_app_seng4640/k8s/backend/secret.yml)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: seng4640
type: Opaque
stringData:
  JWT_SECRET: "change-me-before-real-use"
```

学習用にダミー値を置くのは問題ありません。
本物の secret は Git に入れないほうが安全です。

### Deployment

[`k8s/backend/deployment.yml`](/home/keishi/tru/web_seng4640/web_app_seng4640/k8s/backend/deployment.yml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: seng4640
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: seng4640-backend:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 5000
          env:
            - name: PORT
              value: "5000"
            - name: MONGO_URI
              value: "mongodb://<NODE_IP>:27017/seng4640?replicaSet=rs0&directConnection=true"
            - name: MONGO_MAX_POOL_SIZE
              value: "20"
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: JWT_SECRET
            - name: LOG_LEVEL
              value: "warn"
            - name: PRODUCT_LIST_LIMIT_MAX
              value: "100"
            - name: APP_ENV
              value: "stg"
          readinessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 15
            periodSeconds: 10
```

`<NODE_IP>` はプレースホルダです。
apply 前に、自分のノード IP に置き換え、ファイルを保存してから反映してください。

反映確認:

```bash
sudo kubectl apply -f k8s/backend/deployment.yml
sudo kubectl exec -n seng4640 deploy/backend -- printenv MONGO_URI
```

ここで `mongodb://<NODE_IP>:27017/...` のままなら、manifest の保存漏れか apply 漏れです。

### replicas を増やすとき

backend Pod を 2 個にしたいときは、`spec.replicas` を `2` にして apply すれば増やせます。

ただし今の readinessProbe / livenessProbe は `/api/health` を見ています。
この endpoint は MongoDB 接続失敗でも `ok` を返すので、DB につながっていない Pod でも Ready 扱いになる可能性があります。

そのため multi-pod にするときは、`/api/health` が通っていても `/api/products` など DB を使う API の疎通も確認してください。
本番寄りにするなら、readinessProbe で DB 接続状態も反映する health check に寄せるのが安全です。

### Service

[`k8s/backend/service.yml`](/home/keishi/tru/web_seng4640/web_app_seng4640/k8s/backend/service.yml)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: seng4640
spec:
  type: NodePort
  selector:
    app: backend
  ports:
    - port: 5000
      targetPort: 5000
      nodePort: 30500
```

この Service が `http://<NODE_IP>:30500` への入口になります。

---

## Step 4: backend image を k3s に読み込む

```bash
docker build -f packages/backend/Dockerfile -t seng4640-backend:latest .
docker save seng4640-backend:latest | sudo k3s ctr images import -
```

`imagePullPolicy: Never` にしているので、k3s へローカル image を import します。

---

## Step 5: backend をデプロイする

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/backend/secret.yml
kubectl apply -f k8s/backend/deployment.yml
kubectl apply -f k8s/backend/service.yml
```

確認:

```bash
kubectl get pods -n seng4640
kubectl get svc -n seng4640
```

---

## Step 6: 動作確認

```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

curl http://${NODE_IP}:30500/api/health
```

frontend も起動していれば、browser から frontend 経由でも backend を叩けます。

```bash
cd packages/frontend
VITE_API_BASE_URL=http://${NODE_IP}:30500 npm run dev
```

---

## よく使うデバッグコマンド

```bash
sudo kubectl get all -n seng4640

sudo kubectl logs -n seng4640 deployment/backend
sudo kubectl describe pod -n seng4640 -l app=backend
sudo kubectl exec -it -n seng4640 deployment/backend -- sh
sudo kubectl exec -n seng4640 deploy/backend -- printenv MONGO_URI

docker compose -f db/docker-compose.yml logs mongodb
docker compose -f db/docker-compose.yml logs mongo-init-replica
```

既知のハマりどころ:

- `kubectl` で `/etc/rancher/k3s/k3s.yaml: permission denied` が出る場合は、この環境では `sudo kubectl ...` が必要です。
- `/api/health` は通るのに `/api/products` だけ 500 の場合、まず backend ログと `printenv MONGO_URI` を確認してください。MongoDB 接続失敗でも health check は通る作りです。
- `replicas` を増やした場合も、今の `/api/health` だけでは DB 未接続 Pod を弾けません。multi-pod では products など DB 利用 API でも確認すると安心です。

全部消す:

```bash
kubectl delete namespace seng4640
```

---

## 今回の構成で学べること

- backend image を build する
- image を k3s に import する
- `Deployment` と `Service` で API を公開する
- `Secret` を env として注入する
- Kubernetes の Pod からクラスタ外 MongoDB へ接続する

今回はあえて後回しにしているもの:

- frontend を k3s へ載せる
- Ingress
- MongoDB の Kubernetes 運用
- `StatefulSet`
- `PersistentVolumeClaim`

---

## frontend の Dockerfile はどうするか

今回の backend-only k3s 構成では、frontend Dockerfile は使いません。
なので結論は次のどちらかです。

1. いまはそのまま残しておく
2. 後で frontend を k3s や nginx 配信へ寄せる時に見直す

おすすめは 1 です。
今の学習目標では frontend Dockerfile を詰める優先度は低いので、backend が安定してから戻るのがやりやすいです。

将来的に frontend を Docker 化するなら、そのときは:

- `shared` を build stage で先に作る
- frontend は multi-stage build にする
- runtime は `nginx` にする

という方針で十分です。
