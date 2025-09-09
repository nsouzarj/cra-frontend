# Stage 1: Build the Angular application
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Angular application
RUN npm run build

# Stage 2: Serve the application using nginx
FROM nginx:alpine

# Copy the built application from the builder stage
COPY --from=builder /app/dist/cra-frontend /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy backend error page
COPY --from=builder /app/src/backend-error.html /usr/share/nginx/html/backend-error.html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]