# API Endpoints

## Authentication Endpoints

### POST /auth/login
**Description**: User authentication
**Request Body**:
```json
{
  "email": "admin@plantanalytics.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",

  "user": {
    "id": 1,
    "email": "admin@plantanalytics.com"
  }
}
```

### POST /auth/register
**Description**: User registration
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### POST /auth/verify
**Description**: Verify JWT token
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "admin@plantanalytics.com"
  }
}
```

## Power Plants API

### GET /api/power-plants/top
**Description**: Get top power plants by net generation
**Query Parameters**:
- `limit` (number): Number of results (default: 10)
- `state` (string): Filter by state code
- `year` (number): Filter by year

**Response**:
```json
{
  "data": [
    {
      "plantName": "Plant A",
      "state": "CA",
      "netGeneration": 1500000,
      "primaryFuel": "Natural Gas"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### GET /api/power-plants/states
**Description**: Get all available states
**Response**:
```json
{
  "states": [
    {"code": "CA", "name": "California"},
    {"code": "TX", "name": "Texas"}
  ]
}
```

## Health Check

### GET /health
**Description**: Service health status
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy"
  }
}
``` 