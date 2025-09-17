# Docker Deployment Guide

This guide explains how to containerize and deploy the CRA Frontend application using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:
- Docker (version 18.09 or higher)
- Docker Compose (version 1.27.0 or higher)

## Docker Configuration Files

This project includes the following Docker-related files:

1. `Dockerfile` - Multi-stage build configuration for the Angular application
2. `docker-compose.yml` - Docker Compose configuration for easy deployment of the complete stack (frontend, backend, and database)
3. `docker-compose.override.yml` - Additional configuration for health checks in development
4. `nginx.conf` - Nginx web server configuration for serving the application with reverse proxy capabilities
5. `.dockerignore` - Specifies files and directories to exclude from the Docker build context

## Building the Docker Image

To build the Docker image, run the following command from the project root directory:

```bash
docker build -t cra-frontend .
```

This command will:
1. Use Node.js 18 to build the Angular application
2. Create a production build of the application
3. Package the built application in an Nginx Alpine container

## Running the Complete Stack with Docker Compose

The recommended way to run the application is using Docker Compose, which will start all services (frontend, backend, and database):

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop and remove all containers
docker-compose down
```

This will start:
- Frontend application on `http://localhost:4200`
- Backend API on `http://localhost:8081/cra-api`
- PostgreSQL database on `localhost:5432`

## Running Only the Frontend Container

If you want to run only the frontend container (assuming you have the backend running separately):

```bash
docker run -d -p 4200:80 --name cra-frontend-app cra-frontend
```

This will:
- Run the container in detached mode (`-d`)
- Map port 4200 on your host to port 80 in the container (`-p 4200:80`)
- Name the container `cra-frontend-app` (`--name cra-frontend-app`)

The application will be accessible at `http://localhost:4200`

## Configuration

### Environment Variables

The Docker container uses the following environment variables:

- `NODE_ENV`: Set to "production" for production builds

### Port Configuration

The container exposes port 80. You can change the host port mapping in:
- The `docker run` command
- The `docker-compose.yml` file (frontend service maps to port 4200)

### Backend API Configuration

The application is configured to use `/cra-api` as the API endpoint, which is handled by the Nginx reverse proxy configuration. The Nginx server will proxy requests to the backend service.

If you need to change the backend API URL:
1. Update the `apiUrl` in `src/environments/environment.prod.ts`
2. Rebuild the Docker image

## Production Deployment

For production deployment:

1. Update the environment configuration in `src/environments/environment.prod.ts` with your production backend URL
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

For a complete production deployment with all services:

1. Update the backend image tag in `docker-compose.yml` if needed
2. Adjust environment variables as needed
3. Run:
   ```bash
   docker-compose up -d
   ```

## Health Checks

The Docker Compose configuration includes health checks for both frontend and backend services:
- Frontend waits for backend to be healthy before starting
- Backend checks its own health endpoint

## Troubleshooting

### Build Issues

If you encounter build issues:
1. Ensure all dependencies are properly installed
2. Check that the `.dockerignore` file is correctly excluding unnecessary files
3. Verify that the `package.json` file is properly configured
4. Make sure you have enough disk space and memory

### Runtime Issues

If the container fails to start:
1. Check the container logs: `docker logs cra-frontend-app`
2. Ensure port 4200 is not already in use
3. Verify that the nginx configuration is correct
4. Check that all required environment variables are set

### Network Issues

If the application cannot connect to the backend:
1. Ensure the backend is accessible from the container
2. Check the API URL configuration in the environment files
3. Verify network connectivity between containers if using Docker networks
4. Check that the Nginx reverse proxy configuration is correct

### Database Connection Issues

If the backend cannot connect to the database:
1. Verify that the database container is running
2. Check the database connection parameters in the backend service
3. Ensure the database credentials are correct

## Best Practices

1. Always use specific versions for base images in production
2. Regularly update dependencies and rebuild images
3. Use multi-stage builds to reduce image size
4. Implement health checks in production environments
5. Use Docker secrets for sensitive configuration data
6. Regularly scan images for vulnerabilities
7. Use resource limits to prevent containers from consuming excessive resources
8. Implement proper logging strategies for production environments

## Recent Enhancements

The Docker configuration has been enhanced with:
1. Improved Nginx configuration with better error handling
2. Health checks for all services
3. Better resource management with restart policies
4. Enhanced reverse proxy configuration for API requests
5. Improved caching for static assets