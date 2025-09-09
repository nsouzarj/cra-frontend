# Docker Setup Guide for CRA Frontend

## Configuration Summary
Your system is configured with the following settings:
- Machine IP: 192.168.1.105
- Frontend port: 4200
- Backend port: 8081
- Database port: 5432

## File Configurations

### 1. nginx.conf
The Nginx configuration is set to proxy API requests to the backend service using Docker's internal DNS:
```nginx
location /cra-api/ {
    resolver 127.0.0.11 valid=30s;
    set $backend "http://backend:8080";
    proxy_pass $backend/api/;
    # ... other proxy settings
}
```

### 2. docker-compose.yml
Services are configured with proper networking:
- Frontend: Maps host port 4200 to container port 80
- Backend: Maps host port 8081 to container port 8080
- Database: Maps host port 5432 to container port 5432

### 3. environment.ts
Development environment API URL:
```typescript
apiUrl: 'http://192.168.1.105:8081/cra-api'
```

## Running the Application

### 1. Build and Start Services
```bash
docker-compose up --build
```

### 2. Access the Application
- Frontend: http://192.168.1.105:4200
- Backend API: http://192.168.1.105:8081/cra-api/
- Database: localhost:5432 (from host)

### 3. Stopping Services
```bash
docker-compose down
```

## Troubleshooting

### Common Issues

1. **"host not found in upstream" error**
   - This should be resolved with the dynamic DNS resolver in nginx.conf
   - Ensure all services are on the same network (cra-network)

2. **Port conflicts**
   - Make sure ports 4200, 8081, and 5432 are not being used by other applications
   - You can change port mappings in docker-compose.yml if needed

3. **Backend service not starting**
   - Check if the backend image exists: `docker images | grep cra-backend`
   - If not, you may need to build it separately or pull from a registry

### Checking Service Status
```bash
# View running services
docker-compose ps

# Check logs for specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs database
```

## Network Access
From other devices on the same network (Wi-Fi), you can access:
- Frontend: http://192.168.1.105:4200
- Backend API: http://192.168.1.105:8081/cra-api/

## Service Dependencies
The services have the following dependencies:
```
frontend ──depends on──► backend ──depends on──► database
```

This ensures proper startup order.