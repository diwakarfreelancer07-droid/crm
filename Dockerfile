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

# Verify standalone build was successful
RUN if [ ! -f ".next/standalone/server.js" ]; then \
    echo "ERROR: Standalone build failed - server.js not found!"; \
    echo "Contents of .next directory:"; \
    ls -la .next/ || echo ".next directory not found"; \
    exit 1; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and node_modules for Prisma Client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3001
ENV PORT 3001
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"
# test
CMD ["node", "start"]
