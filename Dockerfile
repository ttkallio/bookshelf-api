# Base Image 

FROM node:20-alpine AS base

#Production Stage 
FROM base AS production

# working directory
WORKDIR /app

COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --ignore-scripts

# Copy app code into the container
COPY . .

# port
EXPOSE 3306

# command to run the application
CMD [ "node", "server.js" ]
