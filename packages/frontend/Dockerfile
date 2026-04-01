# Step 1: Shared package

FROM node:22-alpine AS shared-builder
WORKDIR /app/packages/shared

COPY packages/shared/package.json packages/shared/package-lock.json ./
RUN npm ci

COPY packages/shared/ ./
RUN npm run build

# Step 2: Frontend Build
FROM node:22-alpine AS frontend-builder
WORKDIR /app/packages/frontend

COPY --from=shared-builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=shared-builder /app/packages/shared/dist /app/packages/shared/dist


COPY packages/frontend/package.json packages/frontend/package-lock.json ./
RUN npm ci

COPY packages/frontend/ ./

ARG VITE_API_BASE_URL
RUN test -n "$VITE_API_BASE_URL" || (echo "VITE_API_BASE_URL is required" && exit 1)
RUN VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build

# STep3 final product
FROM nginx:alpine
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 80
