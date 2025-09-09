# Docker Configuration Fixes

## Problem
The Nginx frontend container was failing to start with the error:
```
host not found in upstream "backend" in /etc/nginx/nginx.conf:23
```

## Root Cause
The issue was caused by Nginx trying to resolve the "backend" hostname before the backend service was fully started and available in the Docker network.

## Solutions Applied

### 1. Updated Nginx Configuration
Modified [nginx.conf](file:///d:/Projetos/craweb/cra-frontend/nginx.conf) to:
- Define an upstream block for the backend service with proper error handling
- Add timeout configurations for backend connections
- Provide a fallback error page when the backend is unavailable

### 2. Enhanced Dockerfile
Updated [Dockerfile](file:///d:/Projetos/craweb/cra-frontend/Dockerfile) to:
- Copy the backend error page to the Nginx HTML directory
- Ensure proper startup sequence

### 3. Added Health Checks
Created [docker-compose.override.yml](file:///d:/Projetos/ccra-frontend/docker-compose.override.yml) with:
- Health checks for both frontend and backend services
- Proper startup dependencies and timing

### 4. Error Handling
Added a custom error page [backend-error.html](file:///d:/Projetos/craweb/cra-frontend/src/backend-error.html) that will be displayed when the backend service is unavailable.

## How to Test the Fix
1. Build and start the services:
   ```bash
   docker-compose up --build
   ```

2. The frontend should now start successfully and proxy API requests to the backend service.

3. If the backend is unavailable, users will see a friendly error message instead of a Nginx error.

## Additional Notes
- The backend service automatically adds the '/api' prefix to all routes, so frontend calls should use paths like `/cra-api/auth` instead of `/cra-api/api/auth`
- The frontend and backend services are on the same Docker network and can communicate using service names
- The health checks ensure proper startup order and service availability
- For development access from other devices on the same network, use your machine's IP address: http://192.168.1.105:8081/cra-api