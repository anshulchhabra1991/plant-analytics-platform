# Error Codes and Status Documentation

## 1. Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "path": "/api/power-plants/top"
  }
}
```

## 2. HTTP Status Codes

### 2.1 Success Codes (2xx)
| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request successful |
| 201 | CREATED | Resource created successfully |
| 202 | ACCEPTED | Request accepted for processing |
| 204 | NO_CONTENT | Successful request with no content |

### 2.2 Client Error Codes (4xx)
| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid request format or parameters |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict |
| 422 | UNPROCESSABLE_ENTITY | Validation errors |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |

### 2.3 Server Error Codes (5xx)
| Status | Code | Description |
|--------|------|-------------|
| 500 | INTERNAL_SERVER_ERROR | Unexpected server error |
| 502 | BAD_GATEWAY | Gateway error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |
| 504 | GATEWAY_TIMEOUT | Gateway timeout |

## 3. Authentication Errors

### 3.1 AUTH_001 - Invalid Credentials
```json
{
  "error": {
    "code": "AUTH_001",
    "message": "Invalid email or password",
    "details": "The provided credentials do not match any user account",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "path": "/auth/login"
  }
}
```

### 3.2 AUTH_002 - Token Expired
```json
{
  "error": {
    "code": "AUTH_002",
    "message": "Access token has expired",
    "details": "Please login again",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_def456",
    "path": "/api/power-plants/top"
  }
}
```

### 3.3 AUTH_003 - Invalid Token
```json
{
  "error": {
    "code": "AUTH_003",
    "message": "Invalid or malformed token",
    "details": "The provided JWT token is invalid or corrupted",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_ghi789",
    "path": "/api/power-plants/top"
  }
}
```

### 3.4 AUTH_004 - Account Disabled
```json
{
  "error": {
    "code": "AUTH_004",
    "message": "User account is disabled",
    "details": "This account has been deactivated. Contact administrator",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_jkl012",
    "path": "/auth/login"
  }
}
```

### 3.5 AUTH_005 - Insufficient Permissions
```json
{
  "error": {
    "code": "AUTH_005",
    "message": "Insufficient permissions for this operation",
    "details": "User does not have access to DELETE operations",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_mno345",
    "path": "/api/data/delete"
  }
}
```

## 4. Validation Errors

### 4.1 VAL_001 - Missing Required Field
```json
{
  "error": {
    "code": "VAL_001",
    "message": "Missing required field",
    "details": {
      "field": "email",
      "location": "body",
      "expected": "string"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_pqr678",
    "path": "/auth/register"
  }
}
```

### 4.2 VAL_002 - Invalid Format
```json
{
  "error": {
    "code": "VAL_002",
    "message": "Invalid field format",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "expected": "Valid email address",
      "pattern": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_stu901",
    "path": "/auth/register"
  }
}
```

### 4.3 VAL_003 - Value Out of Range
```json
{
  "error": {
    "code": "VAL_003",
    "message": "Value out of acceptable range",
    "details": {
      "field": "limit",
      "value": 1000,
      "min": 1,
      "max": 100
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_vwx234",
    "path": "/api/power-plants/top"
  }
}
```

### 4.4 VAL_004 - Duplicate Value
```json
{
  "error": {
    "code": "VAL_004",
    "message": "Duplicate value detected",
    "details": {
      "field": "email",
      "value": "user@example.com",
      "constraint": "unique_email"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_yza567",
    "path": "/auth/register"
  }
}
```

## 5. Data Processing Errors

### 5.1 DATA_001 - File Upload Error
```json
{
  "error": {
    "code": "DATA_001",
    "message": "File upload failed",
    "details": {
      "filename": "egrid_data.csv",
      "size": "150MB",
      "maxSize": "100MB",
      "reason": "File size exceeds maximum allowed limit"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_bcd890",
    "path": "/api/upload/csv"
  }
}
```

### 5.2 DATA_002 - Invalid CSV Format
```json
{
  "error": {
    "code": "DATA_002",
    "message": "Invalid CSV file format",
    "details": {
      "filename": "egrid_data.csv",
      "line": 150,
      "column": "net_generation",
      "expected": "numeric",
      "received": "text"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_efg123",
    "path": "/api/upload/csv"
  }
}
```

### 5.3 DATA_003 - Processing Timeout
```json
{
  "error": {
    "code": "DATA_003",
    "message": "Data processing timeout",
    "details": {
      "jobId": "job_12345",
      "timeout": "300s",
      "recordsProcessed": 50000,
      "totalRecords": 100000
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_hij456",
    "path": "/api/processing/status"
  }
}
```

## 6. Database Errors

### 6.1 DB_001 - Connection Error
```json
{
  "error": {
    "code": "DB_001",
    "message": "Database connection failed",
    "details": "Unable to establish connection to PostgreSQL server",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_klm789",
    "path": "/api/power-plants/top"
  }
}
```

### 6.2 DB_002 - Query Timeout
```json
{
  "error": {
    "code": "DB_002",
    "message": "Database query timeout",
    "details": {
      "query": "SELECT * FROM egrid_data WHERE...",
      "timeout": "30s",
      "suggestion": "Consider adding filters to reduce result set"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_nop012",
    "path": "/api/power-plants/search"
  }
}
```

### 6.3 DB_003 - Constraint Violation
```json
{
  "error": {
    "code": "DB_003",
    "message": "Database constraint violation",
    "details": {
      "constraint": "chk_year",
      "table": "egrid_data",
      "column": "year",
      "value": 2050,
      "message": "Year must be between 1990 and 2030"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_qrs345",
    "path": "/api/data/insert"
  }
}
```

## 7. External Service Errors

### 7.1 EXT_001 - Cache Service Error
```json
{
  "error": {
    "code": "EXT_001",
    "message": "Cache service unavailable",
    "details": {
      "service": "redis",
      "host": "redis:6379",
      "fallback": "Database query executed directly"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_tuv678",
    "path": "/api/power-plants/top"
  }
}
```

### 7.2 EXT_002 - Message Queue Error
```json
{
  "error": {
    "code": "EXT_002",
    "message": "Message queue error",
    "details": {
      "service": "rabbitmq",
      "queue": "data_processing",
      "operation": "publish",
      "error": "Connection refused"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_wxy901",
    "path": "/api/processing/start"
  }
}
```

## 8. Rate Limiting Errors

### 8.1 RATE_001 - API Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_001",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "60s",
      "remaining": 0,
      "resetTime": "2024-01-15T10:31:00Z"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_zab234",
    "path": "/api/power-plants/top"
  }
}
```

## 9. Security Errors

### 9.1 SEC_001 - Suspicious Activity
```json
{
  "error": {
    "code": "SEC_001",
    "message": "Suspicious activity detected",
    "details": {
      "reason": "Multiple failed login attempts",
      "attempts": 5,
      "timeWindow": "5 minutes",
      "action": "Account temporarily locked"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_cde567",
    "path": "/auth/login"
  }
}
```

### 9.2 SEC_002 - Unauthorized Access Attempt
```json
{
  "error": {
    "code": "SEC_002",
    "message": "Unauthorized access attempt",
    "details": {
      "resource": "/admin/users",
          "userId": "user123",
    "operation": "DELETE",
      "action": "Access denied and logged"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_fgh890",
    "path": "/admin/users"
  }
}
```

## 10. Error Handling Best Practices

### 10.1 Client-Side Error Handling
```typescript
// Example error handling in TypeScript
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
  path: string;
}

const handleApiError = (error: ApiError) => {
  switch (error.code) {
    case 'AUTH_002':
      // Token expired - redirect to login
      redirectToLogin();
      break;
    case 'VAL_001':
    case 'VAL_002':
      // Validation errors - show field errors
      showValidationErrors(error.details);
      break;
    case 'RATE_001':
      // Rate limit - show retry time
      showRateLimitMessage(error.details.resetTime);
      break;
    default:
      // Generic error handling
      showGenericError(error.message);
  }
};
```

### 10.2 Logging and Monitoring
```yaml
# Error metrics to track
error_metrics:
  - error_count_by_code
  - error_rate_by_endpoint  
  - authentication_failures
  - validation_errors
  - database_errors
  - external_service_errors
  
# Alerting thresholds
alerts:
  - error_rate > 5% for 5 minutes
  - authentication_failures > 10 per minute
  - database_errors > 0
  - external_service_errors > 3 per minute
``` 