FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables with placeholders
ENV DB_HOST=database_host
ENV DB_PORT=database_port
ENV DB_USER=database_user
ENV DB_PASSWORD=database_password
ENV DB_NAME=database_name
ENV DB_SSL=true

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]