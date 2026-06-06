FROM node:22-alpine
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm config set dangerouslyAllowAllBuilds true
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 5173
CMD sh -c "pnpm run generate:api && pnpm run dev"
