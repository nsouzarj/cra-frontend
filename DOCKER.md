# Docker Deployment Guide

This guide explains how to containerize and deploy the CRA Frontend application using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:
- Docker (version 18.09 or higher)
- Docker Compose (optional but recommended)

## Docker Configuration Files

This project includes the following Docker-related files:

1. `Dockerfile` - Multi-stage build configuration for the Angular application
2. `docker-compose.yml` - Docker Compose configuration for easy deployment
3. `nginx.conf` - Nginx web server configuration for serving the application
4. `.dockerignore` - Specifies files and directories to exclude from the Docker build context

## Building the Docker Image

To build the Docker image, run the following command from the project root directory:

```bash
docker build -t cra-frontend .
```

This command will:
1. Use Node.js 18 to build the Angular application
2. Create a production build of the application
3. Package the built application in an Nginx Alpine container

## Running the Container

After building the image, you can run the container with:

```bash
docker run -d -p 4200:80 --name cra-frontend-app cra-frontend
```

This will:
- Run the container in detached mode (`-d`)
- Map port 4200 on your host to port 80 in the container (`-p 4200:80`)
- Name the container `cra-frontend-app` (`--name cra-frontend-app`)

The application will be accessible at `http://localhost:4200`

## Using Docker Compose

For easier management, you can use Docker Compose:

```bash
# Build and start the application
docker-compose up -d

# Stop and remove the containers
docker-compose down
```

## Configuration

### Environment Variables

The Docker container uses the following environment variables:

- `NODE_ENV`: Set to "production" for production builds

### Port Configuration

The container exposes port 80. You can change the host port mapping in:
- The `docker run` command
- The `docker-compose.yml` file

### Backend API Configuration

The application is configured to use a relative URL for API calls (`/cra-api`). This allows it to work with reverse proxies or when the backend is served from the same domain.

If you need to change the backend API URL:
1. Update the `apiUrl` in `src/environments/environment.prod.ts`
2. Rebuild the Docker image

## Production Deployment

For production deployment:

1. Update the environment configuration in `src/environments/environment.prod.ts`
2. Build with production optimizations:
   ```bash
   docker build -t cra-frontend:prod .
   ```
3. Run with appropriate resource limits:
   ```bash
   docker run -d --name cra-frontend-app \
     -p 4200:80 \
     --memory=512m \
     --cpus=0.5 \
     cra-frontend:prod
   ```

## Troubleshooting

### Build Issues

If you encounter build issues:
1. Ensure all dependencies are properly installed
2. Check that the `.dockerignore` file is correctly excluding unnecessary files
3. Verify that the `package.json` file is properly configured

### Runtime Issues

If the container fails to start:
1. Check the container logs: `docker logs cra-frontend-app`
2. Ensure port 4200 is not already in use
3. Verify that the nginx configuration is correct

### Network Issues

If the application cannot connect to the backend:
1. Ensure the backend is accessible from the container
2. Check the API URL configuration in the environment files
3. Verify network connectivity between containers if using Docker networks

## Best Practices

1. Always use specific versions for base images in production
2. Regularly update dependencies and rebuild images
3. Use multi-stage builds to reduce image size
4. Implement health checks in production environments
5. Use Docker secrets for sensitive configuration data