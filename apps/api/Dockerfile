FROM oven/bun:1.2-alpine AS base
WORKDIR /app

COPY package.json pnpm-workspace.yaml* ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json

RUN bun install

COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
