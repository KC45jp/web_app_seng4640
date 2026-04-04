# SENG 4640 Web App

Role-based e-commerce web application built for the SENG 4640 final project.
The repo contains a React frontend, an Express/MongoDB backend, seed scripts,
and load-testing helpers for the flash-sale checkout scenario.

## Overview

- Guest users can browse products and product details.
- Customers can register, log in, manage a cart, check out, and view orders.
- Product Managers can manage their own products and flash-sale settings.
- Super Admins can manage Product Manager accounts.

## Stack

- Frontend: React 19, TypeScript, Vite, React Router, Zustand
- Backend: Express 5, TypeScript, Mongoose, JWT auth, Multer, Sharp
- Database: MongoDB replica set
- Operations: Docker Compose, k3s manifests, JMeter helpers

## Quick Start

### 1. Start MongoDB

```bash
cd db
docker compose up -d
```

### 2. Start the backend

The backend reads local development settings from
`packages/backend/.env.dev`.

```bash
cd packages/backend
npm install
npm run db:reset:standard:dev
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### 3. Start the frontend

```bash
cd packages/frontend
npm install
npm run dev
```

If needed, point the frontend at a different backend with
`VITE_API_BASE_URL`.

```bash
cd packages/frontend
VITE_API_BASE_URL=http://127.0.0.1:5000 npm run dev
```

## Testing

### Backend automated tests

```bash
cd packages/backend
npm test
```

Current tests cover config loading, auth middleware, health responses, and the
checkout concurrency path.

### Flash-sale load testing

See:

- `doc/operation/load-testing.md`
- `loadtest/jmeter-flash-sale-checkout-template.jmx`
- `run_jmeter_flash_sale`

## Docs Layout

- `doc/`: active project documentation
- `doc/backend/`: backend and API reference docs
- `doc/frontend/`: current frontend scope/reference docs
- `doc/operation/`: deployment, health, and load-testing runbooks
- `doc/other/`: course or project-context documents
- `.doc/`: archived notes, Japanese memos, and implementation-complete planning notes

## Project Structure

```text
.
|-- .doc/
|-- db/
|-- doc/
|-- k8s/
|-- loadtest/
|-- packages/
|   |-- backend/
|   |-- frontend/
|   `-- shared/
|-- run_jmeter_flash_sale
`-- scripts/
```
