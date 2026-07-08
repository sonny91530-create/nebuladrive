FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate types and build
RUN npx next typegen && npm run build

# ── Production ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle.config.json ./drizzle.config.json

RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
