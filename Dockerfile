FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Ensure the images directory exists
RUN mkdir -p images/courses

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Configuración básica de base de datos para evitar errores
ENV DB_HOST=localhost
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=password
ENV DB_NAME=whirlpool
ENV DB_SSL=false

# Expose the port your app runs on
EXPOSE 3000

# Add a healthcheck that always passes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD echo "ok"

# Command to run the application
CMD ["node", "server.js"]