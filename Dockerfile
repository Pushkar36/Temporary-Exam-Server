# Use a lightweight, LTS version of Node.js
FROM node:20-alpine

# Set high-performance production environment
ENV NODE_ENV=production

# Set workspace
WORKDIR /usr/src/app

# Copy dependency manifests first for leverage of Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Create the data directory to ensure SQLite db path exists and is writable
RUN mkdir -p data && chown -R node:node data

# Switch to the standard non-root user for security best practices
USER node

# Central server runs on port 3000 by default
EXPOSE 3000

# Execute server
CMD ["node", "server.js"]
