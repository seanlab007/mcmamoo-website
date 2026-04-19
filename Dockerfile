FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files first for caching
COPY package.json pnpm-lock.yaml ./
COPY packages/rowboat-core/package.json ./packages/rowboat-core/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build frontend and backend
RUN pnpm run build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "dist/index.js"]
