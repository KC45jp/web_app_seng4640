# Frontend 未実装ページ調査

調査日: 2026-03-30

## 結論

フロントエンドのルーティング上は存在するものの、実体がページシェルのままで未実装と判断できるページは現在 0 件です。

対象ルートは `packages/frontend/src/App.tsx` で定義されています。

## 未実装ページ一覧

現在、ページシェルのまま残っているルートはありません。

## 今回実装済み

今回の更新で Customer 向けの購入導線は以下まで実装済みです。

- `/products/:id` から `Add to Cart` 可能
- `/cart` で数量更新、削除、エラー表示に対応
- `/checkout` で支払い方法選択、注文送信、成功画面表示に対応
- `/mypage` でプロフィール表示、注文履歴の検索・並び替え・詳細表示に対応
- `/pm/dashboard` で担当商品の一覧表示と edit/public 導線に対応
- `/pm/products/new` で商品作成に対応
- `/pm/products/:id` で商品更新、flash sale 更新、無効化に対応
- `/admin/managers` で Product Manager 一覧表示、検索、新規作成、削除に対応

## 実装済みと判断できるページ

以下は API 連携または画面ロジックが入っており、少なくともページシェルではありません。

- `/` `packages/frontend/src/components/Main.tsx`
- `/search` `packages/frontend/src/components/Search.tsx`
- `/products/:id` `packages/frontend/src/components/ProductPage.tsx`
- `/login` `/signup` `/pm/login` `/admin/login` `packages/frontend/src/components/AuthPages.tsx`
- `/cart` `packages/frontend/src/components/Cart.tsx`
- `/checkout` `packages/frontend/src/components/CustomerPages.tsx`
- `/mypage` `packages/frontend/src/components/CustomerPages.tsx`
- `/pm/dashboard` `/pm/products/new` `/pm/products/:id` `packages/frontend/src/components/PM.tsx`
- `/admin/managers` `packages/frontend/src/components/Admin.tsx`

## API 接続状況

フロントエンド側の API モジュールは現状、`admin` `auth` `cart` `checkout` `images` `me` `orders` `search` の 8 系統です。

- `packages/frontend/src/api/admin.ts`
- `packages/frontend/src/api/auth.ts`
- `packages/frontend/src/api/cart.ts`
- `packages/frontend/src/api/checkout.ts`
- `packages/frontend/src/api/images.ts`
- `packages/frontend/src/api/me.ts`
- `packages/frontend/src/api/orders.ts`
- `packages/frontend/src/api/search.ts`

ルーティング済みページに必要な主要 API は frontend から接続済みです。

backend 側のルート定義:

- `packages/backend/src/modules/user/routes.ts`
- `packages/backend/src/modules/orders/routes.ts`
- `packages/backend/src/modules/checkout/routes.ts`
- `packages/backend/src/modules/admin/routes.ts`

## 優先度メモ

設計書の実装順では、次に手を付けるべきなのは Customer 機能、その次が Manager、最後に Admin です。

参照:

- `docs/frontend/frontend-plan-en.md:85`
