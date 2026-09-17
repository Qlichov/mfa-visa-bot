FROM node:20-alpine

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose HTTP port for Webhook and Health check
EXPOSE 3000

# Start production server
CMD ["node", "server.js"]
