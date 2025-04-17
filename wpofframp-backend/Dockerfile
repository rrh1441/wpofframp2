# ---- Base Stage ----
    FROM node:20-alpine AS base
    WORKDIR /app
    
    # ---- Dependencies Stage ----
    FROM base AS deps
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm ci --omit=dev
    
    # ---- Build Stage ----
    FROM base AS builder
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm install
    COPY . .
    # ---- START ENHANCED DEBUG ----
    RUN echo "DEBUG: Contents of /app after COPY . ." && (find /app -maxdepth 1 -ls || echo "DEBUG: Failed to list /app") && \
        echo "DEBUG: Contents of /app/lib" && (find /app/lib -ls || echo "DEBUG: /app/lib not found or failed to list") && \
        echo "DEBUG: Contents of /app/templates" && (find /app/templates -ls || echo "DEBUG: /app/templates not found or failed to list") && \
        echo "--- End Pre-Build Debug ---"
    # ---- END ENHANCED DEBUG ----
    RUN npm run build
    # ---- START ENHANCED DEBUG ----
    RUN echo "DEBUG: Contents of /app after RUN npm run build" && (find /app -maxdepth 1 -ls || echo "DEBUG: Failed to list /app post-build") && \
        echo "DEBUG: Checking for /app/dist" && (find /app/dist -ls || echo "DEBUG: /app/dist not found or failed to list post-build") && \
        echo "--- End Post-Build Debug ---"
    # ---- END ENHANCED DEBUG ----
    
    
    # ---- Final Production Stage ----
    FROM base AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    COPY --from=deps /app/node_modules ./node_modules
    # ---- These COPY commands are failing ----
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/templates ./templates
    # ---- End Failing COPY commands ----
    RUN addgroup --system --gid 1001 nodejs
    RUN adduser --system --uid 1001 nodejs
    USER nodejs
    EXPOSE 8080
    CMD [ "node", "dist/server.js" ]