#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH." >&2
  exit 1
fi

backend_pid=""
frontend_pid=""

cleanup() {
  local exit_code=$?

  trap - EXIT INT TERM

  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" >/dev/null 2>&1; then
    kill "${backend_pid}" >/dev/null 2>&1 || true
  fi

  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" >/dev/null 2>&1; then
    kill "${frontend_pid}" >/dev/null 2>&1 || true
  fi

  wait >/dev/null 2>&1 || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

(
  cd "${ROOT_DIR}/packages/backend"
  npm run dev 2>&1 | sed -u 's/^/[backend] /'
) &
backend_pid=$!

(
  cd "${ROOT_DIR}/packages/frontend"
  npm run dev 2>&1 | sed -u 's/^/[frontend] /'
) &
frontend_pid=$!

echo "Starting backend and frontend dev servers..."
echo "Press Ctrl+C to stop both."

wait -n "${backend_pid}" "${frontend_pid}"
