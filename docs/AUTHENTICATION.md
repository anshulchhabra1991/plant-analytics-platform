# JWT Authentication Setup

This project now includes JWT authentication following a microservices pattern with a dedicated Auth-Service. Here's how it works:

## Architecture

```
[1] User → FE (Login page/form)
[2] FE → Gateway → Auth-Service (POST /login)
[3] Auth-Service → DB (Validate credentials)
[4] Auth-Service → FE (JWT tokens)
[5] FE → Gateway → Backend-API (with token)
[6] Gateway → Auth-Service (verify token)
[7] Backend-API → DB / Redis / MQ etc.
[8] Backend → Response → FE
```

### Services
- **Frontend**: Login/register forms and token management
- **API Gateway**: Routes requests and verifies tokens with Auth-Service
- **Auth-Service**: Dedicated authentication service with database
- **Backend API**: Protected by gateway authentication

## Default Users

The system comes with two default users for testing:

### Admin User
- **Email**: admin@plantanalytics.com
- **Password**: password123
- **Roles**: admin, user

### Regular User
- **Email**: user@plantanalytics.com
- **Password**: password123
- **Roles**: user

## API Endpoints

### Auth-Service Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/verify` - Verify JWT token
- `POST /auth/refresh` - Refresh access token
- `GET /auth/health` - Health check

### Gateway Endpoints (Proxy to Auth-Service)
- `POST /auth/login` - Proxy to Auth-Service
- `POST /auth/register` - Proxy to Auth-Service
- `POST /auth/verify` - Proxy to Auth-Service
- `POST /auth/refresh` - Proxy to Auth-Service

### Protected Endpoints
- `GET /api/*` - All API endpoints require authentication
- `GET /public/*` - Optional authentication (for public data)

## Frontend Features

- **Login/Register Forms**: Clean, responsive authentication forms
- **Token Management**: Automatic token storage and refresh
- **Token Verification**: Validates tokens on app startup
- **User Profile**: Display user information and roles
- **Logout**: Secure token removal

## Security Features

- **JWT Tokens**: Access tokens (15min) and refresh tokens (7 days)
- **Password Hashing**: bcrypt with 12 salt rounds
- **Role-based Access**: Support for different user roles
- **Token Validation**: Automatic token verification on protected routes
- **Database Storage**: User data stored in PostgreSQL
- **Microservice Architecture**: Dedicated Auth-Service for security

## Environment Variables

Set these environment variables for production:

```bash
# Auth-Service
AUTH_SERVICE_PORT=5001
JWT_SECRET=your-super-secret-jwt-key-here
POSTGRES_HOST=postgres
POSTGRES_USER=plantuser
POSTGRES_PASSWORD=plantpassword123
POSTGRES_DB=plant_analytics

# API Gateway
AUTH_SERVICE_URL=http://auth-service:5000
GATEWAY_PORT=8000

# Frontend
API_GATEWAY_URL=http://localhost:8000
```

## Usage

1. **Start the services**:
   ```bash
   docker-compose up
   ```

2. **Access the frontend**: http://localhost:4000

3. **Login with default credentials**:
   - Email: admin@plantanalytics.com
   - Password: password123

4. **Register new users** or use the existing ones

## Service Architecture

### Auth-Service (`apps/auth-service/`)
- **Port**: 5001 (external), 5000 (internal)
- **Database**: PostgreSQL with users table
- **Features**: User management, JWT generation, token verification
- **Endpoints**: `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/refresh`

### API Gateway (`apps/api-gateway/`)
- **Port**: 8000
- **Features**: Request routing, token verification via Auth-Service
- **Authentication**: Calls Auth-Service for token validation

### Frontend (`apps/frontend/`)
- **Port**: 4000
- **Features**: Login/register UI, token management
- **Authentication**: Stores tokens, calls Gateway for API access

### Backend API (`apps/backend-api/`)
- **Port**: 3000
- **Features**: Business logic, data processing
- **Protection**: All routes protected by Gateway authentication

## Development

The authentication follows a clean microservices pattern:
1. **Auth-Service** handles all authentication logic
2. **Gateway** proxies auth requests and verifies tokens
3. **Frontend** manages user sessions and tokens
4. **Backend** focuses on business logic

This architecture provides better separation of concerns, scalability, and security. 