# Frontend 未実装ページ調査

調査日: 2026-03-30

## 結論

フロントエンドのルーティング上は存在するものの、実体がページシェルのままで未実装と判断できるページは現在 5 件です。

対象ルートは `packages/frontend/src/App.tsx` で定義されています。

## 未実装ページ一覧

| Route | 状態 | 根拠 |
| --- | --- | --- |
| `/mypage` | 未実装 | `User profile and order history shell.` のみを表示しています。参照: `packages/frontend/src/components/CustomerPages.tsx:275` |
| `/pm/dashboard` | 未実装 | `Owned products list page shell.` のみを表示しています。参照: `packages/frontend/src/components/PM.tsx:3` |
| `/pm/products/new` | 未実装 | `Product creation page shell.` のみを表示しています。参照: `packages/frontend/src/components/PM.tsx:12` |
| `/pm/products/:id` | 未実装 | `Edit/delete/flash-sale setup page shell.` のみを表示しています。参照: `packages/frontend/src/components/PM.tsx:21` |
| `/admin/managers` | 未実装 | `Product Manager account management page shell.` のみを表示しています。参照: `packages/frontend/src/components/Admin.tsx:1` |

## 今回実装済み

今回の更新で Customer 向けの購入導線は以下まで実装済みです。

- `/products/:id` から `Add to Cart` 可能
- `/cart` で数量更新、削除、エラー表示に対応
- `/checkout` で支払い方法選択、注文送信、成功画面表示に対応

## 実装済みと判断できるページ

以下は API 連携または画面ロジックが入っており、少なくともページシェルではありません。

- `/` `packages/frontend/src/components/Main.tsx`
- `/search` `packages/frontend/src/components/Search.tsx`
- `/products/:id` `packages/frontend/src/components/ProductPage.tsx`
- `/login` `/signup` `/pm/login` `/admin/login` `packages/frontend/src/components/AuthPages.tsx`
- `/cart` `packages/frontend/src/components/Cart.tsx`
- `/checkout` `packages/frontend/src/components/CustomerPages.tsx`

## API 接続状況

フロントエンド側の API モジュールは現状、`auth` `cart` `checkout` `search` の 4 系統です。

- `packages/frontend/src/api/auth.ts`
- `packages/frontend/src/api/cart.ts`
- `packages/frontend/src/api/checkout.ts`
- `packages/frontend/src/api/search.ts`

そのため、未実装ページに対応する以下の API は、backend 側に受け口がある一方で frontend 側は未接続です。

- `GET /api/me`, `PATCH /api/me`
- `GET /api/orders`, `GET /api/orders/:id`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `PATCH /api/admin/products/:id/flash-sale`
- `POST /api/admin/managers`
- `DELETE /api/admin/managers/:id`

backend 側のルート定義:

- `packages/backend/src/modules/user/routes.ts`
- `packages/backend/src/modules/orders/routes.ts`
- `packages/backend/src/modules/checkout/routes.ts`
- `packages/backend/src/modules/admin/routes.ts`

## 優先度メモ

設計書の実装順では、次に手を付けるべきなのは Customer 機能、その次が Manager、最後に Admin です。

参照:

- `docs/frontend/frontend-plan-en.md:85`
