FROM node:22-alpine AS builder
WORKDIR /app
ENV CI=true
ENV HOST=http://localhost:8000
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm config set dangerouslyAllowAllBuilds true
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY package.json ./

EXPOSE 3000

CMD ["pnpm", "run", "start"]
