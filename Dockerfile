# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install openssl for Prisma client
RUN apk add --no-cache openssl

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy configuration files and source code
COPY next.config.mjs ./
COPY postcss.config.mjs ./
COPY jsconfig.json ./
COPY middleware.js ./
COPY app ./app
COPY lib ./lib

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

# Copy built application assets and configuration
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/middleware.js ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose Next.js port
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
