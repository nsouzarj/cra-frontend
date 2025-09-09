# Testing Docker Setup

## Prerequisites
1. Docker and Docker Compose installed
2. Backend service image available (craweb/cra-backend:latest)

## Steps to Test

### 1. Build and Start Services
```bash
docker-compose up --build
```

### 2. Verify Services are Running
```bash
docker-compose ps
```

You should see all services in the "Up" state.

### 3. Test Frontend Access
Open your browser and navigate to:
- http://localhost:4200

### 4. Test API Proxy
Try accessing an API endpoint through the proxy:
- http://localhost:4200/cra-api/actuator/health

### 5. Test Mobile/Network Access
From other devices on the same network, you can access:
- Frontend: http://192.168.1.105:4200
- API: http://192.168.1.105:8081/cra-api/actuator/health

### 6. Check Logs if Issues Occur
```bash
# Check frontend logs
docker-compose logs frontend

# Check backend logs
docker-compose logs backend

# Check database logs
docker-compose logs database
```

## Common Issues and Solutions

### Issue: "host not found in upstream" error
**Solution**: This should be fixed with our updated Nginx configuration that uses dynamic DNS resolution.

### Issue: Backend service not starting
**Solution**: 
1. Verify the backend image exists:
   ```bash
   docker images | grep cra-backend
   ```
2. If not, build the backend image first or pull it from a registry.

### Issue: Database connection errors
**Solution**:
1. Check database credentials in docker-compose.yml
2. Ensure the database service is healthy:
   ```bash
   docker-compose logs database
   ```

## Health Checks
The updated configuration includes:
- Restart policies for all services
- Health checks in docker-compose.override.yml
- Proper error handling in Nginx configuration

## Expected Behavior
1. Frontend should start and serve the Angular application
2. API requests to `/cra-api/*` should be proxied to the backend service
3. If backend is unavailable, users should see a friendly error message
4. All services should maintain connectivity within the Docker network
5. Other devices on the same network should be able to access the services using IP 192.168.1.105