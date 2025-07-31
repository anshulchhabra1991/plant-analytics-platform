# Security Architecture

## 1. Authentication System

### 1.1 JWT-Based Authentication
The platform uses JSON Web Tokens (JWT) for stateless authentication:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    Auth     │───▶│  Database   │
│ (Frontend)  │    │  Service    │    │  (Users)    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │
       │            ┌─────────────┐
       └────────────│  JWT Token  │
                    │ (Response)  │
                    └─────────────┘
```

### 1.2 Token Structure
**Access Token (1 hour TTL)**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user123",
    "email": "user@example.com",
    "iat": 1642680000,
    "exp": 1642680900
  }
}
```



### 1.3 Authentication Flow
1. **Login**: User provides credentials to Auth Service
2. **Validation**: Auth Service validates against database
3. **Token Generation**: Access token generated
4. **Response**: Tokens returned to client
5. **Storage**: Client stores tokens securely
6. **Usage**: Access token sent with API requests
7. **Expiry**: User must re-login when token expires

## 2. Authorization System

### 2.1 JWT Token-Based Access Control
All authenticated users have access to the platform's features. Access control is managed at the application level through JWT token validation.

### 2.3 Authorization Implementation
```typescript
// Middleware example
@UseGuards(JwtAuthGuard)
@Get('power-plants/top')
async getTopPowerPlants() {
  // Implementation
}
```

## 3. Data Protection

### 3.1 Encryption at Rest
- **Database**: PostgreSQL with TDE (Transparent Data Encryption)
- **Files**: MinIO with server-side encryption (SSE)
- **Passwords**: bcrypt hashing with salt rounds = 12

### 3.2 Encryption in Transit
- **HTTPS/TLS 1.3**: All external communications
- **Internal TLS**: Service-to-service communication
- **Certificate Management**: Let's Encrypt with auto-renewal

### 3.3 Data Classification
```
┌─────────────────────────────────────────────────────────────┐
│                    Data Classification                      │
├─────────────────────────────────────────────────────────────┤
│  PUBLIC                                                     │
│    ├── API documentation                                    │
│    └── System status                                        │
├─────────────────────────────────────────────────────────────┤
│  INTERNAL                                                   │
│    ├── Power plant analytics data                          │
│    ├── User profiles (non-PII)                             │
│    └── System metrics                                       │
├─────────────────────────────────────────────────────────────┤
│  CONFIDENTIAL                                               │
│    ├── User credentials                                     │
│    ├── JWT secrets                                          │
│    └── Database passwords                                   │
├─────────────────────────────────────────────────────────────┤
│  RESTRICTED                                                 │
│    ├── Audit logs                                           │
│    └── System configuration                                 │
└─────────────────────────────────────────────────────────────┘
```

## 4. Network Security

### 4.1 Network Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                       Internet                             │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                           │
│                     (WAF + DDoS)                           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      DMZ Subnet                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Frontend Services                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Private Subnet                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  API Layer  │ │ Auth Service│ │    Backend Services     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Database Subnet                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ PostgreSQL  │ │    Redis    │ │       RabbitMQ          │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Security Groups
```yaml
# Frontend Security Group
frontend_sg:
  ingress:
    - port: 443 (HTTPS)
      source: 0.0.0.0/0
    - port: 80 (HTTP redirect)
      source: 0.0.0.0/0
  egress:
    - port: 8000
      source: api_gateway_sg

# API Gateway Security Group  
api_gateway_sg:
  ingress:
    - port: 8000
      source: frontend_sg
  egress:
    - port: 3000
      source: backend_sg
    - port: 5001
      source: auth_sg

# Database Security Group
database_sg:
  ingress:
    - port: 5432
      source: backend_sg
    - port: 6379
      source: backend_sg
  egress: none
```

## 5. Security Monitoring

### 5.1 Audit Logging
All security events are logged:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "LOGIN_SUCCESS",
  "userId": "user123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "requestId": "req123"
}
```

### 5.2 Security Metrics
- Failed login attempts per IP
- JWT token validation failures  
- Unusual access patterns
- API rate limit violations
- Database access anomalies

### 5.3 Incident Response
```
┌─────────────────────────────────────────────────────────────┐
│                 Security Incident Response                 │
├─────────────────────────────────────────────────────────────┤
│  1. Detection                                               │
│     ├── Automated alerts                                    │
│     ├── Log analysis                                        │
│     └── User reports                                        │
├─────────────────────────────────────────────────────────────┤
│  2. Assessment                                              │
│     ├── Severity classification                             │
│     ├── Impact analysis                                     │
│     └── Root cause identification                           │
├─────────────────────────────────────────────────────────────┤
│  3. Containment                                             │
│     ├── Account lockout                                     │
│     ├── IP blocking                                         │
│     └── Service isolation                                   │
├─────────────────────────────────────────────────────────────┤
│  4. Recovery                                                │
│     ├── System restoration                                  │
│     ├── Password resets                                     │
│     └── Token revocation                                    │
└─────────────────────────────────────────────────────────────┘
```

## 6. Compliance & Standards

### 6.1 Security Standards
- **OWASP Top 10**: Protection against common vulnerabilities
- **NIST Framework**: Cybersecurity framework implementation  
- **ISO 27001**: Information security management
- **SOC 2 Type II**: Security and availability controls

### 6.2 Data Privacy
- **Data Minimization**: Collect only necessary data
- **Data Retention**: Automated cleanup policies
- **Right to Delete**: User data deletion capabilities
- **Data Portability**: Export functionality

### 6.3 Regular Security Assessments
- **Vulnerability Scans**: Weekly automated scans
- **Penetration Testing**: Quarterly external testing
- **Code Security Review**: Pre-deployment static analysis
- **Dependency Scanning**: Daily vulnerability checks 