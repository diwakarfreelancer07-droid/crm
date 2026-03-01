FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --prefer-offline

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Set Node options to prevent memory issues during build
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Next.js converts the environment variables at build time
# If you use public environment variables in your code, they need to be present at build time
# ARG NEXT_PUBLIC_...
# ENV NEXT_PUBLIC_...

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public

# Copy the built .next directory
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy node_modules and prisma for runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3001
ENV PORT 3001
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
