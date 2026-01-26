FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace configs
COPY package.json pnpm-workspace.yaml tsconfig.json ./

# Copy packages
COPY packages ./packages/
COPY apps ./apps/

# Install dependencies
RUN pnpm install

EXPOSE 3000

CMD ["pnpm", "filter", "perpetuo-gateway", "start"]
