# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Copy all apps and packages
COPY packages ./packages
COPY apps/perpetuo-backend ./apps/perpetuo-backend

# Install dependencies (pnpm)
RUN pnpm install --frozen-lockfile

# Build backend
WORKDIR /app/apps/perpetuo-backend
RUN pnpm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy built app
COPY --from=builder /app/apps/perpetuo-backend/dist ./apps/perpetuo-backend/dist
COPY --from=builder /app/apps/perpetuo-backend/package.json ./apps/perpetuo-backend/
COPY --from=builder /app/apps/perpetuo-backend/prisma ./apps/perpetuo-backend/prisma

# Copy packages (needed for prisma)
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/perpetuo-backend

EXPOSE 3000

CMD ["node", "dist/main.js"]
