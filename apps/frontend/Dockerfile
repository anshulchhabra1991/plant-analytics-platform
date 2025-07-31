FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the single server file
COPY server.js ./

# Expose port
EXPOSE 4000

# Start the server
CMD ["npm", "start"]