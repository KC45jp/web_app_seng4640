# Load Testing Workflow

## Overview

This document explains the flash-sale load-testing workflow in two separate environments:

- Local Test: a dry run against local MongoDB and the local backend
- EC2 / Staging Test: the real measurement flow against the deployed `k3s` backend

Both flows use the same basic idea:

1. Reset the target database state.
2. Seed one dedicated flash-sale product for checkout contention.
3. Seed disposable customer accounts with carts already containing that product.
4. Run JMeter so each customer logs in and attempts checkout under synchronized load.

### What the load-test seed creates

By default, the load-test seed creates:

- `200` customers named `loadtest+001@example.com` through `loadtest+200@example.com`
- password: `loadtest123`
- one active flash-sale product named `[Load Test] Flash Sale Checkout Product`
- default category: `storage`
- product stock: `200`
- one cart item per customer for that product

You can override the main seed knobs with environment variables:

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

`LOADTEST_PRODUCT_CATEGORY` must be one of the fixed catalog categories:

```text
cpu, gpu, motherboard, memory, storage, power-supply, case, cooling
```

### Shared files and artifacts

The load-test seed writes a summary JSON under `artifacts/loadtest/`:

- local dev seed: `dev-loadtest-summary.json`
- staging seed: `stg-loadtest-summary.json`

The CSV files used by JMeter are kept in the repo under `loadtest/`:

- `loadtest/dev-loadtest-users.csv`
- `loadtest/stg-loadtest-users.csv`

The CSV format is:

```text
email,password,paymentMethod
```

Note: seed scripts do not generate CSV files automatically. The CSV must already exist on the machine where JMeter is run.

### Common JMeter request flow

The simplified flash-sale validation focuses on these API routes:

- `POST /api/auth/login`
- `POST /api/checkout`

Because each seeded customer already has a cart with quantity `1`, the normal measurement flow is:

1. Read one row from the CSV.
2. Use a `Synchronizing Timer` for the login burst.
3. `POST /api/auth/login`
4. Extract `$.accessToken`
5. Add `Authorization: Bearer ${accessToken}`
6. Use a second `Synchronizing Timer` for the checkout burst.
7. `POST /api/checkout` with:

```json
{
  "paymentMethod": "credit_card"
}
```

The repo includes a starter JMeter plan here:

- `loadtest/jmeter-flash-sale-checkout-template.jmx`

When you omit `--setup-flash-sale`, the measurement phase only issues `login` and `checkout` requests. That is the recommended mode for clean oversell-validation numbers.

## Local Test

Use the local flow first when you want to validate:

- the seed/reset scripts
- the CSV and credentials
- the JMeter plan itself
- the backend behavior before touching staging

### 1. Start local MongoDB

```bash
cd db
docker compose up -d
```

### 2. Reset and seed the local load-test data

```bash
cd packages/backend
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 npm run db:reset:loadtest:dev
```

### 3. Start the local backend

```bash
cd packages/backend
npm run dev
```

The local JMeter target is:

```text
http://127.0.0.1:5000
```

### 4. Run JMeter against local backend

Direct JMeter example:

```bash
jmeter \
  -n \
  -t loadtest/jmeter-flash-sale-checkout-template.jmx \
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

Helper-based example with timestamped output:

```bash
./run_jmeter_flash_sale \
  --host 127.0.0.1 \
  --port 5000 \
  --csv loadtest/dev-loadtest-users.csv \
  --label local-dev
```

### 5. Check the outputs

Typical local outputs are:

- `artifacts/loadtest/dev-loadtest-summary.json`
- `artifacts/loadtest/local-results.jtl`
- `artifacts/loadtest/local-report/`

If you use the helper, it creates a timestamped run directory under `./jmeter-runs/`.

## EC2 / Staging Test

Use the staging flow for the actual flash-sale validation run that you want to report.

### 1. Reset staging before each measurement run

The simplest host-side reset is:

```bash
cd packages/backend
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 npm run db:reset:loadtest:stg
```

If you want to run the clean + load-test seed inside the live `k3s` backend pod, use:

```bash
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 ./stg_db_reset_loadtest
```

That helper:

1. waits for `deployment/backend`
2. runs `src/scripts/db/clean.ts` inside the pod
3. runs `src/scripts/db/seedLoadTest.ts` inside the pod
4. copies `stg-loadtest-summary.json` back to `artifacts/loadtest/` on the EC2 host

Because it runs inside the pod, it uses the same `MONGO_URI` and environment variables as the deployed backend.

### 2. Target the staging backend

The staging backend is exposed through the NodePort:

```text
http://<ec2-public-ip>:30500
```

### 3. Run the main EC2 / staging test

Recommended helper-based run:

```bash
./run_jmeter_flash_sale \
  --host 13.57.223.9 \
  --port 30500 \
  --csv loadtest/stg-loadtest-users.csv \
  --threads 250 \
  --sync 250 \
  --response-timeout-ms 60000
```

Equivalent direct JMeter example:

```bash
jmeter \
  -n \
  -t loadtest/jmeter-flash-sale-checkout-template.jmx \
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

The helper creates a timestamped run folder such as:

```text
./jmeter-runs/flash-sale-stg-loadtest-13-57-223-9-p30500-t250-s250-20260404-023500/
```

Inside that folder you get:

- `results.jtl`
- `report/index.html`
- `run-info.txt`

### 4. Reference validation scenario

For the standard `stock 200 / customers 250` validation case, seed staging like this:

```bash
cd packages/backend
LOADTEST_USER_COUNT=250 LOADTEST_PRODUCT_STOCK=200 npm run db:reset:loadtest:stg
```

Expected application outcome:

- `200` successful checkouts with HTTP `200`
- `50` rejected checkouts with HTTP `409`
- no negative stock
- no more than `200` created orders

The included JMeter template treats `409` as an expected stock-conflict result so the final report is easier to read.

For the smaller `stock 50 / customers 55` scenario:

```bash
cd packages/backend
LOADTEST_USER_COUNT=55 LOADTEST_PRODUCT_STOCK=50 npm run db:reset:loadtest:stg
```

Then run:

```bash
./run_jmeter_flash_sale \
  --host 13.57.223.9 \
  --port 30500 \
  --csv loadtest/stg-loadtest-users.csv \
  --threads 55 \
  --sync 55 \
  --response-timeout-ms 60000 \
  --label stg-55v50
```

### 5. Optional manager-side setup flow

If you explicitly want JMeter to create a dedicated product and rewrite carts for the run, enable:

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

That optional setup flow adds:

- manager login
- product creation
- flash-sale enablement
- cart rewrite requests for all seeded customers

The extra manager-side API calls are:

- `POST /api/auth/login`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id/flash-sale`

Use this mode only when you specifically need a JMeter-created dedicated product. For pure oversell measurement, leave `--setup-flash-sale` off.

### 6. Important run notes

For repeatable staging results, reset immediately before each measurement run:

```bash
cd ~/web_app_seng4640
LOADTEST_USER_COUNT=110 LOADTEST_PRODUCT_STOCK=100 ./stg_db_reset_loadtest
```

This matters because a timed-out client request can still complete on the backend after JMeter gives up waiting. If you reuse the same seeded users without a fresh reset, some customers may already have empty carts and checkout will fail with `400 Cart is empty`.

Interpret results like this:

- `409 Insufficient stock`: expected rejection under flash-sale contention
- `400 Cart is empty`: stale test data, usually from reusing customers after a previous run
- `Read timed out`: client-side timeout; the backend may still finish later
- `500`: real application or infrastructure failure

For pure oversell validation, confirm the run started without `--setup-flash-sale`. The generated `run-info.txt` should show:

```text
setup_flash_sale=false
```

The default `60000` ms response timeout is also a responsiveness check. On larger contention runs such as `stock 100 / customers 110`, the backend may preserve correctness while still missing the 60-second response window.

If you want to measure final success-versus-rejection counts rather than client-side timeout behavior, rerun with a longer timeout:

```bash
./run_jmeter_flash_sale \
  --host 13.57.223.9 \
  --port 30500 \
  --csv loadtest/stg-loadtest-users.csv \
  --threads 110 \
  --sync 110 \
  --response-timeout-ms 180000 \
  --label stg-110v100-long-timeout
```

### 7. Where to run JMeter

If the choice is between your local development PC and the same EC2 host that runs `k3s`, prefer:

1. Build and debug the JMeter test plan locally.
2. Run the real test from your local machine in non-GUI mode.

That avoids having the load generator compete with the single staging node for CPU and memory. If you later have access to a second EC2 instance in the same region, that is even better.

### 8. Restore normal staging data

After load testing, you can restore the normal staging catalog and demo customers with:

```bash
./stg_db_reset_standard
```

Or directly from the package scripts:

```bash
cd packages/backend
npm run db:reset:standard:stg
```
