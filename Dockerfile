# Base Image 
FROM node:20-alpine AS base

# Production Stage 
FROM base AS production

# Working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts

# Copy app source code
COPY . .

# Expose correct port
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]