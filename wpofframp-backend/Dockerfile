# ---- Base Stage ----
# Use a specific Node.js LTS version (Alpine for smaller size)
FROM node:20-alpine AS base
WORKDIR /app

# Install necessary OS packages if needed (unlikely for this use case)
# RUN apk add --no-cache some-package

# ---- Dependencies Stage ----
FROM base AS deps
WORKDIR /app

# Copy package manager files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# ---- Build Stage ----
# Install ALL dependencies (including dev for build) and build TS -> JS
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
# Install all dependencies including devDependencies needed for build
RUN npm install
COPY . .
# Run the build command defined in your backend service's package.json
RUN npm run build

# ---- Final Production Stage ----
FROM base AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy necessary files from previous stages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist # Assuming your build output is in 'dist'
COPY --from=builder /app/templates ./templates # Copy templates needed by buildZip

# Add non-root user and switch to it
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Expose the port the app will run on (must match server code and fly.toml)
EXPOSE 8080

# Command to run the compiled server application
CMD [ "node", "dist/server.js" ]