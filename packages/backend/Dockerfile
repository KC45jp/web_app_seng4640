FROM node:22-alpine AS shared-builder
WORKDIR /app/packages/shared

COPY packages/shared/package*.json ./
RUN npm ci
COPY packages/shared/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app/packages/backend

COPY --from=shared-builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=shared-builder /app/packages/shared/dist /app/packages/shared/dist

COPY packages/backend/package*.json ./
RUN npm ci
COPY packages/backend/ ./

EXPOSE 5000
CMD ["node", "--import", "tsx", "src/index.ts"]
