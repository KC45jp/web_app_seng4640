# Load Testing Workflow

## Disposable staging flow

Use the staging database as disposable infrastructure for flash-sale validation:

```bash
cd packages/backend
npm run db:reset:loadtest:stg
```

That flow does three things:

1. Clears the staging collections.
2. Seeds one dedicated flash-sale product for checkout contention testing.
3. Seeds `200` disposable customer accounts with pre-filled carts.

If you want to run the staging clean + load-test seed from inside the live `k3s`
backend pod once, use:

```bash
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 ./stg_db_reset_loadtest
```

That helper waits for `deployment/backend`, then executes these scripts inside the
pod:

1. `src/scripts/db/clean.ts`
2. `src/scripts/db/seedLoadTest.ts`

Because it runs inside the pod, it uses the same `MONGO_URI` and other env vars
that the deployed backend is already using.

After the pod-side seed finishes, the helper copies only the summary file back to
the EC2 host under `artifacts/loadtest/`:

- `stg-loadtest-summary.json`

If you want to restore the normal staging catalog and demo customers from inside
the live `k3s` backend pod once, use:

```bash
./stg_db_reset_standard
```

That helper runs these scripts inside the pod:

1. `src/scripts/db/clean.ts`
2. `src/scripts/db/seedProducts.ts`
3. `src/scripts/db/customerSeed.ts`

For local or direct host-side staging seeding, the matching package scripts are:

```bash
cd packages/backend
npm run db:reset:standard:stg
```

## Local dry run flow

You can also validate the whole path against your local backend and local MongoDB first.

Start local MongoDB with the provided Compose file:

```bash
cd db
docker compose up -d
```

Then seed the local `dev` database and start the backend:

```bash
cd packages/backend
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 npm run db:reset:loadtest:dev
npm run dev
```

For the local JMeter run, point the template at:

```text
http://127.0.0.1:5000
```

The load-test seed writes its summary artifact under `artifacts/loadtest/`:

- `stg-loadtest-summary.json`

The CSV files are kept locally in the repo under `loadtest/`:

- `loadtest/stg-loadtest-users.csv`
- `loadtest/dev-loadtest-users.csv`

The CSV columns are:

```text
email,password,paymentMethod
```

## Seed defaults

The default staging load-test seed creates:

- `200` customers named `loadtest+001@example.com` through `loadtest+200@example.com`
- password: `loadtest123`
- one active flash-sale product named `[Load Test] Flash Sale Checkout Product`
- default category: `storage`
- product stock: `200`
- one cart item per customer for that product

You can override the main knobs with environment variables before the seed command:

```bash
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=250 npm run db:seed:loadtest:stg
```

Supported overrides:

- `LOADTEST_USER_COUNT`
- `LOADTEST_PRODUCT_STOCK`
- `LOADTEST_CUSTOMER_PASSWORD`
- `LOADTEST_EMAIL_PREFIX`
- `LOADTEST_EMAIL_DOMAIN`
- `LOADTEST_PRODUCT_NAME`
- `LOADTEST_PRODUCT_DESCRIPTION`
- `LOADTEST_PRODUCT_IMAGE_URL`
- `LOADTEST_PRODUCT_CATEGORY`
- `LOADTEST_PRODUCT_PRICE`
- `LOADTEST_FLASH_SALE_PRICE`
- `LOADTEST_FLASH_SALE_DURATION_HOURS`

`LOADTEST_PRODUCT_CATEGORY` must be one of the shared catalog categories:
`cpu`, `gpu`, `motherboard`, `memory`, `storage`, `power-supply`, `case`, `cooling`.

## JMeter target

The backend is exposed through the staging NodePort:

```text
http://<ec2-public-ip>:30500
```

Relevant routes for the simplified flash-sale test:

- `POST /api/auth/login`
- `POST /api/checkout`

Because each seeded customer already has a cart with quantity `1`, the JMeter plan only needs:

1. Read a row from `loadtest/stg-loadtest-users.csv`
2. `POST /api/auth/login`
3. Extract `$.accessToken`
4. Add `Authorization: Bearer ${accessToken}`
5. Use a `Synchronizing Timer`
6. `POST /api/checkout` with:

```json
{
  "paymentMethod": "credit_card"
}
```

The repo now includes a starter plan here:

- `docs/backend/jmeter-flash-sale-checkout-template.jmx`

For the specific validation case of `200` available units with `250` checkout attempts, seed staging like this first:

```bash
cd packages/backend
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 npm run db:reset:loadtest:stg
```

In that exact setup, the expected application outcome is:

- `200` successful checkouts with HTTP `200`
- `50` rejected checkouts with HTTP `409`
- no negative stock
- no more than `200` created orders

The included JMeter template treats `409` as an expected stock-conflict result so your report is easier to read.

## Where to run JMeter

If the choice is between your local development PC and the same EC2 host that runs `k3s`, prefer:

1. Build and debug the JMeter test plan locally.
2. Run the real test from your local machine in non-GUI mode.

That avoids having the load generator compete with the single staging node for CPU and memory. If you later have access to a second EC2 instance in the same region, that is even better than both of the above.

For the actual run, prefer CLI mode over the GUI:

```bash
jmeter -n -t flash-sale.jmx -l artifacts/loadtest/results.jtl -e -o artifacts/loadtest/report
```

If you want the output directory and result file to be timestamped automatically
under your current working directory, use the helper:

```bash
./run_jmeter_flash_sale --host 13.57.223.9 --port 30500 --csv loadtest/stg-loadtest-users.csv
```

That creates a run folder like:

```text
./jmeter-runs/flash-sale-stg-loadtest-13-57-223-9-p30500-t250-s250-20260404-023500/
```

Inside that folder you get:

- `results.jtl`
- `report/index.html`
- `run-info.txt`

An example using the included template:

```bash
jmeter \
  -n \
  -t docs/backend/jmeter-flash-sale-checkout-template.jmx \
  -Jhost=<ec2-public-ip> \
  -Jport=30500 \
  -Jthread_count=250 \
  -Jsync_group_size=250 \
  -Jresponse_timeout_ms=60000 \
  -Jcsv_path=loadtest/stg-loadtest-users.csv \
  -l artifacts/loadtest/results.jtl \
  -e \
  -o artifacts/loadtest/report
```

The helper accepts the same knobs as flags, for example:

```bash
./run_jmeter_flash_sale \
  --host 13.57.223.9 \
  --port 30500 \
  --csv loadtest/stg-loadtest-users.csv \
  --threads 250 \
  --sync 250 \
  --response-timeout-ms 60000
```

For the smaller `stock 50 / customers 55` scenario, reset staging like this:

```bash
cd packages/backend
LOADTEST_USER_COUNT=55 LOADTEST_PRODUCT_STOCK=50 npm run db:reset:loadtest:stg
```

Then run JMeter with the same `55` customers and let the seed manager re-assert
flash sale state before the checkout burst:

```bash
./run_jmeter_flash_sale \
  --host 13.57.223.9 \
  --port 30500 \
  --csv loadtest/stg-loadtest-users.csv \
  --threads 55 \
  --sync 55 \
  --setup-flash-sale \
  --manager-email seed-manager@example.com \
  --manager-password manager123 \
  --product-name "[JMeter] Dedicated Flash Sale Product" \
  --product-stock 50 \
  --flash-sale-price 19.99 \
  --label stg-55v50
```

That setup flow now does four things:

- manager login
- create one dedicated product for this run
- enable flash sale on that dedicated product
- replace each customer's first cart item with that dedicated product before checkout

The manager-side API calls are:

- `POST /api/auth/login`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id/flash-sale`

For local backend testing, the same command becomes:

```bash
jmeter \
  -n \
  -t docs/backend/jmeter-flash-sale-checkout-template.jmx \
  -Jhost=127.0.0.1 \
  -Jport=5000 \
  -Jthread_count=250 \
  -Jsync_group_size=250 \
  -Jresponse_timeout_ms=60000 \
  -Jcsv_path=loadtest/dev-loadtest-users.csv \
  -l artifacts/loadtest/local-results.jtl \
  -e \
  -o artifacts/loadtest/local-report
```

For local backend testing with timestamped output:

```bash
./run_jmeter_flash_sale \
  --host 127.0.0.1 \
  --port 5000 \
  --csv loadtest/dev-loadtest-users.csv \
  --label local-dev
```
