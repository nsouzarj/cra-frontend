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

### Issue: Health check failures
**Solution**:
1. Check the health check configuration in docker-compose.override.yml
2. Verify that services are properly responding to health check requests
3. Adjust health check intervals and timeouts if needed

## Health Checks
The updated configuration includes:
- Restart policies for all services to handle temporary failures
- Health checks in docker-compose.override.yml with proper configuration
- Proper error handling in Nginx configuration with custom error pages
- Start period configuration to allow services to initialize before health checks

## Expected Behavior
1. Frontend should start and serve the Angular application
2. API requests to `/cra-api/*` should be proxied to the backend service
3. If backend is unavailable, users should see a friendly error message
4. All services should maintain connectivity within the Docker network
5. Other devices on the same network should be able to access the services using IP 192.168.1.105

## Testing Specific Functionality

### File Upload/Download Testing
1. Navigate to a request detail page
2. Try uploading a file attachment
3. Verify that the file is properly stored and can be downloaded
4. Check that the attachment origin coloring is working correctly (blue for correspondent, green for requester)

### Status Management Testing
1. Create a new request and verify it starts with "Aguardando Confirmação" status
2. Change the status through the correspondent interface
3. Verify that status changes are properly reflected in the UI
4. Check that correspondent observations are properly captured and displayed

### Currency Formatting Testing
1. Create or edit a request with "Audiência" or "Diligência" type
2. Enter a monetary value in the valor field
3. Verify that the value is properly formatted according to Brazilian standards (R$ 0,00)

## Performance Testing

### Container Resource Usage
```bash
# Check resource usage
docker stats

# Check container sizes
docker ps -s
```

### Response Time Testing
1. Use browser developer tools to check page load times
2. Verify that static assets are properly cached
3. Check API response times through the proxy

## Recent Enhancements Testing

### Nginx Configuration
1. Verify that gzip compression is working for static assets
2. Check that the reverse proxy is properly forwarding API requests
3. Test error handling when backend services are unavailable

### Health Check Improvements
1. Verify that services restart properly after failures
2. Check that health checks properly detect service availability
3. Test startup order dependencies between services

### Security Enhancements
1. Verify that only necessary ports are exposed
2. Check that services are properly isolated on the custom network
3. Verify that sensitive data is not exposed in logs