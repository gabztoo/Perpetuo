# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/perpetuo-backend ./

RUN npm install

RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npm install --production

EXPOSE 3000

CMD ["node", "dist/main.js"]
