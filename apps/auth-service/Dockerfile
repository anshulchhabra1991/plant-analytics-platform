FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies and node_modules
RUN npm prune --omit=dev

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 