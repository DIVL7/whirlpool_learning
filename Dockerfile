FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Set environment variables with placeholders
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]